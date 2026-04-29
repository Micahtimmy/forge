/**
 * Multi-JIRA Service
 * Manages multiple JIRA instance connections for enterprise workspaces
 */

import { createUntypedAdminClient } from '@/lib/db/client';
import { JiraClient } from './client';
import { refreshAccessToken } from './auth';

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

export interface AddJiraInstanceInput {
  workspaceId: string;
  name: string;
  cloudId: string;
  siteUrl: string;
  accessToken: string;
  refreshToken: string;
  scopes: string[];
  isPrimary?: boolean;
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

class MultiJiraService {
  async getInstances(workspaceId: string): Promise<JiraInstance[]> {
    const supabase = createUntypedAdminClient();

    const { data, error } = await supabase
      .from('jira_instances')
      .select(`
        *,
        jira_project_mappings(count)
      `)
      .eq('workspace_id', workspaceId)
      .order('is_primary', { ascending: false })
      .order('name');

    if (error) throw error;

    return (data || []).map(instance => ({
      id: instance.id,
      workspaceId: instance.workspace_id,
      name: instance.name,
      cloudId: instance.cloud_id,
      siteUrl: instance.site_url,
      isPrimary: instance.is_primary,
      syncEnabled: instance.sync_enabled,
      lastSyncAt: instance.last_sync_at,
      lastSyncStatus: instance.last_sync_status,
      projectCount: instance.jira_project_mappings?.[0]?.count || 0,
    }));
  }

  async getInstance(instanceId: string): Promise<JiraInstance | null> {
    const supabase = createUntypedAdminClient();

    const { data, error } = await supabase
      .from('jira_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      workspaceId: data.workspace_id,
      name: data.name,
      cloudId: data.cloud_id,
      siteUrl: data.site_url,
      isPrimary: data.is_primary,
      syncEnabled: data.sync_enabled,
      lastSyncAt: data.last_sync_at,
      lastSyncStatus: data.last_sync_status,
    };
  }

  async addInstance(input: AddJiraInstanceInput): Promise<JiraInstance> {
    const supabase = createUntypedAdminClient();

    // If this is primary, unset any existing primary
    if (input.isPrimary) {
      await supabase
        .from('jira_instances')
        .update({ is_primary: false })
        .eq('workspace_id', input.workspaceId);
    }

    // Check if this cloud_id already exists for this workspace
    const { data: existing } = await supabase
      .from('jira_instances')
      .select('id')
      .eq('workspace_id', input.workspaceId)
      .eq('cloud_id', input.cloudId)
      .single();

    if (existing) {
      // Update existing instead of creating new
      const { data, error } = await supabase
        .from('jira_instances')
        .update({
          name: input.name,
          site_url: input.siteUrl,
          access_token: input.accessToken,
          refresh_token: input.refreshToken,
          scopes: input.scopes,
          is_primary: input.isPrimary || false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        workspaceId: data.workspace_id,
        name: data.name,
        cloudId: data.cloud_id,
        siteUrl: data.site_url,
        isPrimary: data.is_primary,
        syncEnabled: data.sync_enabled,
        lastSyncAt: data.last_sync_at,
        lastSyncStatus: data.last_sync_status,
      };
    }

    // Create new instance
    const { data, error } = await supabase
      .from('jira_instances')
      .insert({
        workspace_id: input.workspaceId,
        name: input.name,
        cloud_id: input.cloudId,
        site_url: input.siteUrl,
        access_token: input.accessToken,
        refresh_token: input.refreshToken,
        scopes: input.scopes,
        is_primary: input.isPrimary || false,
        sync_enabled: true,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      workspaceId: data.workspace_id,
      name: data.name,
      cloudId: data.cloud_id,
      siteUrl: data.site_url,
      isPrimary: data.is_primary,
      syncEnabled: data.sync_enabled,
      lastSyncAt: data.last_sync_at,
      lastSyncStatus: data.last_sync_status,
    };
  }

  async removeInstance(instanceId: string, workspaceId: string): Promise<void> {
    const supabase = createUntypedAdminClient();

    // Verify ownership
    const { data: instance } = await supabase
      .from('jira_instances')
      .select('id, is_primary')
      .eq('id', instanceId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!instance) {
      throw new Error('JIRA instance not found');
    }

    // Delete instance (cascades to project/board mappings)
    const { error } = await supabase
      .from('jira_instances')
      .delete()
      .eq('id', instanceId);

    if (error) throw error;

    // If this was primary, promote another instance
    if (instance.is_primary) {
      const { data: nextInstance } = await supabase
        .from('jira_instances')
        .select('id')
        .eq('workspace_id', workspaceId)
        .limit(1)
        .single();

      if (nextInstance) {
        await supabase
          .from('jira_instances')
          .update({ is_primary: true })
          .eq('id', nextInstance.id);
      }
    }
  }

  async setPrimaryInstance(instanceId: string, workspaceId: string): Promise<void> {
    const supabase = createUntypedAdminClient();

    // Unset current primary
    await supabase
      .from('jira_instances')
      .update({ is_primary: false })
      .eq('workspace_id', workspaceId);

    // Set new primary
    const { error } = await supabase
      .from('jira_instances')
      .update({ is_primary: true })
      .eq('id', instanceId)
      .eq('workspace_id', workspaceId);

    if (error) throw error;
  }

  async getProjectMappings(instanceId: string): Promise<JiraProjectMapping[]> {
    const supabase = createUntypedAdminClient();

    const { data, error } = await supabase
      .from('jira_project_mappings')
      .select('*')
      .eq('jira_instance_id', instanceId)
      .order('project_name');

    if (error) throw error;

    return (data || []).map(p => ({
      id: p.id,
      jiraInstanceId: p.jira_instance_id,
      projectId: p.project_id,
      projectKey: p.project_key,
      projectName: p.project_name,
      syncEnabled: p.sync_enabled,
      autoScore: p.auto_score,
      lastSyncAt: p.last_sync_at,
      storyCount: p.story_count || 0,
    }));
  }

  async addProjectMapping(
    instanceId: string,
    workspaceId: string,
    projectId: string,
    projectKey: string,
    projectName: string
  ): Promise<JiraProjectMapping> {
    const supabase = createUntypedAdminClient();

    const { data, error } = await supabase
      .from('jira_project_mappings')
      .upsert(
        {
          jira_instance_id: instanceId,
          workspace_id: workspaceId,
          project_id: projectId,
          project_key: projectKey,
          project_name: projectName,
          sync_enabled: true,
          auto_score: true,
        },
        { onConflict: 'jira_instance_id,project_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      jiraInstanceId: data.jira_instance_id,
      projectId: data.project_id,
      projectKey: data.project_key,
      projectName: data.project_name,
      syncEnabled: data.sync_enabled,
      autoScore: data.auto_score,
      lastSyncAt: data.last_sync_at,
      storyCount: data.story_count || 0,
    };
  }

  async updateProjectMapping(
    mappingId: string,
    updates: { syncEnabled?: boolean; autoScore?: boolean }
  ): Promise<void> {
    const supabase = createUntypedAdminClient();

    const { error } = await supabase
      .from('jira_project_mappings')
      .update(updates)
      .eq('id', mappingId);

    if (error) throw error;
  }

  async removeProjectMapping(mappingId: string): Promise<void> {
    const supabase = createUntypedAdminClient();

    const { error } = await supabase
      .from('jira_project_mappings')
      .delete()
      .eq('id', mappingId);

    if (error) throw error;
  }

  async getClientForInstance(instanceId: string): Promise<JiraClient> {
    const supabase = createUntypedAdminClient();

    const { data: instance, error } = await supabase
      .from('jira_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (error || !instance) {
      throw new Error('JIRA instance not found');
    }

    // Check if token needs refresh
    let accessToken = instance.access_token;
    if (instance.token_expires_at) {
      const expiresAt = new Date(instance.token_expires_at);
      const now = new Date();
      // Refresh if expires within 5 minutes
      if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
        const newTokens = await refreshAccessToken(instance.refresh_token);
        accessToken = newTokens.access_token;

        // Update stored tokens
        await supabase
          .from('jira_instances')
          .update({
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token || instance.refresh_token,
            token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', instanceId);
      }
    }

    return new JiraClient({
      accessToken,
      cloudId: instance.cloud_id,
      siteUrl: instance.site_url,
    });
  }

  async syncInstance(instanceId: string, workspaceId: string): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let storiesSynced = 0;
    let sprintsSynced = 0;

    const supabase = createUntypedAdminClient();

    try {
      const instance = await this.getInstance(instanceId);
      if (!instance) {
        throw new Error('Instance not found');
      }

      const client = await this.getClientForInstance(instanceId);
      const projects = await this.getProjectMappings(instanceId);
      const enabledProjects = projects.filter(p => p.syncEnabled);

      for (const project of enabledProjects) {
        try {
          // Sync sprints for project
          const boards = await client.getBoards(project.projectKey);
          for (const board of boards) {
            const sprints = await client.getSprintsForBoard(board.id);
            for (const sprint of sprints) {
              await supabase.from('sprints').upsert(
                {
                  workspace_id: workspaceId,
                  jira_instance_id: instanceId,
                  jira_id: sprint.id,
                  name: sprint.name,
                  status: sprint.state?.toLowerCase() || 'future',
                  start_date: sprint.startDate,
                  end_date: sprint.endDate,
                  goal: sprint.goal,
                },
                { onConflict: 'workspace_id,jira_id' }
              );
              sprintsSynced++;
            }
          }

          // Sync stories for project
          const issues = await client.searchIssues(
            `project = "${project.projectKey}" AND issuetype in (Story, Task, Bug)`,
            {
              fields: ['summary', 'description', 'status', 'assignee', 'customfield_10016', 'customfield_10020', 'labels', 'priority'],
            }
          );

          for (const issue of issues.issues || []) {
            // customfield_10020 is typically the sprint field
            const sprintField = issue.fields?.customfield_10020;
            let sprintId = null;

            if (sprintField && Array.isArray(sprintField) && sprintField.length > 0) {
              const activeSprint = sprintField[sprintField.length - 1];
              const { data: sprint } = await supabase
                .from('sprints')
                .select('id')
                .eq('workspace_id', workspaceId)
                .eq('jira_id', activeSprint.id)
                .single();
              sprintId = sprint?.id;
            }

            await supabase.from('stories').upsert(
              {
                workspace_id: workspaceId,
                jira_instance_id: instanceId,
                jira_key: issue.key,
                jira_id: issue.id,
                title: issue.fields?.summary || 'Untitled',
                description: issue.fields?.description || null,
                status: mapJiraStatus(issue.fields?.status?.name),
                jira_status: issue.fields?.status?.name,
                story_points: issue.fields?.customfield_10016 || null,
                sprint_id: sprintId,
                assignee_id: null, // Would need user mapping
                labels: issue.fields?.labels || [],
                priority: issue.fields?.priority?.name || null,
              },
              { onConflict: 'workspace_id,jira_key' }
            );
            storiesSynced++;
          }

          // Update project mapping stats
          await supabase
            .from('jira_project_mappings')
            .update({
              last_sync_at: new Date().toISOString(),
              story_count: storiesSynced,
            })
            .eq('id', project.id);

        } catch (projectError) {
          errors.push(`Project ${project.projectKey}: ${projectError instanceof Error ? projectError.message : 'Unknown error'}`);
        }
      }

      // Update instance sync status
      await supabase
        .from('jira_instances')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: errors.length > 0 ? 'partial' : 'success',
          updated_at: new Date().toISOString(),
        })
        .eq('id', instanceId);

      return {
        instanceId,
        instanceName: instance.name,
        success: errors.length === 0,
        storiesSynced,
        sprintsSynced,
        errors,
        duration: Date.now() - startTime,
      };

    } catch (error) {
      // Update instance with failure status
      await supabase
        .from('jira_instances')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', instanceId);

      return {
        instanceId,
        instanceName: 'Unknown',
        success: false,
        storiesSynced,
        sprintsSynced,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: Date.now() - startTime,
      };
    }
  }

  async syncAllInstances(workspaceId: string): Promise<SyncResult[]> {
    const instances = await this.getInstances(workspaceId);
    const enabledInstances = instances.filter(i => i.syncEnabled);

    const results = await Promise.all(
      enabledInstances.map(instance => this.syncInstance(instance.id, workspaceId))
    );

    return results;
  }

  async discoverProjects(instanceId: string): Promise<Array<{
    id: string;
    key: string;
    name: string;
    projectTypeKey: string;
  }>> {
    const client = await this.getClientForInstance(instanceId);
    const projects = await client.getProjects();

    return (projects || []).map(p => ({
      id: p.id,
      key: p.key,
      name: p.name,
      projectTypeKey: p.projectTypeKey,
    }));
  }
}

function mapJiraStatus(jiraStatus: string | undefined): string {
  if (!jiraStatus) return 'to_do';

  const status = jiraStatus.toLowerCase();

  if (status.includes('done') || status.includes('complete') || status.includes('closed') || status.includes('resolved')) {
    return 'done';
  }
  if (status.includes('progress') || status.includes('review') || status.includes('testing')) {
    return 'in_progress';
  }
  return 'to_do';
}

export const multiJiraService = new MultiJiraService();
