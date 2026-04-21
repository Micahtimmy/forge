import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserWorkspace } from "@/lib/db/queries/dashboard";
import { getKanbanBoard } from "@/lib/db/queries/analytics";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import * as Sentry from "@sentry/nextjs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sprintId = searchParams.get("sprintId");

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(req, user.id, RATE_LIMITS.standard);
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const workspace = await getUserWorkspace(user.id);
    if (!workspace) {
      return NextResponse.json([
        { id: "todo", title: "To Do", stories: [] },
        { id: "in_progress", title: "In Progress", stories: [] },
        { id: "done", title: "Done", stories: [] },
      ]);
    }

    const data = await getKanbanBoard(
      workspace.workspaceId,
      sprintId ? parseInt(sprintId, 10) : undefined
    );
    return NextResponse.json(data);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "Failed to fetch kanban board" }, { status: 500 });
  }
}
