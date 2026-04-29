import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { syncStoriesFromJira, syncSprintsFromJira, getProjectKeysForWorkspace } from "@/lib/jira/sync";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";

const syncSchema = z.object({
  projectKey: z.string().optional(),
  boardId: z.number().optional(),
  fullSync: z.boolean().optional(),
});

// Trigger manual JIRA sync
export async function POST(req: NextRequest) {
  try {
    // Get user session
    const supabase = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting - JIRA sync is expensive
    const rateLimit = checkRateLimit(req, user.id, RATE_LIMITS.jiraSync);
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    // Get user's workspace - use admin client to bypass RLS
    let workspaceId: string | null = null;

    const { data: membership } = await adminClient
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", user.id)
      .single();

    if (membership?.workspace_id) {
      workspaceId = membership.workspace_id;
    } else {
      const { data: userProfile } = await adminClient
        .from("users")
        .select("workspace_id")
        .eq("id", user.id)
        .single();

      if (userProfile?.workspace_id) {
        workspaceId = userProfile.workspace_id;
      }
    }

    if (!workspaceId) {
      console.error("No workspace found for user:", user.id);
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 400 }
      );
    }

    console.log("JIRA sync: workspace found:", workspaceId);

    const body = await req.json().catch(() => ({}));
    const validated = syncSchema.parse(body);
    console.log("JIRA sync: request validated:", validated);

    // Get project key - either from request or auto-detect from JIRA
    let projectKey = validated.projectKey;
    if (!projectKey) {
      console.log("JIRA sync: auto-detecting project key...");
      const projectKeys = await getProjectKeysForWorkspace(workspaceId);
      console.log("JIRA sync: detected project keys:", projectKeys);
      if (projectKeys.length === 0) {
        return NextResponse.json(
          { error: "No JIRA projects found. Please ensure your JIRA connection has access to at least one project." },
          { status: 400 }
        );
      }
      projectKey = projectKeys[0]; // Use first project
    }

    console.log("JIRA sync: using project key:", projectKey);

    // Sync stories
    const storyResult = await syncStoriesFromJira(
      workspaceId,
      projectKey,
      {
        fullSync: validated.fullSync,
      }
    );

    // Sync sprints if board ID provided
    let sprintResult = { synced: 0, errors: [] as string[] };
    if (validated.boardId) {
      sprintResult = await syncSprintsFromJira(
        workspaceId,
        validated.boardId
      );
    }

    return NextResponse.json({
      success: true,
      stories: {
        synced: storyResult.synced,
        errors: storyResult.errors.length,
      },
      sprints: {
        synced: sprintResult.synced,
        errors: sprintResult.errors.length,
      },
      totalErrors: [...storyResult.errors, ...sprintResult.errors],
    });
  } catch (error) {
    // Detailed error logging
    console.error("JIRA sync error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      error: error,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Capture JIRA sync errors - these are important to track
    Sentry.captureException(error, {
      tags: { module: "jira", operation: "sync" },
    });

    const errorMessage = error instanceof Error ? error.message : "Sync failed";
    console.error("Returning error to client:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
