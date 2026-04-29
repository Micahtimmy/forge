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
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 400 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const validated = syncSchema.parse(body);

    // Get project key - either from request or auto-detect from JIRA
    let projectKey = validated.projectKey;
    if (!projectKey) {
      const projectKeys = await getProjectKeysForWorkspace(workspaceId);
      if (projectKeys.length === 0) {
        return NextResponse.json(
          { error: "No JIRA projects found. Please ensure your JIRA connection has access to at least one project." },
          { status: 400 }
        );
      }
      projectKey = projectKeys[0]; // Use first project
    }

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
    console.error("JIRA sync error:", error);

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

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}
