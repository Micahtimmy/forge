import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface DashboardData {
  sprintHealth: number;
  storiesAtRisk: number;
  recentUpdatesCount: number;
  activePIsCount: number;
  recentStories: Array<{
    id: string;
    jiraKey: string;
    title: string;
    score: number | null;
    status: string;
  }>;
  upcomingDeadlines: Array<{
    label: string;
    date: string;
    type: "sprint" | "pi" | "milestone";
  }>;
}

export async function getDashboardData(workspaceId: string): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();

  // Fetch stories with scores - get stories needing attention (low scores or no score)
  const { data: stories } = await supabase
    .from("stories")
    .select(`
      id,
      jira_key,
      title,
      status,
      story_scores (
        total_score,
        scored_at
      )
    `)
    .eq("workspace_id", workspaceId)
    .order("synced_at", { ascending: false })
    .limit(20);

  // Calculate sprint health (average score of scored stories)
  let totalScore = 0;
  let scoredCount = 0;
  let atRiskCount = 0;

  const storiesWithScores = (stories || []).map((story) => {
    const scores = story.story_scores as Array<{ total_score: number; scored_at: string }> | null;
    const latestScore = scores?.[0]?.total_score ?? null;

    if (latestScore !== null) {
      totalScore += latestScore;
      scoredCount++;
      if (latestScore < 60) {
        atRiskCount++;
      }
    }

    return {
      id: story.id,
      jiraKey: story.jira_key,
      title: story.title,
      score: latestScore,
      status: story.status || "Unknown",
    };
  });

  const sprintHealth = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

  // Get stories needing attention (lowest scores first, or unscored)
  const recentStories = storiesWithScores
    .sort((a, b) => {
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return -1;
      if (b.score === null) return 1;
      return a.score - b.score;
    })
    .slice(0, 5);

  // Count signal updates from this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { count: updatesCount } = await supabase
    .from("signal_updates")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .gte("created_at", weekAgo.toISOString());

  // Count active PIs
  const { count: pisCount } = await supabase
    .from("program_increments")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .in("status", ["planning", "active"]);

  // Get upcoming PI deadlines
  const { data: pis } = await supabase
    .from("program_increments")
    .select("name, end_date, status")
    .eq("workspace_id", workspaceId)
    .in("status", ["planning", "active"])
    .order("end_date", { ascending: true })
    .limit(3);

  const upcomingDeadlines: DashboardData["upcomingDeadlines"] = (pis || [])
    .filter((pi) => pi.end_date)
    .map((pi) => ({
      label: `${pi.name} ends`,
      date: new Date(pi.end_date!).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      type: "pi" as const,
    }));

  return {
    sprintHealth,
    storiesAtRisk: atRiskCount,
    recentUpdatesCount: updatesCount || 0,
    activePIsCount: pisCount || 0,
    recentStories,
    upcomingDeadlines,
  };
}

export async function getUserWorkspace(userId: string): Promise<{ workspaceId: string; workspaceName: string } | null> {
  const supabase = await createSupabaseServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("workspace_id")
    .eq("id", userId)
    .single();

  if (!user?.workspace_id) {
    return null;
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", user.workspace_id)
    .single();

  if (!workspace) {
    return null;
  }

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
  };
}
