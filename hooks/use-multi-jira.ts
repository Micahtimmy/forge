/**
 * Multi-JIRA Hooks
 * TanStack Query hooks for managing multiple JIRA instances
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface JiraInstance {
  id: string;
  workspaceId: string;
  name: string;
  cloudId: string;
  siteUrl: string;
  isPrimary: boolean;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  projectCount?: number;
}

export interface JiraProjectMapping {
  id: string;
  jiraInstanceId: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  syncEnabled: boolean;
  autoScore: boolean;
  lastSyncAt: string | null;
  storyCount: number;
}

export interface AvailableProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  isMapped: boolean;
}

export interface SyncResult {
  instanceId: string;
  instanceName: string;
  success: boolean;
  storiesSynced: number;
  sprintsSynced: number;
  errors: string[];
  duration: number;
}

// Instance Hooks
export function useJiraInstances() {
  return useQuery({
    queryKey: ['jira-instances'],
    queryFn: async (): Promise<JiraInstance[]> => {
      const response = await fetch('/api/jira/instances');
      if (!response.ok) {
        throw new Error('Failed to fetch JIRA instances');
      }
      const data = await response.json();
      return data.instances;
    },
    staleTime: 60 * 1000,
  });
}

export function useJiraInstance(instanceId: string | undefined) {
  return useQuery({
    queryKey: ['jira-instance', instanceId],
    queryFn: async () => {
      const response = await fetch(`/api/jira/instances/${instanceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch JIRA instance');
      }
      return response.json() as Promise<{
        instance: JiraInstance;
        projects: JiraProjectMapping[];
      }>;
    },
    enabled: !!instanceId,
    staleTime: 60 * 1000,
  });
}

export function useSetPrimaryInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await fetch(`/api/jira/instances/${instanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to set primary instance');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jira-instances'] });
    },
  });
}

export function useRemoveJiraInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await fetch(`/api/jira/instances/${instanceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove JIRA instance');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jira-instances'] });
    },
  });
}

// Sync Hooks
export function useSyncJiraInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: string): Promise<SyncResult> => {
      const response = await fetch(`/api/jira/instances/${instanceId}/sync`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync JIRA instance');
      }

      return response.json();
    },
    onSuccess: (_, instanceId) => {
      queryClient.invalidateQueries({ queryKey: ['jira-instance', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['jira-instances'] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
    },
  });
}

export function useSyncAllJiraInstances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SyncResult[]> => {
      const response = await fetch('/api/jira/sync-all', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync all JIRA instances');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jira-instances'] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
    },
  });
}

// Project Mapping Hooks
export function useDiscoverJiraProjects(instanceId: string | undefined) {
  return useQuery({
    queryKey: ['jira-projects-discover', instanceId],
    queryFn: async () => {
      const response = await fetch(`/api/jira/instances/${instanceId}/projects?discover=true`);
      if (!response.ok) {
        throw new Error('Failed to discover JIRA projects');
      }
      return response.json() as Promise<{
        available: AvailableProject[];
        mapped: JiraProjectMapping[];
      }>;
    },
    enabled: !!instanceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddProjectMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      instanceId,
      projectId,
      projectKey,
      projectName,
    }: {
      instanceId: string;
      projectId: string;
      projectKey: string;
      projectName: string;
    }): Promise<JiraProjectMapping> => {
      const response = await fetch(`/api/jira/instances/${instanceId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, projectKey, projectName }),
      });

      if (!response.ok) {
        throw new Error('Failed to add project mapping');
      }

      return response.json();
    },
    onSuccess: (_, { instanceId }) => {
      queryClient.invalidateQueries({ queryKey: ['jira-projects-discover', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['jira-instance', instanceId] });
    },
  });
}

export function useUpdateProjectMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      instanceId,
      mappingId,
      syncEnabled,
      autoScore,
    }: {
      instanceId: string;
      mappingId: string;
      syncEnabled?: boolean;
      autoScore?: boolean;
    }) => {
      const response = await fetch(`/api/jira/instances/${instanceId}/projects/${mappingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncEnabled, autoScore }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project mapping');
      }
    },
    onSuccess: (_, { instanceId }) => {
      queryClient.invalidateQueries({ queryKey: ['jira-instance', instanceId] });
    },
  });
}

export function useRemoveProjectMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ instanceId, mappingId }: { instanceId: string; mappingId: string }) => {
      const response = await fetch(`/api/jira/instances/${instanceId}/projects/${mappingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove project mapping');
      }
    },
    onSuccess: (_, { instanceId }) => {
      queryClient.invalidateQueries({ queryKey: ['jira-instance', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['jira-projects-discover', instanceId] });
    },
  });
}
