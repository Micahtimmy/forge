"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Decision, DecisionFilters } from "@/lib/db/queries/decisions";

interface DecisionsResponse {
  decisions: Decision[];
  total: number;
  hasMore: boolean;
}

interface DecisionResponse {
  decision: Decision;
}

interface DecisionStatsResponse {
  stats: {
    total: number;
    by_type: Record<string, number>;
    by_outcome: Record<string, number>;
    success_rate: number;
  };
}

// ============================================
// DECISIONS
// ============================================

export function useDecisions(filters: DecisionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.decision_type) params.set("decision_type", filters.decision_type);
  if (filters.outcome_status) params.set("outcome_status", filters.outcome_status);
  if (filters.sprint_id) params.set("sprint_id", filters.sprint_id.toString());
  if (filters.pi_id) params.set("pi_id", filters.pi_id);
  if (filters.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters.search) params.set("search", filters.search);
  if (filters.limit) params.set("limit", filters.limit.toString());
  if (filters.offset) params.set("offset", filters.offset.toString());

  return useQuery<DecisionsResponse>({
    queryKey: ["decisions", filters],
    queryFn: async () => {
      const res = await fetch(`/api/decisions?${params.toString()}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch decisions");
      }
      return res.json();
    },
  });
}

export function useDecision(decisionId: string | undefined) {
  return useQuery<DecisionResponse>({
    queryKey: ["decision", decisionId],
    queryFn: async () => {
      const res = await fetch(`/api/decisions/${decisionId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch decision");
      }
      return res.json();
    },
    enabled: !!decisionId,
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      decision_type: string;
      context?: {
        sprint_id?: number;
        pi_id?: string;
        linked_stories?: string[];
        linked_risks?: string[];
        linked_dependencies?: string[];
      };
      decision: {
        choice: string;
        alternatives_considered?: string[];
        rationale: string;
        expected_impact: string;
        risks_acknowledged?: string[];
      };
      tags?: string[];
      visibility?: "private" | "team" | "workspace";
      generate_ai_summary?: boolean;
    }) => {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create decision");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
    },
  });
}

export function useUpdateDecisionOutcome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      decisionId,
      outcome,
    }: {
      decisionId: string;
      outcome: {
        outcome_status: "pending" | "successful" | "partial" | "failed" | "unknown";
        outcome?: {
          actual_impact: string;
          lessons_learned: string;
          would_repeat: boolean;
        };
      };
    }) => {
      const res = await fetch(`/api/decisions/${decisionId}/outcome`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(outcome),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update outcome");
      }
      return res.json();
    },
    onSuccess: (_, { decisionId }) => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
      queryClient.invalidateQueries({ queryKey: ["decision", decisionId] });
    },
  });
}

export function useDeleteDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (decisionId: string) => {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete decision");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
    },
  });
}

// ============================================
// DECISION STATS
// ============================================

export function useDecisionStats() {
  return useQuery<DecisionStatsResponse>({
    queryKey: ["decision-stats"],
    queryFn: async () => {
      const res = await fetch("/api/decisions/stats");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch stats");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// SIMILAR DECISIONS
// ============================================

export function useSimilarDecisions(
  decisionType: string | undefined,
  enabled = true
) {
  return useQuery<{ decisions: Decision[] }>({
    queryKey: ["similar-decisions", decisionType],
    queryFn: async () => {
      const res = await fetch(
        `/api/decisions/similar?decision_type=${decisionType}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch similar decisions");
      }
      return res.json();
    },
    enabled: !!decisionType && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================
// PENDING REVIEWS
// ============================================

export function usePendingOutcomeReviews() {
  return useQuery<{ decisions: Decision[] }>({
    queryKey: ["pending-outcome-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/decisions/pending-reviews");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch pending reviews");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// LEGACY - Simple Decision Logger Support
// ============================================

/**
 * Simple decision creation hook for the legacy DecisionLogger component
 * Maps the simple schema to the full decision schema
 */
export function useCreateSimpleDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      reasoning?: string;
      affectedTickets?: string[];
      tags?: string[];
      signalUpdateId?: string;
    }) => {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          description: input.reasoning,
          decision_type: "other",
          context: {
            linked_stories: input.affectedTickets,
          },
          decision: {
            choice: input.title,
            rationale: input.reasoning || "No rationale provided",
            expected_impact: "To be determined",
          },
          tags: input.tags,
          generate_ai_summary: false,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create decision");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
    },
  });
}
