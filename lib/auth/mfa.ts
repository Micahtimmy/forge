"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthResult } from "./actions";

export type MFAEnrollResult =
  | { success: true; qrCode: string; secret: string; factorId: string }
  | { success: false; error: string };

export type MFAVerifyResult =
  | { success: true }
  | { success: false; error: string };

export type MFAFactorsResult =
  | { success: true; factors: MFAFactor[] }
  | { success: false; error: string };

export interface MFAFactor {
  id: string;
  type: "totp";
  friendlyName: string | null;
  status: "verified" | "unverified";
  createdAt: string;
}

/**
 * Start MFA enrollment - generates QR code and secret
 */
export async function enrollMFA(): Promise<MFAEnrollResult> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "FORGE Authenticator",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    factorId: data.id,
  };
}

/**
 * Verify MFA enrollment with a code from authenticator app
 */
export async function verifyMFAEnrollment(
  factorId: string,
  code: string
): Promise<MFAVerifyResult> {
  const supabase = await createSupabaseServerClient();

  const { data: challengeData, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });

  if (challengeError) {
    return { success: false, error: challengeError.message };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  });

  if (verifyError) {
    return { success: false, error: verifyError.message };
  }

  return { success: true };
}

/**
 * Verify MFA code during login
 */
export async function verifyMFACode(
  factorId: string,
  code: string
): Promise<MFAVerifyResult> {
  const supabase = await createSupabaseServerClient();

  const { data: challengeData, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });

  if (challengeError) {
    return { success: false, error: challengeError.message };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  });

  if (verifyError) {
    return { success: false, error: verifyError.message };
  }

  return { success: true };
}

/**
 * List all enrolled MFA factors
 */
export async function listMFAFactors(): Promise<MFAFactorsResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.mfa.listFactors();

  if (error) {
    return { success: false, error: error.message };
  }

  const factors: MFAFactor[] = data.totp.map((f) => ({
    id: f.id,
    type: "totp" as const,
    friendlyName: f.friendly_name ?? null,
    status: f.status as "verified" | "unverified",
    createdAt: f.created_at,
  }));

  return { success: true, factors };
}

/**
 * Remove an MFA factor
 */
export async function removeMFAFactor(factorId: string): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.mfa.unenroll({ factorId });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get the current MFA assurance level
 */
export async function getMFAAssuranceLevel() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error) {
    return { level: null, error: error.message };
  }

  return {
    level: data.currentLevel,
    nextLevel: data.nextLevel,
    currentAuthenticationMethods: data.currentAuthenticationMethods,
  };
}

/**
 * Check if user has MFA enabled
 */
export async function hasMFAEnabled(): Promise<boolean> {
  const result = await listMFAFactors();
  if (!result.success) return false;
  return result.factors.some((f) => f.status === "verified");
}
