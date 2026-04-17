"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StoryScore } from "@/types/story";

interface ScoreHistoryItem {
  id: string;
  storyId: string;
  totalScore: number;
  scoredAt: string;
  rubricId: string;
}

interface ScoreStatsResponse {
  avgScore: number;
  totalScored: number;
  distribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  trend: {
    direction: "up" | "down" | "flat";
    value: number;
    comparedTo: string;
  };
}

// Fetch score for a specific story
export function useStoryScore(storyId: string | null) {
  return useQuery<StoryScore>({
    queryKey: ["score", storyId],
    queryFn: async () => {
      if (!storyId) throw new Error("Story ID required");
      const response = await fetch(`/api/scores/${storyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch score");
      }
      return response.json();
    },
    enabled: !!storyId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Fetch score history for a story
export function useScoreHistory(storyId: string | null) {
  return useQuery<ScoreHistoryItem[]>({
    queryKey: ["score-history", storyId],
    queryFn: async () => {
      if (!storyId) throw new Error("Story ID required");
      const response = await fetch(`/api/scores/${storyId}/history`);
      if (!response.ok) {
        throw new Error("Failed to fetch score history");
      }
      return response.json();
    },
    enabled: !!storyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch aggregate score stats for a sprint or workspace
export function useScoreStats(params: { sprintId?: string; teamId?: string } = {}) {
  return useQuery<ScoreStatsResponse>({
    queryKey: ["score-stats", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.sprintId) searchParams.set("sprintId", params.sprintId);
      if (params.teamId) searchParams.set("teamId", params.teamId);

      const response = await fetch(`/api/scores/stats?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch score stats");
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Trigger scoring for a story
export function useScoreStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storyId,
      story,
      rubricId,
    }: {
      storyId: string;
      story: {
        key: string;
        title: string;
        description: string | null;
        acceptanceCriteria: string | null;
        storyPoints: number | null;
        epicKey: string | null;
        labels: string[] | null;
      };
      rubricId?: string;
    }) => {
      const response = await fetch("/api/ai/score-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, story, rubricId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to score story");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update caches
      queryClient.invalidateQueries({ queryKey: ["score", variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ["story", variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["score-stats"] });
    },
  });
}

// Trigger scoring for multiple stories
export function useScoreMultipleStories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stories,
      rubricId,
    }: {
      stories: Array<{
        key: string;
        title: string;
        description: string | null;
        acceptanceCriteria: string | null;
        storyPoints: number | null;
        epicKey: string | null;
        labels: string[] | null;
      }>;
      rubricId?: string;
    }) => {
      const response = await fetch("/api/ai/score-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stories, rubricId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to score stories");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["scores"] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["score-stats"] });
    },
  });
}

// Helper to get score tier
export function getScoreTier(score: number): "excellent" | "good" | "fair" | "poor" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

// Helper to get score color
export function getScoreColor(score: number): string {
  if (score >= 85) return "var(--color-jade)";
  if (score >= 70) return "var(--color-iris)";
  if (score >= 50) return "var(--color-amber)";
  return "var(--color-coral)";
}
