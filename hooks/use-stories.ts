"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Story, StoryWithScore } from "@/types/story";

interface StoriesFilters {
  sprintId?: string;
  epicKey?: string;
  status?: string;
  scoreFilter?: "all" | "excellent" | "good" | "fair" | "poor";
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

interface StoriesResponse {
  stories: StoryWithScore[];
  total: number;
  hasMore: boolean;
}

// Fetch stories with optional filters
export function useStories(filters: StoriesFilters = {}) {
  return useQuery<StoriesResponse>({
    queryKey: ["stories", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.sprintId) params.set("sprintId", filters.sprintId);
      if (filters.epicKey) params.set("epicKey", filters.epicKey);
      if (filters.status) params.set("status", filters.status);
      if (filters.scoreFilter && filters.scoreFilter !== "all") {
        params.set("scoreFilter", filters.scoreFilter);
      }
      if (filters.searchQuery) params.set("q", filters.searchQuery);
      if (filters.limit) params.set("limit", filters.limit.toString());
      if (filters.offset) params.set("offset", filters.offset.toString());

      const response = await fetch(`/api/stories?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stories");
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Fetch a single story by ID
export function useStory(storyId: string | null) {
  return useQuery<StoryWithScore>({
    queryKey: ["story", storyId],
    queryFn: async () => {
      if (!storyId) throw new Error("Story ID required");
      const response = await fetch(`/api/stories/${storyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch story");
      }
      return response.json();
    },
    enabled: !!storyId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Score a single story
export function useScoreStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: string) => {
      const response = await fetch(`/api/stories/${storyId}/score`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to score story");
      }
      return response.json();
    },
    onSuccess: (data, storyId) => {
      // Update the story in the cache
      queryClient.invalidateQueries({ queryKey: ["story", storyId] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

// Score multiple stories (sprint)
export function useScoreSprint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sprintId: string) => {
      const response = await fetch(`/api/sprints/${sprintId}/score`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to score sprint");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all story queries
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

// Fetch sprints
export function useSprints() {
  return useQuery<Array<{ id: string; name: string; startDate: string; endDate: string; isActive: boolean }>>({
    queryKey: ["sprints"],
    queryFn: async () => {
      const response = await fetch("/api/sprints");
      if (!response.ok) {
        throw new Error("Failed to fetch sprints");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Calculate score statistics from stories
export function useStoryStats(stories: StoryWithScore[] | undefined) {
  if (!stories || stories.length === 0) {
    return {
      avgScore: 0,
      distribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
      storiesAtRisk: 0,
      totalStories: 0,
    };
  }

  const scores = stories.map((s) => s.score?.totalScore ?? 0);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const distribution = {
    excellent: stories.filter((s) => (s.score?.totalScore ?? 0) >= 85).length,
    good: stories.filter((s) => {
      const score = s.score?.totalScore ?? 0;
      return score >= 70 && score < 85;
    }).length,
    fair: stories.filter((s) => {
      const score = s.score?.totalScore ?? 0;
      return score >= 50 && score < 70;
    }).length,
    poor: stories.filter((s) => (s.score?.totalScore ?? 0) < 50).length,
  };

  return {
    avgScore,
    distribution,
    storiesAtRisk: distribution.poor + distribution.fair,
    totalStories: stories.length,
  };
}
