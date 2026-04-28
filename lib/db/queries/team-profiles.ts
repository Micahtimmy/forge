import { createUntypedAdminClient } from "@/lib/db/client";

export interface TeamMemberProfile {
  id: string;
  workspace_id: string;
  user_id: string;
  metrics: Record<string, unknown>;
  strengths: string[] | null;
  growth_areas: string[] | null;
  coaching_suggestions: Record<string, unknown> | null;
  velocity_trend: "improving" | "stable" | "declining" | null;
  quality_trend: "improving" | "stable" | "declining" | null;
  visibility: "self_only" | "manager_visible" | "team_visible" | "anonymous_team";
  last_calculated_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
  };
}

export interface Skill {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  verified: boolean;
}

export interface TeamMemberMetrics {
  id: string;
  profile_id: string;
  period_start: string;
  period_end: string;
  metrics: Record<string, unknown>;
  created_at: string;
}

export interface TeamAnalytics {
  totalMembers: number;
  totalCapacity: number;
  avgVelocity: number;
  avgQualityScore: number;
  skillDistribution: Record<string, number>;
  specializationCoverage: Record<string, number>;
  availabilityBreakdown: Record<string, number>;
}

/**
 * Get all team member profiles for a workspace
 */
export async function getTeamProfiles(
  workspaceId: string
): Promise<TeamMemberProfile[]> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("team_member_profiles")
    .select("*, user:users(id, full_name, avatar_url, email)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []) as TeamMemberProfile[];
}

/**
 * Get a single team profile by user ID
 */
export async function getTeamProfile(
  workspaceId: string,
  userId: string
): Promise<TeamMemberProfile | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("team_member_profiles")
    .select("*, user:users(id, full_name, avatar_url, email)")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as TeamMemberProfile;
}

/**
 * Upsert team member profile
 */
export async function upsertTeamProfile(
  workspaceId: string,
  userId: string,
  input: {
    metrics?: Record<string, unknown>;
    strengths?: string[];
    growth_areas?: string[];
    coaching_suggestions?: Record<string, unknown>;
    velocity_trend?: TeamMemberProfile["velocity_trend"];
    quality_trend?: TeamMemberProfile["quality_trend"];
    visibility?: TeamMemberProfile["visibility"];
  }
): Promise<TeamMemberProfile> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("team_member_profiles")
    .upsert({
      workspace_id: workspaceId,
      user_id: userId,
      metrics: input.metrics || {},
      strengths: input.strengths || null,
      growth_areas: input.growth_areas || null,
      coaching_suggestions: input.coaching_suggestions || null,
      velocity_trend: input.velocity_trend || null,
      quality_trend: input.quality_trend || null,
      visibility: input.visibility || "manager_visible",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data as TeamMemberProfile;
}

/**
 * Update team member metrics
 */
export async function updateTeamMemberMetrics(
  profileId: string,
  metrics: Partial<Record<string, unknown>>
): Promise<void> {
  const supabase = createUntypedAdminClient();

  const { error } = await supabase
    .from("team_member_profiles")
    .update({
      metrics,
      last_calculated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) throw error;
}

/**
 * Record team member metrics for a period
 */
export async function recordTeamMemberMetrics(
  profileId: string,
  input: {
    period_start: string;
    period_end: string;
    metrics: Record<string, unknown>;
  }
): Promise<TeamMemberMetrics> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("team_member_metrics_history")
    .insert({
      profile_id: profileId,
      period_start: input.period_start,
      period_end: input.period_end,
      metrics: input.metrics,
    })
    .select()
    .single();

  if (error) throw error;

  return data as TeamMemberMetrics;
}

/**
 * Get team member metrics history
 */
export async function getTeamMemberMetricsHistory(
  profileId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<TeamMemberMetrics[]> {
  const supabase = createUntypedAdminClient();
  const { limit = 12, offset = 0 } = options;

  const { data, error } = await supabase
    .from("team_member_metrics_history")
    .select("*")
    .eq("profile_id", profileId)
    .order("period_end", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return (data || []) as TeamMemberMetrics[];
}

/**
 * Get team analytics
 */
export async function getTeamAnalytics(
  workspaceId: string
): Promise<TeamAnalytics> {
  const supabase = createUntypedAdminClient();

  const { data: profiles, error } = await supabase
    .from("team_member_profiles")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) throw error;

  const members = profiles || [];
  let totalVelocity = 0;
  let totalQuality = 0;
  let velocityCount = 0;
  let qualityCount = 0;

  const velocityBreakdown: Record<string, number> = {
    improving: 0,
    stable: 0,
    declining: 0,
  };

  for (const m of members) {
    const metrics = m.metrics as Record<string, number> || {};

    if (metrics.avg_velocity) {
      totalVelocity += metrics.avg_velocity;
      velocityCount++;
    }

    if (metrics.avg_quality) {
      totalQuality += metrics.avg_quality;
      qualityCount++;
    }

    if (m.velocity_trend) {
      velocityBreakdown[m.velocity_trend] = (velocityBreakdown[m.velocity_trend] || 0) + 1;
    }
  }

  return {
    totalMembers: members.length,
    totalCapacity: members.length * 100,
    avgVelocity: velocityCount > 0 ? totalVelocity / velocityCount : 0,
    avgQualityScore: qualityCount > 0 ? totalQuality / qualityCount : 0,
    skillDistribution: {},
    specializationCoverage: {},
    availabilityBreakdown: velocityBreakdown,
  };
}

/**
 * Find team members by skill
 */
export async function findTeamMembersBySkill(
  workspaceId: string,
  skillName: string,
  _minLevel?: Skill["level"]
): Promise<TeamMemberProfile[]> {
  const supabase = createUntypedAdminClient();

  // Query profiles and filter by skill in metrics
  const { data, error } = await supabase
    .from("team_member_profiles")
    .select("*, user:users(id, full_name, avatar_url, email)")
    .eq("workspace_id", workspaceId)
    .contains("strengths", [skillName]);

  if (error) throw error;

  return (data || []) as TeamMemberProfile[];
}

/**
 * Get team capacity
 */
export async function getTeamCapacity(
  workspaceId: string
): Promise<{
  total: number;
  available: number;
  byMember: Array<{
    userId: string;
    name: string;
    capacity: number;
    status: string;
  }>;
}> {
  const supabase = createUntypedAdminClient();

  const { data: profiles, error } = await supabase
    .from("team_member_profiles")
    .select("*, user:users(id, full_name)")
    .eq("workspace_id", workspaceId);

  if (error) throw error;

  const members = profiles || [];
  let total = 0;
  let available = 0;
  const byMember: Array<{ userId: string; name: string; capacity: number; status: string }> = [];

  for (const m of members) {
    const metrics = m.metrics as Record<string, number> || {};
    const capacity = metrics.capacity_percentage || 100;
    const status = m.visibility === "self_only" ? "unavailable" : "available";

    total += 100;
    if (status === "available") {
      available += capacity;
    }

    byMember.push({
      userId: m.user_id,
      name: (m.user as Record<string, string>)?.full_name || "Unknown",
      capacity,
      status,
    });
  }

  return { total, available, byMember };
}

/**
 * Recalculate profile metrics
 */
export async function recalculateProfileMetrics(
  profileId: string
): Promise<void> {
  const supabase = createUntypedAdminClient();

  // Get recent metrics history
  const { data: history, error: historyError } = await supabase
    .from("team_member_metrics_history")
    .select("*")
    .eq("profile_id", profileId)
    .order("period_end", { ascending: false })
    .limit(6);

  if (historyError) throw historyError;

  if (!history || history.length === 0) return;

  // Calculate trends
  const velocities = history
    .map((h) => (h.metrics as Record<string, number>)?.velocity)
    .filter((v) => v !== undefined);

  let velocityTrend: TeamMemberProfile["velocity_trend"] = "stable";
  if (velocities.length >= 2) {
    const recent = velocities.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, velocities.length);
    const older = velocities.slice(3).reduce((a, b) => a + b, 0) / Math.max(1, velocities.length - 3);
    if (recent > older * 1.1) velocityTrend = "improving";
    else if (recent < older * 0.9) velocityTrend = "declining";
  }

  // Update profile
  const { error } = await supabase
    .from("team_member_profiles")
    .update({
      velocity_trend: velocityTrend,
      last_calculated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) throw error;
}
