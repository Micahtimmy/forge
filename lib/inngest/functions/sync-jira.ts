import { inngest } from "../client";
import { syncStoriesFromJira, syncSprintsFromJira, getProjectKeysForWorkspace } from "@/lib/jira/sync";
import { getJiraClientForWorkspace } from "@/lib/jira/auth";
import { createUntypedAdminClient } from "@/lib/db/client";
import * as Sentry from "@sentry/nextjs";

// Scheduled JIRA sync - runs every 15 minutes per workspace
export const scheduledJiraSync = inngest.createFunction(
  {
    id: "scheduled-jira-sync",
    name: "Scheduled JIRA Sync",
    retries: 3,
    concurrency: {
      limit: 5,
    },
    triggers: [{ cron: "*/15 * * * *" }],
  },
  async ({ step, logger }) => {
    const supabase = createUntypedAdminClient();

    const workspaces = await step.run("fetch-workspaces-with-jira", async () => {
      const { data, error } = await supabase
        .from("jira_connections")
        .select("workspace_id, site_name");

      if (error) {
        Sentry.captureException(error, {
          tags: { operation: "scheduled-jira-sync" },
        });
        throw error;
      }

      return data || [];
    });

    if (workspaces.length === 0) {
      logger.info("No active JIRA connections found");
      return { status: "skipped", reason: "No active JIRA connections" };
    }

    logger.info(`Found ${workspaces.length} workspaces with JIRA connections`);

    const results: Array<{
      workspaceId: string;
      status: string;
      projectKeys?: string[];
      error?: string;
    }> = [];

    for (const workspace of workspaces) {
      try {
        // Fetch project keys for this workspace
        const projectKeys = await step.run(
          `get-projects-${workspace.workspace_id}`,
          async () => {
            return getProjectKeysForWorkspace(workspace.workspace_id);
          }
        );

        if (projectKeys.length === 0) {
          logger.warn(`No projects found for workspace ${workspace.workspace_id}`);
          results.push({
            workspaceId: workspace.workspace_id,
            status: "skipped",
            error: "No projects found",
          });
          continue;
        }

        // Trigger sync for each project in the workspace
        for (const projectKey of projectKeys) {
          await step.sendEvent(`trigger-sync-${workspace.workspace_id}-${projectKey}`, {
            name: "jira/sync.requested",
            data: {
              workspaceId: workspace.workspace_id,
              projectKey,
              fullSync: false,
              triggeredBy: "scheduled",
            },
          });
        }

        results.push({
          workspaceId: workspace.workspace_id,
          status: "triggered",
          projectKeys,
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "scheduled-jira-sync" },
          extra: { workspaceId: workspace.workspace_id },
        });
        logger.error(`Failed to sync workspace ${workspace.workspace_id}`, { error });
        results.push({
          workspaceId: workspace.workspace_id,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      status: "completed",
      workspacesProcessed: workspaces.length,
      workspacesSucceeded: results.filter((r) => r.status === "triggered").length,
      workspacesFailed: results.filter((r) => r.status === "error").length,
      results,
    };
  }
);

// Manual/webhook triggered JIRA sync
export const jiraSync = inngest.createFunction(
  {
    id: "jira-sync",
    name: "JIRA Sync",
    retries: 3,
    concurrency: {
      limit: 10,
      key: "event.data.workspaceId",
    },
    rateLimit: {
      limit: 4,
      period: "1m",
      key: "event.data.workspaceId",
    },
    triggers: [{ event: "jira/sync.requested" }],
  },
  async ({ event, step }) => {
    const { workspaceId, projectKey, boardId, fullSync, triggeredBy } =
      event.data;

    Sentry.addBreadcrumb({
      category: "jira-sync",
      message: "JIRA sync started",
      data: { workspaceId, projectKey, triggeredBy },
      level: "info",
    });

    // Check if workspace has JIRA connection
    const client = await step.run("check-connection", async () => {
      return getJiraClientForWorkspace(workspaceId);
    });

    if (!client) {
      Sentry.captureMessage("No JIRA connection found", {
        level: "warning",
        extra: { workspaceId },
      });
      return { status: "error", reason: "No JIRA connection" };
    }

    // Sync stories
    const storyResult = await step.run("sync-stories", async () => {
      try {
        return await syncStoriesFromJira(workspaceId, projectKey, {
          fullSync,
          maxResults: fullSync ? 500 : 100,
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "story-sync" },
          extra: { workspaceId, projectKey },
        });
        throw error;
      }
    });

    // Sync sprints if board ID provided
    let sprintResult = { synced: 0, errors: [] as string[] };
    if (boardId) {
      sprintResult = await step.run("sync-sprints", async () => {
        try {
          return await syncSprintsFromJira(workspaceId, boardId);
        } catch (error) {
          Sentry.captureException(error, {
            tags: { operation: "sprint-sync" },
            extra: { workspaceId, boardId },
          });
          throw error;
        }
      });
    }

    Sentry.addBreadcrumb({
      category: "jira-sync",
      message: "JIRA sync completed",
      data: {
        workspaceId,
        storiesSynced: storyResult.synced,
        sprintsSynced: sprintResult.synced,
        errors: storyResult.errors.length + sprintResult.errors.length,
      },
      level: "info",
    });

    return {
      status: "success",
      stories: {
        synced: storyResult.synced,
        errors: storyResult.errors.length,
      },
      sprints: {
        synced: sprintResult.synced,
        errors: sprintResult.errors.length,
      },
    };
  }
);
