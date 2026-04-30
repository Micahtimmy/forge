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

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  selected: boolean;
  syncEnabled: boolean;
  autoScore: boolean;
}

export interface JiraBoard {
  id: number;
  name: string;
  type: "scrum" | "kanban";
  projectKey: string | null;
  projectName: string | null;
}

export interface SyncOptions {
  fullSync?: boolean;
  projectKeys?: string[];
  boardIds?: number[];
  issueTypes?: string[];
  dateRange?: {
    from?: string;
    to?: string;
    preset?: "7d" | "30d" | "90d" | "all";
  };
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
    mutationFn: async (options: SyncOptions = {}) => {
      const response = await fetch("/api/jira/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
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

export function useJiraBoards() {
  return useQuery<{ boards: JiraBoard[]; total: number }>({
    queryKey: ["jira-boards"],
    queryFn: async () => {
      const response = await fetch("/api/jira/boards");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch boards");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
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

export function useJiraProjects() {
  return useQuery<{ projects: JiraProject[]; total: number }>({
    queryKey: ["jira-projects"],
    queryFn: async () => {
      const response = await fetch("/api/jira/projects");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch projects");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateJiraProjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      projects: Array<{
        key: string;
        name: string;
        syncEnabled: boolean;
        autoScore?: boolean;
      }>
    ) => {
      const response = await fetch("/api/jira/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update projects");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jira-projects"] });
      queryClient.invalidateQueries({ queryKey: ["jira-status"] });
    },
  });
}
