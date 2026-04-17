import { inngest } from "../client";
import { syncStoriesFromJira, syncSprintsFromJira } from "@/lib/jira/sync";
import { getJiraClientForWorkspace } from "@/lib/jira/auth";

// Scheduled JIRA sync - runs every 15 minutes per workspace
export const scheduledJiraSync = inngest.createFunction(
  {
    id: "scheduled-jira-sync",
    name: "Scheduled JIRA Sync",
    retries: 3,
    concurrency: {
      limit: 5, // Max concurrent syncs
    },
    triggers: [{ cron: "*/15 * * * *" }],
  },
  async ({ step }) => {
    // In production, this would get active workspaces from the database
    // For now, just log that the sync would run
    console.log("[FORGE] Scheduled JIRA sync triggered");

    // This function would iterate through all workspaces with JIRA connections
    // and trigger individual sync events for each
    return { status: "skipped", reason: "No workspaces configured" };
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

    console.log("[FORGE] JIRA sync started", {
      workspaceId,
      projectKey,
      triggeredBy,
    });

    // Check if workspace has JIRA connection
    const client = await step.run("check-connection", async () => {
      return getJiraClientForWorkspace(workspaceId);
    });

    if (!client) {
      console.warn("[FORGE] No JIRA connection found", { workspaceId });
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
        console.error("[FORGE] Story sync failed", {
          error: error instanceof Error ? error.message : "Unknown error",
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
          console.error("[FORGE] Sprint sync failed", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      });
    }

    console.log("[FORGE] JIRA sync completed", {
      workspaceId,
      storiesSynced: storyResult.synced,
      sprintsSynced: sprintResult.synced,
      errors: storyResult.errors.length + sprintResult.errors.length,
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
