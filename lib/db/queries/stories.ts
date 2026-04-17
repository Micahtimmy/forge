import { createUntypedServerClient } from "../client";

export interface Story {
  id: string;
  workspaceId: string;
  jiraKey: string;
  jiraId: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  storyPoints: number | null;
  status: string;
  statusCategory: "todo" | "in_progress" | "done";
  issueType: string;
  priority: string | null;
  labels: string[];
  epicKey: string | null;
  epicName: string | null;
  sprintId: number | null;
  sprintName: string | null;
  assigneeName: string | null;
  reporterName: string | null;
  jiraCreatedAt: Date;
  jiraUpdatedAt: Date;
  syncedAt: Date;
}

export interface StoryWithScore extends Story {
  latestScore: {
    totalScore: number;
    scoredAt: Date;
  } | null;
}

// Get stories for a workspace
export async function getStoriesByWorkspace(
  workspaceId: string,
  options: {
    sprintId?: number;
    statusCategory?: "todo" | "in_progress" | "done";
    limit?: number;
    offset?: number;
    includeArchived?: boolean;
  } = {}
): Promise<Story[]> {
  const supabase = createUntypedServerClient();
  const {
    sprintId,
    statusCategory,
    limit = 100,
    offset = 0,
    includeArchived = false,
  } = options;

  let query = supabase
    .from("stories")
    .select(
      `
      id,
      workspace_id,
      jira_key,
      jira_id,
      title,
      description,
      acceptance_criteria,
      story_points,
      status,
      status_category,
      issue_type,
      priority,
      labels,
      epic_key,
      epic_name,
      sprint_id,
      sprint_name,
      assignee_name,
      reporter_name,
      jira_created_at,
      jira_updated_at,
      synced_at
    `
    )
    .eq("workspace_id", workspaceId)
    .order("jira_updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  if (sprintId) {
    query = query.eq("sprint_id", sprintId);
  }

  if (statusCategory) {
    query = query.eq("status_category", statusCategory);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch stories: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    jiraKey: row.jira_key,
    jiraId: row.jira_id,
    title: row.title,
    description: row.description,
    acceptanceCriteria: row.acceptance_criteria,
    storyPoints: row.story_points,
    status: row.status,
    statusCategory: row.status_category as "todo" | "in_progress" | "done",
    issueType: row.issue_type,
    priority: row.priority,
    labels: row.labels || [],
    epicKey: row.epic_key,
    epicName: row.epic_name,
    sprintId: row.sprint_id,
    sprintName: row.sprint_name,
    assigneeName: row.assignee_name,
    reporterName: row.reporter_name,
    jiraCreatedAt: new Date(row.jira_created_at),
    jiraUpdatedAt: new Date(row.jira_updated_at),
    syncedAt: new Date(row.synced_at),
  }));
}

// Get stories with their latest scores
export async function getStoriesWithScores(
  workspaceId: string,
  options: {
    sprintId?: number;
    limit?: number;
  } = {}
): Promise<StoryWithScore[]> {
  const supabase = createUntypedServerClient();
  const { sprintId, limit = 100 } = options;

  let query = supabase
    .from("stories")
    .select(
      `
      id,
      workspace_id,
      jira_key,
      jira_id,
      title,
      description,
      acceptance_criteria,
      story_points,
      status,
      status_category,
      issue_type,
      priority,
      labels,
      epic_key,
      epic_name,
      sprint_id,
      sprint_name,
      assignee_name,
      reporter_name,
      jira_created_at,
      jira_updated_at,
      synced_at,
      story_scores (
        total_score,
        scored_at
      )
    `
    )
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("jira_updated_at", { ascending: false })
    .limit(limit);

  if (sprintId) {
    query = query.eq("sprint_id", sprintId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch stories with scores: ${error.message}`);
  }

  return (data || []).map((row) => {
    const scores = row.story_scores as
      | Array<{ total_score: number; scored_at: string }>
      | null;
    const latestScore = scores?.[0];

    return {
      id: row.id,
      workspaceId: row.workspace_id,
      jiraKey: row.jira_key,
      jiraId: row.jira_id,
      title: row.title,
      description: row.description,
      acceptanceCriteria: row.acceptance_criteria,
      storyPoints: row.story_points,
      status: row.status,
      statusCategory: row.status_category as "todo" | "in_progress" | "done",
      issueType: row.issue_type,
      priority: row.priority,
      labels: row.labels || [],
      epicKey: row.epic_key,
      epicName: row.epic_name,
      sprintId: row.sprint_id,
      sprintName: row.sprint_name,
      assigneeName: row.assignee_name,
      reporterName: row.reporter_name,
      jiraCreatedAt: new Date(row.jira_created_at),
      jiraUpdatedAt: new Date(row.jira_updated_at),
      syncedAt: new Date(row.synced_at),
      latestScore: latestScore
        ? {
            totalScore: latestScore.total_score,
            scoredAt: new Date(latestScore.scored_at),
          }
        : null,
    };
  });
}

// Get single story by ID
export async function getStoryById(
  workspaceId: string,
  storyId: string
): Promise<Story | null> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("stories")
    .select(
      `
      id,
      workspace_id,
      jira_key,
      jira_id,
      title,
      description,
      acceptance_criteria,
      story_points,
      status,
      status_category,
      issue_type,
      priority,
      labels,
      epic_key,
      epic_name,
      sprint_id,
      sprint_name,
      assignee_name,
      reporter_name,
      jira_created_at,
      jira_updated_at,
      synced_at
    `
    )
    .eq("workspace_id", workspaceId)
    .eq("id", storyId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch story: ${error.message}`);
  }

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    jiraKey: data.jira_key,
    jiraId: data.jira_id,
    title: data.title,
    description: data.description,
    acceptanceCriteria: data.acceptance_criteria,
    storyPoints: data.story_points,
    status: data.status,
    statusCategory: data.status_category as "todo" | "in_progress" | "done",
    issueType: data.issue_type,
    priority: data.priority,
    labels: data.labels || [],
    epicKey: data.epic_key,
    epicName: data.epic_name,
    sprintId: data.sprint_id,
    sprintName: data.sprint_name,
    assigneeName: data.assignee_name,
    reporterName: data.reporter_name,
    jiraCreatedAt: new Date(data.jira_created_at),
    jiraUpdatedAt: new Date(data.jira_updated_at),
    syncedAt: new Date(data.synced_at),
  };
}

// Get story by JIRA key
export async function getStoryByJiraKey(
  workspaceId: string,
  jiraKey: string
): Promise<Story | null> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("stories")
    .select(
      `
      id,
      workspace_id,
      jira_key,
      jira_id,
      title,
      description,
      acceptance_criteria,
      story_points,
      status,
      status_category,
      issue_type,
      priority,
      labels,
      epic_key,
      epic_name,
      sprint_id,
      sprint_name,
      assignee_name,
      reporter_name,
      jira_created_at,
      jira_updated_at,
      synced_at
    `
    )
    .eq("workspace_id", workspaceId)
    .eq("jira_key", jiraKey)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch story: ${error.message}`);
  }

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    jiraKey: data.jira_key,
    jiraId: data.jira_id,
    title: data.title,
    description: data.description,
    acceptanceCriteria: data.acceptance_criteria,
    storyPoints: data.story_points,
    status: data.status,
    statusCategory: data.status_category as "todo" | "in_progress" | "done",
    issueType: data.issue_type,
    priority: data.priority,
    labels: data.labels || [],
    epicKey: data.epic_key,
    epicName: data.epic_name,
    sprintId: data.sprint_id,
    sprintName: data.sprint_name,
    assigneeName: data.assignee_name,
    reporterName: data.reporter_name,
    jiraCreatedAt: new Date(data.jira_created_at),
    jiraUpdatedAt: new Date(data.jira_updated_at),
    syncedAt: new Date(data.synced_at),
  };
}

// Get story count by status category
export async function getStoryCountsByStatus(
  workspaceId: string,
  sprintId?: number
): Promise<{ todo: number; inProgress: number; done: number }> {
  const supabase = createUntypedServerClient();

  let query = supabase
    .from("stories")
    .select("status_category")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null);

  if (sprintId) {
    query = query.eq("sprint_id", sprintId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch story counts: ${error.message}`);
  }

  const counts = { todo: 0, inProgress: 0, done: 0 };
  for (const row of data || []) {
    if (row.status_category === "todo") counts.todo++;
    else if (row.status_category === "in_progress") counts.inProgress++;
    else if (row.status_category === "done") counts.done++;
  }

  return counts;
}
