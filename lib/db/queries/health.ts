import { createAdminClient } from "@/lib/db/client";

export interface ProgramHealthScore {
  id: string;
  workspace_id: string;
  pi_id: string | null;
  overall_score: number;
  dimensions: HealthDimensions;
  trend: "improving" | "stable" | "declining";
  previous_score: number | null;
  alerts: HealthAlert[];
  calculated_at: string;
  created_at: string;
}

export interface HealthDimensions {
  velocity: DimensionScore;
  quality: DimensionScore;
  predictability: DimensionScore;
  team_health: DimensionScore;
  scope_stability: DimensionScore;
  dependency_risk: DimensionScore;
}

export interface DimensionScore {
  score: number;
  max: number;
  factors: { name: string; impact: number; value: unknown }[];
}

export interface HealthAlert {
  severity: "info" | "warning" | "critical";
  dimension: string;
  message: string;
  recommendation: string;
}

export interface SprintPrediction {
  id: string;
  workspace_id: string;
  sprint_id: string;
  predicted_completion_rate: number;
  confidence_level: number;
  risk_factors: RiskFactor[];
  at_risk_stories: string[];
  recommendations: string[];
  model_version: string;
  created_at: string;
}

export interface RiskFactor {
  factor: string;
  impact: "low" | "medium" | "high";
  description: string;
}

export interface StoryPrediction {
  id: string;
  story_id: string;
  workspace_id: string;
  completion_probability: number;
  estimated_days_remaining: number;
  blockers_detected: string[];
  recommendations: string[];
  created_at: string;
}

/**
 * Calculate and return program health score
 * Note: Full implementation requires 004_decision_intelligence.sql migration
 */
export async function calculateProgramHealth(
  workspaceId: string,
  piId?: string
): Promise<ProgramHealthScore> {
  const supabase = createAdminClient();

  // Get team size
  const { data: members } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId);

  const teamSize = members?.length || 1;

  // Basic quality estimate (would need join through stories to get proper workspace filtering)
  const avgScore = 70;

  // Calculate a basic health score
  const qualityScore = Math.round((avgScore / 100) * 20);
  const teamHealthScore = Math.min(15, teamSize > 0 ? 12 : 0);

  const dimensions: HealthDimensions = {
    velocity: { score: 15, max: 20, factors: [] },
    quality: {
      score: qualityScore,
      max: 20,
      factors: [{ name: "Average quality score", impact: qualityScore, value: avgScore }],
    },
    predictability: { score: 10, max: 15, factors: [] },
    team_health: {
      score: teamHealthScore,
      max: 15,
      factors: [{ name: "Team size", impact: teamHealthScore, value: teamSize }],
    },
    scope_stability: { score: 12, max: 15, factors: [] },
    dependency_risk: { score: 12, max: 15, factors: [] },
  };

  const overallScore = Math.round(
    ((dimensions.velocity.score / dimensions.velocity.max) * 20 +
      (dimensions.quality.score / dimensions.quality.max) * 20 +
      (dimensions.predictability.score / dimensions.predictability.max) * 15 +
      (dimensions.team_health.score / dimensions.team_health.max) * 15 +
      (dimensions.scope_stability.score / dimensions.scope_stability.max) * 15 +
      (dimensions.dependency_risk.score / dimensions.dependency_risk.max) * 15)
  );

  const alerts: HealthAlert[] = [];
  if (avgScore < 60) {
    alerts.push({
      severity: "warning",
      dimension: "quality",
      message: "Story quality needs improvement",
      recommendation: "Review and improve story definitions and acceptance criteria",
    });
  }

  return {
    id: crypto.randomUUID(),
    workspace_id: workspaceId,
    pi_id: piId || null,
    overall_score: overallScore,
    dimensions,
    trend: "stable",
    previous_score: null,
    alerts,
    calculated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

/**
 * Get latest health score for workspace
 */
export async function getLatestHealthScore(
  workspaceId: string,
  _piId?: string
): Promise<ProgramHealthScore | null> {
  // Return calculated score (no persistence without migration)
  return calculateProgramHealth(workspaceId, _piId);
}

/**
 * Get health score history
 */
export async function getHealthScoreHistory(
  workspaceId: string,
  _options: { piId?: string; days?: number; limit?: number } = {}
): Promise<ProgramHealthScore[]> {
  // Return single calculated score (no history without migration)
  const current = await calculateProgramHealth(workspaceId);
  return [current];
}

/**
 * Generate sprint prediction
 * Note: Full implementation requires sprints table with proper columns
 */
export async function generateSprintPrediction(
  workspaceId: string,
  sprintId: string
): Promise<SprintPrediction> {
  const supabase = createAdminClient();

  // Get sprint stories
  const { data: stories } = await supabase
    .from("stories")
    .select("id, status, story_points, assignee_id")
    .eq("workspace_id", workspaceId)
    .eq("sprint_id", sprintId);

  const storyCount = stories?.length || 0;
  const unassigned = stories?.filter((s) => !s.assignee_id) || [];
  const highPoint = stories?.filter((s) => (s.story_points || 0) > 8) || [];

  const riskFactors: RiskFactor[] = [];
  const atRiskStories: string[] = [];

  if (unassigned.length > 0) {
    riskFactors.push({
      factor: "Unassigned stories",
      impact: unassigned.length > 3 ? "high" : "medium",
      description: `${unassigned.length} stories without assignees`,
    });
    atRiskStories.push(...unassigned.map((s) => s.id));
  }

  if (highPoint.length > 0) {
    riskFactors.push({
      factor: "Large stories",
      impact: "medium",
      description: `${highPoint.length} stories with 8+ points`,
    });
    atRiskStories.push(...highPoint.map((s) => s.id));
  }

  let predictedRate = 75;
  for (const risk of riskFactors) {
    if (risk.impact === "high") predictedRate -= 15;
    else if (risk.impact === "medium") predictedRate -= 8;
  }
  predictedRate = Math.max(0, Math.min(100, predictedRate));

  const recommendations: string[] = [];
  if (unassigned.length > 0) {
    recommendations.push(`Assign owners to ${unassigned.length} unassigned stories`);
  }
  if (highPoint.length > 0) {
    recommendations.push(`Consider breaking down ${highPoint.length} large stories`);
  }

  return {
    id: crypto.randomUUID(),
    workspace_id: workspaceId,
    sprint_id: sprintId,
    predicted_completion_rate: Math.round(predictedRate),
    confidence_level: 65,
    risk_factors: riskFactors,
    at_risk_stories: [...new Set(atRiskStories)],
    recommendations,
    model_version: "1.0.0",
    created_at: new Date().toISOString(),
  };
}

/**
 * Get latest sprint prediction
 */
export async function getSprintPrediction(
  workspaceId: string,
  sprintId: string
): Promise<SprintPrediction | null> {
  return generateSprintPrediction(workspaceId, sprintId);
}
