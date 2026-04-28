"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Rubric {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  completenessWeight: number;
  clarityWeight: number;
  estimabilityWeight: number;
  traceabilityWeight: number;
  testabilityWeight: number;
  customRules: unknown[];
  createdAt: string;
  updatedAt: string;
}

export function useRubrics() {
  return useQuery<{ rubrics: Rubric[] }>({
    queryKey: ["rubrics"],
    queryFn: async () => {
      const response = await fetch("/api/rubrics");
      if (!response.ok) {
        throw new Error("Failed to fetch rubrics");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRubric(rubricId: string | null) {
  return useQuery<Rubric>({
    queryKey: ["rubric", rubricId],
    queryFn: async () => {
      if (!rubricId) throw new Error("Rubric ID required");
      const response = await fetch(`/api/rubrics/${rubricId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch rubric");
      }
      return response.json();
    },
    enabled: !!rubricId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRubric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      completenessWeight?: number;
      clarityWeight?: number;
      estimabilityWeight?: number;
      traceabilityWeight?: number;
      testabilityWeight?: number;
      customRules?: unknown[];
      isDefault?: boolean;
    }) => {
      const response = await fetch("/api/rubrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create rubric");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rubrics"] });
    },
  });
}

export function useUpdateRubric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rubricId,
      data,
    }: {
      rubricId: string;
      data: Partial<{
        name: string;
        description: string;
        completenessWeight: number;
        clarityWeight: number;
        estimabilityWeight: number;
        traceabilityWeight: number;
        testabilityWeight: number;
        customRules: unknown[];
        isDefault: boolean;
      }>;
    }) => {
      const response = await fetch(`/api/rubrics/${rubricId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update rubric");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rubrics"] });
      queryClient.invalidateQueries({
        queryKey: ["rubric", variables.rubricId],
      });
    },
  });
}

export function useDeleteRubric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rubricId: string) => {
      const response = await fetch(`/api/rubrics/${rubricId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete rubric");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rubrics"] });
    },
  });
}
