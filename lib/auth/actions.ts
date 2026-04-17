"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type AuthResult = {
  success: boolean;
  error?: string;
  redirectTo?: string;
};

export async function signUp(formData: FormData): Promise<AuthResult> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    fullName: formData.get("fullName") as string,
  };

  // Validate input
  const validated = signUpSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0].message,
    };
  }

  const { email, password, fullName } = validated.data;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    return {
      success: true,
      redirectTo: "/signup/verify",
    };
  }

  return {
    success: true,
    redirectTo: "/onboarding",
  };
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate input
  const validated = signInSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0].message,
    };
  }

  const { email, password } = validated.data;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // Get redirect URL from query params or default to dashboard
  const redirectTo = formData.get("redirect") as string || "/";

  return {
    success: true,
    redirectTo,
  };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (data.url) {
    redirect(data.url);
  }

  return {
    success: false,
    error: "Failed to initiate Google sign-in",
  };
}

export async function signInWithGitHub(): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (data.url) {
    redirect(data.url);
  }

  return {
    success: false,
    error: "Failed to initiate GitHub sign-in",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email") as string;

  if (!email || !z.string().email().safeParse(email).success) {
    return {
      success: false,
      error: "Please enter a valid email address",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
  };
}

export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const password = formData.get("password") as string;

  if (!password || password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    redirectTo: "/",
  };
}

export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
