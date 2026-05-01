"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastActions } from "@/components/ui/toast";
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
  const toast = useToastActions();

  return useMutation({
    mutationFn: enrollMFA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfa"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to enroll MFA");
    },
  });
}

export function useVerifyMFAEnrollment() {
  const queryClient = useQueryClient();
  const toast = useToastActions();

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
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to verify MFA enrollment");
    },
  });
}

export function useVerifyMFACode() {
  const toast = useToastActions();

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
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to verify MFA code");
    },
  });
}

export function useRemoveMFA() {
  const queryClient = useQueryClient();
  const toast = useToastActions();

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
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove MFA");
    },
  });
}
