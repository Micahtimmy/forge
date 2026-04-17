import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardData, getUserWorkspace } from "@/lib/db/queries/dashboard";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user's workspace
    const workspace = await getUserWorkspace(user.id);

    if (!workspace) {
      // Return empty data for users without workspace
      return NextResponse.json({
        sprintHealth: 0,
        storiesAtRisk: 0,
        recentUpdatesCount: 0,
        activePIsCount: 0,
        recentStories: [],
        upcomingDeadlines: [],
      });
    }

    // Fetch dashboard data
    const data = await getDashboardData(workspace.workspaceId);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
