"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ProgramHealthScore,
  SprintPrediction,
} from "@/lib/db/queries/health";

interface HealthResponse {
  current: ProgramHealthScore | null;
  history: ProgramHealthScore[];
  hasData: boolean;
}

interface PredictionResponse {
  prediction: SprintPrediction | null;
}

// ============================================
// PROGRAM HEALTH
// ============================================

export function useProgramHealth(options: {
  piId?: string;
  days?: number;
  limit?: number;
} = {}) {
  const params = new URLSearchParams();
  if (options.piId) params.set("piId", options.piId);
  if (options.days) params.set("days", options.days.toString());
  if (options.limit) params.set("limit", options.limit.toString());

  return useQuery<HealthResponse>({
    queryKey: ["program-health", options],
    queryFn: async () => {
      const res = await fetch(`/api/program-health?${params.toString()}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch health score");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCalculateHealth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (piId?: string) => {
      const res = await fetch("/api/program-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to calculate health score");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-health"] });
    },
  });
}

// ============================================
// SPRINT PREDICTIONS
// ============================================

export function useSprintPrediction(sprintId: number | undefined) {
  return useQuery<PredictionResponse>({
    queryKey: ["sprint-prediction", sprintId],
    queryFn: async () => {
      const res = await fetch(
        `/api/program-health/predictions?sprintId=${sprintId}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch prediction");
      }
      return res.json();
    },
    enabled: !!sprintId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useGenerateSprintPrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sprintId: number) => {
      const res = await fetch("/api/program-health/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate prediction");
      }
      return res.json();
    },
    onSuccess: (_, sprintId) => {
      queryClient.invalidateQueries({
        queryKey: ["sprint-prediction", sprintId],
      });
    },
  });
}

// ============================================
// DERIVED HOOKS
// ============================================

export function useHealthAlerts() {
  const { data } = useProgramHealth();
  return data?.current?.alerts || [];
}

export function useHealthTrend() {
  const { data } = useProgramHealth({ limit: 7 });

  if (!data?.history || data.history.length < 2) {
    return { trend: "stable" as const, change: 0 };
  }

  const latest = data.history[0].overall_score;
  const weekAgo = data.history[data.history.length - 1].overall_score;
  const change = latest - weekAgo;

  return {
    trend: change > 5 ? ("improving" as const) : change < -5 ? ("declining" as const) : ("stable" as const),
    change,
  };
}

export function useDimensionScores() {
  const { data } = useProgramHealth();

  if (!data?.current?.dimensions) {
    return null;
  }

  return Object.entries(data.current.dimensions).map(([name, dim]) => ({
    name: formatDimensionName(name),
    key: name,
    score: dim.score,
    max: dim.max,
    percentage: Math.round((dim.score / dim.max) * 100),
    factors: dim.factors,
  }));
}

function formatDimensionName(name: string): string {
  return name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
