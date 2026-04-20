import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { syncStoriesFromJira, syncSprintsFromJira } from "@/lib/jira/sync";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";

const syncSchema = z.object({
  projectKey: z.string(),
  boardId: z.number().optional(),
  fullSync: z.boolean().optional(),
});

// Trigger manual JIRA sync
export async function POST(req: NextRequest) {
  try {
    // Get user session
    const supabase = await createSupabaseServerClient();

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

    // Get user's workspace
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 400 }
      );
    }

    const workspaceId = (membership as { workspace_id: string }).workspace_id;
    const body = await req.json();
    const validated = syncSchema.parse(body);

    // Sync stories
    const storyResult = await syncStoriesFromJira(
      workspaceId,
      validated.projectKey,
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

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}
