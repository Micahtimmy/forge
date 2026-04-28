import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { createUntypedServerClient } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const { workspaceId } = auth.context;

    // Rate limiting
    const rateLimit = checkRateLimit(req, auth.context.user.id, RATE_LIMITS.standard);
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }
    const supabase = createUntypedServerClient();

    const { data: sprints, error } = await supabase
      .from("sprints")
      .select(
        `
        id,
        jira_sprint_id,
        name,
        state,
        goal,
        start_date,
        end_date,
        complete_date,
        board_id,
        synced_at
      `
      )
      .eq("workspace_id", workspaceId)
      .order("start_date", { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Failed to fetch sprints: ${error.message}`);
    }

    const formattedSprints = (sprints || []).map((sprint) => ({
      id: sprint.id,
      jiraSprintId: sprint.jira_sprint_id,
      name: sprint.name,
      state: sprint.state,
      goal: sprint.goal,
      startDate: sprint.start_date,
      endDate: sprint.end_date,
      completeDate: sprint.complete_date,
      boardId: sprint.board_id,
      syncedAt: sprint.synced_at,
      isActive: sprint.state === "active",
    }));

    return NextResponse.json({ sprints: formattedSprints });
  } catch (error) {
    console.error("Sprints API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sprints" },
      { status: 500 }
    );
  }
}
