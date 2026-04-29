import { createClient } from "@supabase/supabase-js";
import { getJiraClientForWorkspace } from "./auth";
import { JiraApiError } from "./client";
import type {
  JiraIssue,
  JiraDocument,
  JiraDocumentNode,
  NormalizedJiraStory,
} from "@/types/jira";

// Convert ADF document to plain text
function adfToPlainText(doc: JiraDocument | string | null | undefined): string | null {
  if (!doc) return null;
  if (typeof doc === "string") return doc;
  if (doc.type !== "doc" || !doc.content) return null;

  function extractText(nodes: JiraDocumentNode[]): string {
    return nodes
      .map((node) => {
        if (node.text) return node.text;
        if (node.content) return extractText(node.content);
        if (node.type === "hardBreak") return "\n";
        return "";
      })
      .join("");
  }

  return extractText(doc.content);
}

// Normalize JIRA issue to FORGE story format
function normalizeJiraIssue(issue: JiraIssue): NormalizedJiraStory {
  const fields = issue.fields;

  // Map status category to simplified version
  let statusCategory: "todo" | "in_progress" | "done" = "todo";
  const categoryKey = fields.status.statusCategory.key;
  if (categoryKey === "done") statusCategory = "done";
  else if (categoryKey === "indeterminate") statusCategory = "in_progress";

  // Extract sprint info
  const sprints = fields.customfield_10020;
  const activeSprint = sprints?.find((s) => s.state === "active") || sprints?.[0];

  return {
    jiraKey: issue.key,
    jiraId: issue.id,
    title: fields.summary,
    description: adfToPlainText(fields.description as JiraDocument | string | undefined),
    acceptanceCriteria: null, // Would need custom field mapping
    storyPoints: fields.customfield_10016 ?? null,
    status: fields.status.name,
    statusCategory,
    issueType: fields.issuetype.name,
    priority: fields.priority?.name ?? null,
    labels: fields.labels || [],
    epicKey: fields.parent?.fields.issuetype.name === "Epic"
      ? fields.parent.key
      : null,
    epicName: fields.parent?.fields.issuetype.name === "Epic"
      ? fields.parent.fields.summary
      : null,
    sprintId: activeSprint?.id ?? null,
    sprintName: activeSprint?.name ?? null,
    assigneeEmail: fields.assignee?.emailAddress ?? null,
    assigneeName: fields.assignee?.displayName ?? null,
    reporterEmail: fields.reporter?.emailAddress ?? null,
    reporterName: fields.reporter?.displayName ?? null,
    createdAt: new Date(fields.created),
    updatedAt: new Date(fields.updated),
  };
}

// Sync stories from JIRA to database
export async function syncStoriesFromJira(
  workspaceId: string,
  projectKey: string,
  options: {
    fullSync?: boolean;
    maxResults?: number;
  } = {}
): Promise<{
  synced: number;
  errors: string[];
}> {
  const { fullSync = false, maxResults = 500 } = options;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const client = await getJiraClientForWorkspace(workspaceId);
  if (!client) {
    throw new Error("No JIRA connection found for workspace");
  }

  const errors: string[] = [];
  let synced = 0;

  try {
    // Update sync status to in_progress
    await supabase
      .from("jira_connections")
      .update({
        last_sync_status: "in_progress",
        last_sync_error: null,
      })
      .eq("workspace_id", workspaceId);

    // Build JQL query
    let jql = `project = "${projectKey}" AND issuetype IN ("Story", "Bug", "Task", "Sub-task")`;

    if (!fullSync) {
      // Only get recently updated issues
      jql += " AND updated >= -7d";
    }

    jql += " ORDER BY updated DESC";

    // Fetch issues in batches
    const allIssues: JiraIssue[] = [];
    let startAt = 0;
    let hasMore = true;

    while (hasMore && allIssues.length < maxResults) {
      try {
        const response = await client.searchIssues(jql, {
          startAt,
          maxResults: Math.min(50, maxResults - allIssues.length),
        });

        allIssues.push(...response.issues);
        startAt += response.issues.length;
        hasMore = startAt < response.total && response.issues.length > 0;
      } catch (error) {
        if (error instanceof JiraApiError && error.statusCode === 429) {
          // Rate limited - wait and retry
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
        throw error;
      }
    }

    // Normalize and upsert stories
    for (const issue of allIssues) {
      try {
        const normalized = normalizeJiraIssue(issue);

        const { error: upsertError } = await supabase.from("stories").upsert(
          {
            workspace_id: workspaceId,
            jira_key: normalized.jiraKey,
            jira_id: normalized.jiraId,
            title: normalized.title,
            description: normalized.description,
            acceptance_criteria: normalized.acceptanceCriteria,
            story_points: normalized.storyPoints,
            status: normalized.status,
            status_category: normalized.statusCategory,
            issue_type: normalized.issueType,
            priority: normalized.priority,
            labels: normalized.labels,
            epic_key: normalized.epicKey,
            epic_name: normalized.epicName,
            sprint_id: normalized.sprintId,
            sprint_name: normalized.sprintName,
            assignee_email: normalized.assigneeEmail,
            assignee_name: normalized.assigneeName,
            reporter_email: normalized.reporterEmail,
            reporter_name: normalized.reporterName,
            jira_created_at: normalized.createdAt.toISOString(),
            jira_updated_at: normalized.updatedAt.toISOString(),
            synced_at: new Date().toISOString(),
          },
          {
            onConflict: "workspace_id,jira_key",
          }
        );

        if (upsertError) {
          errors.push(`Failed to upsert ${normalized.jiraKey}: ${upsertError.message}`);
        } else {
          synced++;
        }
      } catch (error) {
        errors.push(
          `Failed to process ${issue.key}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Update sync status
    await supabase
      .from("jira_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: errors.length > 0 ? "partial" : "success",
        last_sync_error: errors.length > 0 ? errors.slice(0, 5).join("; ") : null,
        stories_synced: synced,
      })
      .eq("workspace_id", workspaceId);

  } catch (error) {
    // Update sync status with error
    await supabase
      .from("jira_connections")
      .update({
        last_sync_status: "error",
        last_sync_error: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("workspace_id", workspaceId);

    throw error;
  }

  return { synced, errors };
}

// Sync sprints from JIRA
export async function syncSprintsFromJira(
  workspaceId: string,
  boardId: number
): Promise<{
  synced: number;
  errors: string[];
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const client = await getJiraClientForWorkspace(workspaceId);
  if (!client) {
    throw new Error("No JIRA connection found for workspace");
  }

  const errors: string[] = [];
  let synced = 0;

  try {
    // Get all sprints (active, closed, and future)
    const [activeSprints, closedSprints, futureSprints] = await Promise.all([
      client.getSprintsForBoard(boardId, "active"),
      client.getSprintsForBoard(boardId, "closed"),
      client.getSprintsForBoard(boardId, "future"),
    ]);

    const allSprints = [...activeSprints, ...closedSprints, ...futureSprints];

    for (const sprint of allSprints) {
      try {
        const { error: upsertError } = await supabase.from("sprints").upsert(
          {
            workspace_id: workspaceId,
            jira_sprint_id: sprint.id,
            name: sprint.name,
            state: sprint.state,
            goal: sprint.goal,
            start_date: sprint.startDate,
            end_date: sprint.endDate,
            complete_date: sprint.completeDate,
            board_id: boardId,
            synced_at: new Date().toISOString(),
          },
          {
            onConflict: "workspace_id,jira_sprint_id",
          }
        );

        if (upsertError) {
          errors.push(`Failed to upsert sprint ${sprint.name}: ${upsertError.message}`);
        } else {
          synced++;
        }
      } catch (error) {
        errors.push(
          `Failed to process sprint ${sprint.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  } catch (error) {
    throw error;
  }

  return { synced, errors };
}

// Process JIRA webhook event
export async function processJiraWebhook(
  workspaceId: string,
  event: {
    webhookEvent: string;
    issue?: JiraIssue;
  }
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { webhookEvent, issue } = event;

  if (!issue) return;

  // Handle issue events
  if (
    webhookEvent === "jira:issue_created" ||
    webhookEvent === "jira:issue_updated"
  ) {
    const normalized = normalizeJiraIssue(issue);

    await supabase.from("stories").upsert(
      {
        workspace_id: workspaceId,
        jira_key: normalized.jiraKey,
        jira_id: normalized.jiraId,
        title: normalized.title,
        description: normalized.description,
        acceptance_criteria: normalized.acceptanceCriteria,
        story_points: normalized.storyPoints,
        status: normalized.status,
        status_category: normalized.statusCategory,
        issue_type: normalized.issueType,
        priority: normalized.priority,
        labels: normalized.labels,
        epic_key: normalized.epicKey,
        epic_name: normalized.epicName,
        sprint_id: normalized.sprintId,
        sprint_name: normalized.sprintName,
        assignee_email: normalized.assigneeEmail,
        assignee_name: normalized.assigneeName,
        reporter_email: normalized.reporterEmail,
        reporter_name: normalized.reporterName,
        jira_created_at: normalized.createdAt.toISOString(),
        jira_updated_at: normalized.updatedAt.toISOString(),
        synced_at: new Date().toISOString(),
      },
      {
        onConflict: "workspace_id,jira_key",
      }
    );
  } else if (webhookEvent === "jira:issue_deleted") {
    // Soft delete - mark as archived
    await supabase
      .from("stories")
      .update({ archived_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .eq("jira_key", issue.key);
  }
}

// Get sync status for workspace
export async function getJiraSyncStatus(
  workspaceId: string
): Promise<{
  lastSyncAt: Date | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  storiesSynced: number;
} | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("jira_connections")
    .select("last_sync_at, last_sync_status, last_sync_error, stories_synced")
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) return null;

  return {
    lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : null,
    lastSyncStatus: data.last_sync_status,
    lastSyncError: data.last_sync_error,
    storiesSynced: data.stories_synced || 0,
  };
}

// Get project keys for a workspace from existing synced stories or JIRA API
export async function getProjectKeysForWorkspace(
  workspaceId: string
): Promise<string[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // First try to get unique project keys from already synced stories
  const { data: storyData } = await supabase
    .from("stories")
    .select("jira_key")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .limit(1000);

  if (storyData && storyData.length > 0) {
    // Extract unique project keys from JIRA keys (e.g., "PROJ-123" -> "PROJ")
    const projectKeys = new Set<string>();
    for (const story of storyData) {
      const key = story.jira_key;
      if (key && key.includes("-")) {
        projectKeys.add(key.split("-")[0]);
      }
    }
    if (projectKeys.size > 0) {
      return Array.from(projectKeys);
    }
  }

  // Fall back to fetching projects from JIRA API
  try {
    const client = await getJiraClientForWorkspace(workspaceId);
    if (!client) {
      console.error("No JIRA client available for workspace:", workspaceId);
      return [];
    }

    console.log("Fetching projects from JIRA API...");
    const projects = await client.getProjects();
    console.log("Found JIRA projects:", projects.map(p => p.key));
    return projects.map((p) => p.key);
  } catch (error) {
    console.error("Failed to fetch JIRA projects:", error);
    // Re-throw to give a more helpful error message
    if (error instanceof JiraApiError) {
      throw new Error(`JIRA API Error: ${error.message} (Status: ${error.statusCode})`);
    }
    throw error;
  }
}
