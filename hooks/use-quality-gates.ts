"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  QualityGate,
  QualityViolation,
  GateCondition,
  GateAction,
  GateCheckResult,
} from "@/lib/db/queries/quality-gates";

interface GatesResponse {
  gates: QualityGate[];
}

interface ViolationsResponse {
  violations: QualityViolation[];
  total: number;
  hasMore: boolean;
  stats?: {
    total: number;
    open: number;
    resolved: number;
    waived: number;
    by_gate: Record<string, number>;
    by_severity: Record<string, number>;
  };
}

interface CheckResponse {
  results: GateCheckResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    allPassed: boolean;
    blockingFailed: boolean;
  };
}

// ============================================
// QUALITY GATES
// ============================================

export function useQualityGates(options: {
  activeOnly?: boolean;
  trigger?: string;
} = {}) {
  const params = new URLSearchParams();
  if (options.activeOnly) params.set("activeOnly", "true");
  if (options.trigger) params.set("trigger", options.trigger);

  return useQuery<GatesResponse>({
    queryKey: ["quality-gates", options],
    queryFn: async () => {
      const res = await fetch(`/api/quality-gates?${params.toString()}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch quality gates");
      }
      return res.json();
    },
  });
}

export function useCreateQualityGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      trigger: "on_status_change" | "on_sprint_start" | "on_sprint_end" | "manual";
      conditions: GateCondition[];
      actions: GateAction[];
      is_blocking?: boolean;
    }) => {
      const res = await fetch("/api/quality-gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create quality gate");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-gates"] });
    },
  });
}

export function useUpdateQualityGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gateId,
      updates,
    }: {
      gateId: string;
      updates: Partial<QualityGate>;
    }) => {
      const res = await fetch(`/api/quality-gates/${gateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update quality gate");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-gates"] });
    },
  });
}

export function useDeleteQualityGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gateId: string) => {
      const res = await fetch(`/api/quality-gates/${gateId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete quality gate");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-gates"] });
    },
  });
}

// ============================================
// GATE CHECKING
// ============================================

export function useCheckQualityGates() {
  return useMutation<
    CheckResponse,
    Error,
    {
      storyId: string;
      trigger: "on_status_change" | "on_sprint_start" | "on_sprint_end" | "manual";
    }
  >({
    mutationFn: async ({ storyId, trigger }) => {
      const res = await fetch("/api/quality-gates/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, trigger }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to check quality gates");
      }
      return res.json();
    },
  });
}

// ============================================
// VIOLATIONS
// ============================================

export function useQualityViolations(options: {
  status?: string;
  gateId?: string;
  storyId?: string;
  limit?: number;
  offset?: number;
  includeStats?: boolean;
} = {}) {
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  if (options.gateId) params.set("gateId", options.gateId);
  if (options.storyId) params.set("storyId", options.storyId);
  if (options.limit) params.set("limit", options.limit.toString());
  if (options.offset) params.set("offset", options.offset.toString());
  if (options.includeStats) params.set("stats", "true");

  return useQuery<ViolationsResponse>({
    queryKey: ["quality-violations", options],
    queryFn: async () => {
      const res = await fetch(
        `/api/quality-gates/violations?${params.toString()}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch violations");
      }
      return res.json();
    },
  });
}

export function useUpdateViolationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      violationId,
      status,
      waiver_reason,
    }: {
      violationId: string;
      status: "acknowledged" | "resolved" | "waived";
      waiver_reason?: string;
    }) => {
      const res = await fetch(`/api/quality-gates/violations/${violationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, waiver_reason }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update violation");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-violations"] });
    },
  });
}

// ============================================
// DERIVED HOOKS
// ============================================

export function useOpenViolationsCount() {
  const { data } = useQualityViolations({
    status: "open",
    limit: 1,
    includeStats: true,
  });
  return data?.stats?.open || 0;
}

export function useActiveGatesCount() {
  const { data } = useQualityGates({ activeOnly: true });
  return data?.gates?.length || 0;
}
