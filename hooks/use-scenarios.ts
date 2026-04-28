"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Scenario,
  ScenarioBaseState,
  ScenarioModification,
} from "@/lib/db/queries/scenarios";

interface ScenariosResponse {
  scenarios: Scenario[];
  total: number;
  hasMore: boolean;
}

interface ScenarioResponse {
  scenario: Scenario;
}

interface CompareResponse {
  scenarios: Scenario[];
  comparison: {
    best_completion_date: string;
    best_probability: string;
    lowest_risk: string;
    recommendation: string;
  };
}

// ============================================
// SCENARIOS
// ============================================

export function useScenarios(options: {
  type?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const params = new URLSearchParams();
  if (options.type) params.set("type", options.type);
  if (options.status) params.set("status", options.status);
  if (options.limit) params.set("limit", options.limit.toString());
  if (options.offset) params.set("offset", options.offset.toString());

  return useQuery<ScenariosResponse>({
    queryKey: ["scenarios", options],
    queryFn: async () => {
      const res = await fetch(`/api/scenarios?${params.toString()}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch scenarios");
      }
      return res.json();
    },
  });
}

export function useScenario(scenarioId: string | undefined) {
  return useQuery<ScenarioResponse>({
    queryKey: ["scenario", scenarioId],
    queryFn: async () => {
      const res = await fetch(`/api/scenarios/${scenarioId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch scenario");
      }
      return res.json();
    },
    enabled: !!scenarioId,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      scenario_type: "capacity" | "scope" | "timeline" | "dependency" | "custom";
      base_state: ScenarioBaseState;
      modifications: ScenarioModification[];
    }) => {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create scenario");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scenarioId,
      updates,
    }: {
      scenarioId: string;
      updates: {
        name?: string;
        description?: string | null;
        modifications?: ScenarioModification[];
      };
    }) => {
      const res = await fetch(`/api/scenarios/${scenarioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update scenario");
      }
      return res.json();
    },
    onSuccess: (_, { scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["scenario", scenarioId] });
    },
  });
}

export function useDeleteScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scenarioId: string) => {
      const res = await fetch(`/api/scenarios/${scenarioId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete scenario");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });
}

// ============================================
// SIMULATION
// ============================================

export function useRunScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scenarioId: string) => {
      const res = await fetch(`/api/scenarios/${scenarioId}/run`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to run scenario");
      }
      return res.json();
    },
    onSuccess: (_, scenarioId) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["scenario", scenarioId] });
    },
  });
}

export function useCloneScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scenarioId,
      name,
    }: {
      scenarioId: string;
      name: string;
    }) => {
      const res = await fetch(`/api/scenarios/${scenarioId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to clone scenario");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });
}

// ============================================
// COMPARISON
// ============================================

export function useCompareScenarios() {
  return useMutation<CompareResponse, Error, string[]>({
    mutationFn: async (scenarioIds: string[]) => {
      const res = await fetch("/api/scenarios/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioIds }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to compare scenarios");
      }
      return res.json();
    },
  });
}

// ============================================
// DERIVED HOOKS
// ============================================

export function useCompletedScenarios() {
  return useScenarios({ status: "completed" });
}

export function useDraftScenarios() {
  return useScenarios({ status: "draft" });
}
