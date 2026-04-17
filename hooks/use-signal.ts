"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SignalUpdate, AudienceType, SignalDraft } from "@/types/signal";

interface SignalFilters {
  status?: "draft" | "sent" | "archived";
  audience?: AudienceType;
  limit?: number;
  offset?: number;
}

interface SignalUpdatesResponse {
  updates: SignalUpdate[];
  total: number;
  hasMore: boolean;
}

interface GenerateUpdateParams {
  context: {
    sprintName: string;
    sprintGoal?: string;
    completedStories: Array<{ key: string; title: string; points?: number }>;
    inProgressStories: Array<{ key: string; title: string; progress: number }>;
    blockers: Array<{ description: string; impact: string }>;
    highlights?: string[];
    risks?: string[];
    velocityTarget?: number;
    velocityActual?: number;
  };
  audiences: AudienceType[];
}

// Fetch signal updates
export function useSignalUpdates(filters: SignalFilters = {}) {
  return useQuery<SignalUpdatesResponse>({
    queryKey: ["signal-updates", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.audience) params.set("audience", filters.audience);
      if (filters.limit) params.set("limit", filters.limit.toString());
      if (filters.offset) params.set("offset", filters.offset.toString());

      const response = await fetch(`/api/signal?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch updates");
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch a single update by ID
export function useSignalUpdate(updateId: string | null) {
  return useQuery<SignalUpdate>({
    queryKey: ["signal-update", updateId],
    queryFn: async () => {
      if (!updateId) throw new Error("Update ID required");
      const response = await fetch(`/api/signal/${updateId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch update");
      }
      return response.json();
    },
    enabled: !!updateId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Generate AI update drafts
export function useGenerateUpdate() {
  return useMutation({
    mutationFn: async (params: GenerateUpdateParams) => {
      const response = await fetch("/api/ai/generate-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate update");
      }

      return response.json();
    },
  });
}

// Generate update with streaming
export function useGenerateUpdateStream() {
  return useMutation({
    mutationFn: async ({
      params,
      onChunk,
    }: {
      params: GenerateUpdateParams;
      onChunk: (text: string) => void;
    }) => {
      const response = await fetch("/api/ai/generate-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, stream: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate update");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullText += data.text;
                onChunk(data.text);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      return { content: fullText };
    },
  });
}

// Save a draft
export function useSaveDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: SignalDraft) => {
      const response = await fetch("/api/signal/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save draft");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signal-updates"] });
    },
  });
}

// Send an update
export function useSendUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      updateId,
      audiences,
      channels,
    }: {
      updateId: string;
      audiences: AudienceType[];
      channels: ("email" | "slack")[];
    }) => {
      const response = await fetch(`/api/signal/${updateId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audiences, channels }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send update");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["signal-update", variables.updateId] });
      queryClient.invalidateQueries({ queryKey: ["signal-updates"] });
    },
  });
}

// Delete an update
export function useDeleteUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updateId: string) => {
      const response = await fetch(`/api/signal/${updateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete update");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signal-updates"] });
    },
  });
}

// Log a decision
export function useLogDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      updateId,
      decision,
    }: {
      updateId: string;
      decision: {
        title: string;
        description: string;
        outcome: string;
        stakeholders: string[];
      };
    }) => {
      const response = await fetch(`/api/signal/${updateId}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(decision),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to log decision");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["signal-update", variables.updateId] });
    },
  });
}
