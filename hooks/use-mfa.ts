"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  enrollMFA,
  verifyMFAEnrollment,
  verifyMFACode,
  listMFAFactors,
  removeMFAFactor,
  getMFAAssuranceLevel,
} from "@/lib/auth/mfa";

export function useMFAFactors() {
  return useQuery({
    queryKey: ["mfa", "factors"],
    queryFn: async () => {
      const result = await listMFAFactors();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.factors;
    },
  });
}

export function useMFAAssuranceLevel() {
  return useQuery({
    queryKey: ["mfa", "assurance"],
    queryFn: getMFAAssuranceLevel,
  });
}

export function useEnrollMFA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enrollMFA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfa"] });
    },
  });
}

export function useVerifyMFAEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      factorId,
      code,
    }: {
      factorId: string;
      code: string;
    }) => {
      const result = await verifyMFAEnrollment(factorId, code);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfa"] });
    },
  });
}

export function useVerifyMFACode() {
  return useMutation({
    mutationFn: async ({
      factorId,
      code,
    }: {
      factorId: string;
      code: string;
    }) => {
      const result = await verifyMFACode(factorId, code);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
  });
}

export function useRemoveMFA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (factorId: string) => {
      const result = await removeMFAFactor(factorId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfa"] });
    },
  });
}
