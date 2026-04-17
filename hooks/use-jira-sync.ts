"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface JiraStatus {
  connected: boolean;
  siteName: string | null;
  siteUrl: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  storiesSynced: number;
}

interface SyncResult {
  success: boolean;
  stories: { synced: number; errors: number };
  sprints: { synced: number; errors: number };
  totalErrors: string[];
}

// Hook for JIRA connection status
export function useJiraStatus() {
  return useQuery<JiraStatus>({
    queryKey: ["jira", "status"],
    queryFn: async () => {
      const response = await fetch("/api/jira/status");
      if (!response.ok) {
        throw new Error("Failed to fetch JIRA status");
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

// Hook for triggering JIRA sync
export function useJiraSync() {
  const queryClient = useQueryClient();

  return useMutation<
    SyncResult,
    Error,
    { projectKey: string; boardId?: number; fullSync?: boolean }
  >({
    mutationFn: async ({ projectKey, boardId, fullSync }) => {
      const response = await fetch("/api/jira/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectKey, boardId, fullSync }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Sync failed");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate status and stories queries
      queryClient.invalidateQueries({ queryKey: ["jira", "status"] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

// Hook for disconnecting JIRA
export function useJiraDisconnect() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error>({
    mutationFn: async () => {
      const response = await fetch("/api/jira/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Disconnect failed");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate status query
      queryClient.invalidateQueries({ queryKey: ["jira", "status"] });
    },
  });
}

// Hook for initiating JIRA OAuth flow
export function useJiraConnect() {
  return {
    connect: () => {
      window.location.href = "/api/jira/auth";
    },
  };
}
