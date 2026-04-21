import { createUntypedServerClient } from "../client";

export interface VelocityDataPoint {
  sprint: string;
  committed: number;
  completed: number;
}

export interface QualityTrendDataPoint {
  sprint: string;
  score: number;
}

export interface TeamMemberCapacity {
  name: string;
  allocated: number;
  capacity: number;
  utilization: number;
}

export interface TeamRadarMetrics {
  team: string;
  velocity: number;
  quality: number;
  predictability: number;
  collaboration: number;
  delivery: number;
}

export interface BurndownDataPoint {
  day: string;
  ideal: number;
  actual: number | null;
  forecast?: number | null;
}

export interface IndividualStats {
  storiesCompleted: number;
  pointsDelivered: number;
  avgQualityScore: number;
  activeStories: number;
  blockedItems: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  stories: Array<{
    id: string;
    jiraKey: string;
    title: string;
    points: number | null;
    assignee: string | null;
    priority: string | null;
    score: number | null;
    daysInColumn: number;
  }>;
}

export async function getVelocityData(
  workspaceId: string,
  sprintCount: number = 6
): Promise<VelocityDataPoint[]> {
  const supabase = createUntypedServerClient();

  const { data: stories, error } = await supabase
    .from("stories")
    .select("sprint_name, story_points, status_category")
    .eq("workspace_id", workspaceId)
    .not("sprint_name", "is", null)
    .order("jira_updated_at", { ascending: false });

  if (error || !stories) return [];

  const sprintMap = new Map<string, { committed: number; completed: number }>();

  for (const story of stories) {
    if (!story.sprint_name) continue;

    const existing = sprintMap.get(story.sprint_name) || { committed: 0, completed: 0 };
    const points = story.story_points || 0;

    existing.committed += points;
    if (story.status_category === "done") {
      existing.completed += points;
    }

    sprintMap.set(story.sprint_name, existing);
  }

  const sprints = Array.from(sprintMap.entries())
    .slice(0, sprintCount)
    .reverse()
    .map(([sprint, data]) => ({
      sprint,
      committed: data.committed,
      completed: data.completed,
    }));

  return sprints;
}

export async function getQualityTrend(
  workspaceId: string,
  sprintCount: number = 6
): Promise<QualityTrendDataPoint[]> {
  const supabase = createUntypedServerClient();

  const { data: scores, error } = await supabase
    .from("story_scores")
    .select(`
      total_score,
      scored_at,
      story_id,
      stories!inner (
        sprint_name,
        workspace_id
      )
    `)
    .eq("stories.workspace_id", workspaceId)
    .not("stories.sprint_name", "is", null)
    .order("scored_at", { ascending: false });

  if (error || !scores) return [];

  const sprintMap = new Map<string, { total: number; count: number }>();

  for (const score of scores) {
    const stories = score.stories as unknown as { sprint_name: string };
    const sprintName = stories?.sprint_name;
    if (!sprintName) continue;

    const existing = sprintMap.get(sprintName) || { total: 0, count: 0 };
    existing.total += score.total_score;
    existing.count += 1;
    sprintMap.set(sprintName, existing);
  }

  const sprints = Array.from(sprintMap.entries())
    .slice(0, sprintCount)
    .reverse()
    .map(([sprint, data]) => ({
      sprint,
      score: Math.round(data.total / data.count),
    }));

  return sprints;
}

export async function getTeamCapacity(
  workspaceId: string
): Promise<TeamMemberCapacity[]> {
  const supabase = createUntypedServerClient();

  const { data: stories, error } = await supabase
    .from("stories")
    .select("assignee_name, story_points, status_category")
    .eq("workspace_id", workspaceId)
    .not("assignee_name", "is", null)
    .in("status_category", ["todo", "in_progress"]);

  if (error || !stories) return [];

  const memberMap = new Map<string, number>();

  for (const story of stories) {
    if (!story.assignee_name) continue;
    const current = memberMap.get(story.assignee_name) || 0;
    memberMap.set(story.assignee_name, current + (story.story_points || 0));
  }

  const defaultCapacity = 20;

  return Array.from(memberMap.entries())
    .slice(0, 8)
    .map(([name, allocated]) => ({
      name,
      allocated,
      capacity: defaultCapacity,
      utilization: Math.round((allocated / defaultCapacity) * 100),
    }));
}

export async function getIndividualStats(
  workspaceId: string,
  userId: string
): Promise<IndividualStats> {
  const supabase = createUntypedServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("full_name, display_name, email")
    .eq("id", userId)
    .single();

  const assigneeName = user?.full_name || user?.display_name || user?.email || "";

  const { data: completedStories } = await supabase
    .from("stories")
    .select("id, story_points")
    .eq("workspace_id", workspaceId)
    .eq("assignee_name", assigneeName)
    .eq("status_category", "done");

  const { data: activeStories } = await supabase
    .from("stories")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("assignee_name", assigneeName)
    .eq("status_category", "in_progress");

  const { data: blockedStories } = await supabase
    .from("stories")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("assignee_name", assigneeName)
    .ilike("status", "%block%");

  const { data: scores } = await supabase
    .from("story_scores")
    .select(`
      total_score,
      story_id,
      stories!inner (
        workspace_id,
        assignee_name
      )
    `)
    .eq("stories.workspace_id", workspaceId)
    .eq("stories.assignee_name", assigneeName);

  const totalPoints = completedStories?.reduce((sum, s) => sum + (s.story_points || 0), 0) || 0;
  const avgScore = scores && scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length)
    : 0;

  return {
    storiesCompleted: completedStories?.length || 0,
    pointsDelivered: totalPoints,
    avgQualityScore: avgScore,
    activeStories: activeStories?.length || 0,
    blockedItems: blockedStories?.length || 0,
  };
}

export async function getKanbanBoard(
  workspaceId: string,
  sprintId?: number
): Promise<KanbanColumn[]> {
  const supabase = createUntypedServerClient();

  let query = supabase
    .from("stories")
    .select(`
      id,
      jira_key,
      title,
      story_points,
      assignee_name,
      priority,
      status,
      status_category,
      jira_updated_at,
      story_scores (
        total_score
      )
    `)
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("jira_updated_at", { ascending: false });

  if (sprintId) {
    query = query.eq("sprint_id", sprintId.toString());
  }

  const { data: stories, error } = await query;

  if (error || !stories) {
    return [
      { id: "todo", title: "To Do", stories: [] },
      { id: "in_progress", title: "In Progress", stories: [] },
      { id: "done", title: "Done", stories: [] },
    ];
  }

  const now = new Date();
  const columns: Record<string, KanbanColumn> = {
    todo: { id: "todo", title: "To Do", stories: [] },
    in_progress: { id: "in_progress", title: "In Progress", stories: [] },
    done: { id: "done", title: "Done", stories: [] },
  };

  for (const story of stories) {
    const scores = story.story_scores as Array<{ total_score: number }> | null;
    const updatedAt = new Date(story.jira_updated_at);
    const daysInColumn = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

    const mappedStory = {
      id: story.id,
      jiraKey: story.jira_key,
      title: story.title,
      points: story.story_points,
      assignee: story.assignee_name,
      priority: story.priority,
      score: scores?.[0]?.total_score ?? null,
      daysInColumn,
    };

    const category = story.status_category as string;
    if (columns[category]) {
      columns[category].stories.push(mappedStory);
    }
  }

  return [columns.todo, columns.in_progress, columns.done];
}

export async function getBurndownData(
  workspaceId: string,
  totalDays: number = 10
): Promise<{ data: BurndownDataPoint[]; totalPoints: number }> {
  const supabase = createUntypedServerClient();

  const { data: stories, error } = await supabase
    .from("stories")
    .select("story_points, status_category")
    .eq("workspace_id", workspaceId)
    .not("sprint_name", "is", null)
    .is("archived_at", null);

  if (error || !stories) {
    return { data: [], totalPoints: 0 };
  }

  const totalPoints = stories.reduce((sum, s) => sum + (s.story_points || 0), 0);
  const completedPoints = stories
    .filter((s) => s.status_category === "done")
    .reduce((sum, s) => sum + (s.story_points || 0), 0);

  if (totalPoints === 0) {
    return { data: [], totalPoints: 0 };
  }

  const currentDay = Math.min(Math.floor((completedPoints / totalPoints) * totalDays) + 1, totalDays);
  const data: BurndownDataPoint[] = [];

  for (let i = 1; i <= totalDays; i++) {
    const ideal = Math.round(totalPoints * (1 - i / totalDays));
    let actual: number | null = null;
    let forecast: number | null = null;

    if (i <= currentDay) {
      const progress = i / currentDay;
      actual = Math.round(totalPoints - completedPoints * progress);
    }

    if (i >= currentDay && i <= totalDays) {
      const remaining = totalPoints - completedPoints;
      const daysLeft = totalDays - currentDay;
      if (daysLeft > 0) {
        const dailyBurn = remaining / daysLeft;
        forecast = Math.max(0, Math.round(remaining - dailyBurn * (i - currentDay)));
      } else {
        forecast = remaining;
      }
    }

    data.push({
      day: `Day ${i}`,
      ideal,
      actual,
      forecast,
    });
  }

  return { data, totalPoints };
}
