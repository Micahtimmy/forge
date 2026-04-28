"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface JiraStatus {
  connected: boolean;
  siteName: string | null;
  siteUrl: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  storiesSynced: number;
}

export function useJiraStatus() {
  return useQuery<JiraStatus>({
    queryKey: ["jira-status"],
    queryFn: async () => {
      const response = await fetch("/api/jira/status");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch JIRA status");
      }
      return response.json();
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useJiraSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fullSync: boolean = false) => {
      const response = await fetch("/api/jira/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullSync }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Sync failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jira-status"] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    },
  });
}

export function useJiraDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/jira/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to disconnect");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jira-status"] });
    },
  });
}
