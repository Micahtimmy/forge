/**
 * Cross-Workspace Analytics
 * Executive-level analytics aggregating data across workspaces
 */

import { createUntypedAdminClient } from '@/lib/db/client';

export interface ExecutiveSummary {
  totalWorkspaces: number;
  totalStories: number;
  totalSprints: number;
  averageQualityScore: number;
  qualityTrend: 'improving' | 'stable' | 'declining';
  atRiskSprints: number;
  completedPoints: number;
  plannedPoints: number;
  velocityTrend: 'improving' | 'stable' | 'declining';
  teamUtilization: number;
  period: {
    start: string;
    end: string;
  };
}

export interface WorkspaceComparison {
  workspaceId: string;
  workspaceName: string;
  metrics: {
    avgQualityScore: number;
    qualityTrend: number;
    sprintSuccessRate: number;
    velocity: number;
    velocityTrend: number;
    storyCount: number;
    activeSprintCount: number;
    teamSize: number;
  };
  ranking: {
    quality: number;
    velocity: number;
    overall: number;
  };
}

export interface QualityHeatmap {
  workspaces: {
    id: string;
    name: string;
    teams: {
      id: string;
      name: string;
      dimensions: {
        completeness: number;
        clarity: number;
        estimability: number;
        traceability: number;
        testability: number;
      };
      overallScore: number;
    }[];
  }[];
}

export interface VelocityForecast {
  workspaceId?: string;
  periods: {
    period: string;
    actual?: number;
    predicted: number;
    confidenceInterval: {
      low: number;
      high: number;
    };
  }[];
  trend: 'up' | 'stable' | 'down';
  confidence: number;
}

export interface RiskAggregation {
  totalRisks: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: {
    story_slip: number;
    sprint_failure: number;
    dependency_blocked: number;
    capacity_overload: number;
    quality_degradation: number;
  };
  topRisks: {
    id: string;
    workspaceId: string;
    workspaceName: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    probability: number;
    impact: string;
  }[];
  riskTrend: 'increasing' | 'stable' | 'decreasing';
}

export async function getExecutiveSummary(
  organizationId: string,
  periodDays = 30
): Promise<ExecutiveSummary> {
  const supabase = createUntypedAdminClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // Get workspaces in organization
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('organization_id', organizationId);

  const workspaceIds = workspaces?.map(w => w.id) || [];

  if (workspaceIds.length === 0) {
    return {
      totalWorkspaces: 0,
      totalStories: 0,
      totalSprints: 0,
      averageQualityScore: 0,
      qualityTrend: 'stable',
      atRiskSprints: 0,
      completedPoints: 0,
      plannedPoints: 0,
      velocityTrend: 'stable',
      teamUtilization: 0,
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
      },
    };
  }

  // Aggregate stories
  const { count: totalStories } = await supabase
    .from('stories')
    .select('*', { count: 'exact', head: true })
    .in('workspace_id', workspaceIds);

  // Aggregate sprints
  const { data: sprints } = await supabase
    .from('sprints')
    .select('id, status, story_points_planned, story_points_completed')
    .in('workspace_id', workspaceIds)
    .gte('created_at', startDate.toISOString());

  const totalSprints = sprints?.length || 0;
  const atRiskSprints = sprints?.filter(s => {
    const completion = s.story_points_planned > 0
      ? (s.story_points_completed / s.story_points_planned) * 100
      : 0;
    return s.status === 'active' && completion < 50;
  }).length || 0;

  const completedPoints = sprints?.reduce((sum, s) => sum + (s.story_points_completed || 0), 0) || 0;
  const plannedPoints = sprints?.reduce((sum, s) => sum + (s.story_points_planned || 0), 0) || 0;

  // Aggregate quality scores
  const { data: scores } = await supabase
    .from('story_scores')
    .select('total_score, created_at')
    .in('workspace_id', workspaceIds)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  const averageQualityScore = scores && scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length)
    : 0;

  // Calculate quality trend (compare first half vs second half)
  let qualityTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (scores && scores.length >= 10) {
    const midpoint = Math.floor(scores.length / 2);
    const firstHalfAvg = scores.slice(0, midpoint).reduce((sum, s) => sum + s.total_score, 0) / midpoint;
    const secondHalfAvg = scores.slice(midpoint).reduce((sum, s) => sum + s.total_score, 0) / (scores.length - midpoint);
    const diff = secondHalfAvg - firstHalfAvg;
    if (diff > 5) qualityTrend = 'improving';
    else if (diff < -5) qualityTrend = 'declining';
  }

  // Calculate velocity trend
  let velocityTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (sprints && sprints.length >= 4) {
    const midpoint = Math.floor(sprints.length / 2);
    const firstHalfVel = sprints.slice(0, midpoint).reduce((sum, s) => sum + (s.story_points_completed || 0), 0) / midpoint;
    const secondHalfVel = sprints.slice(midpoint).reduce((sum, s) => sum + (s.story_points_completed || 0), 0) / (sprints.length - midpoint);
    const diff = secondHalfVel - firstHalfVel;
    if (diff > 5) velocityTrend = 'improving';
    else if (diff < -5) velocityTrend = 'declining';
  }

  // Team utilization (simplified - based on completed vs planned)
  const teamUtilization = plannedPoints > 0 ? Math.round((completedPoints / plannedPoints) * 100) : 0;

  return {
    totalWorkspaces: workspaceIds.length,
    totalStories: totalStories || 0,
    totalSprints,
    averageQualityScore,
    qualityTrend,
    atRiskSprints,
    completedPoints,
    plannedPoints,
    velocityTrend,
    teamUtilization,
    period: {
      start: startDate.toISOString(),
      end: new Date().toISOString(),
    },
  };
}

export async function getWorkspaceComparison(
  organizationId: string
): Promise<WorkspaceComparison[]> {
  const supabase = createUntypedAdminClient();

  // Get workspaces in organization
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('organization_id', organizationId);

  if (!workspaces || workspaces.length === 0) {
    return [];
  }

  const comparisons: WorkspaceComparison[] = [];

  for (const workspace of workspaces) {
    // Get quality scores
    const { data: scores } = await supabase
      .from('story_scores')
      .select('total_score, created_at')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(100);

    const avgQualityScore = scores && scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length)
      : 0;

    // Calculate quality trend
    let qualityTrend = 0;
    if (scores && scores.length >= 10) {
      const recent = scores.slice(0, 10).reduce((sum, s) => sum + s.total_score, 0) / 10;
      const older = scores.slice(-10).reduce((sum, s) => sum + s.total_score, 0) / 10;
      qualityTrend = recent - older;
    }

    // Get sprints
    const { data: sprints } = await supabase
      .from('sprints')
      .select('id, status, story_points_planned, story_points_completed')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const completedSprints = sprints?.filter(s => s.status === 'completed') || [];
    const sprintSuccessRate = completedSprints.length > 0
      ? Math.round(completedSprints.filter(s =>
          s.story_points_completed >= s.story_points_planned * 0.8
        ).length / completedSprints.length * 100)
      : 0;

    const velocity = completedSprints.length > 0
      ? Math.round(completedSprints.reduce((sum, s) => sum + (s.story_points_completed || 0), 0) / completedSprints.length)
      : 0;

    // Calculate velocity trend
    let velocityTrend = 0;
    if (completedSprints.length >= 4) {
      const recentVel = completedSprints.slice(0, 2).reduce((sum, s) => sum + (s.story_points_completed || 0), 0) / 2;
      const olderVel = completedSprints.slice(-2).reduce((sum, s) => sum + (s.story_points_completed || 0), 0) / 2;
      velocityTrend = recentVel - olderVel;
    }

    // Get story count
    const { count: storyCount } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id);

    // Get active sprints
    const activeSprintCount = sprints?.filter(s => s.status === 'active').length || 0;

    // Get team size
    const { count: teamSize } = await supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id);

    comparisons.push({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      metrics: {
        avgQualityScore,
        qualityTrend,
        sprintSuccessRate,
        velocity,
        velocityTrend,
        storyCount: storyCount || 0,
        activeSprintCount,
        teamSize: teamSize || 0,
      },
      ranking: {
        quality: 0,
        velocity: 0,
        overall: 0,
      },
    });
  }

  // Calculate rankings
  const sortedByQuality = [...comparisons].sort((a, b) => b.metrics.avgQualityScore - a.metrics.avgQualityScore);
  const sortedByVelocity = [...comparisons].sort((a, b) => b.metrics.velocity - a.metrics.velocity);

  comparisons.forEach(comp => {
    comp.ranking.quality = sortedByQuality.findIndex(c => c.workspaceId === comp.workspaceId) + 1;
    comp.ranking.velocity = sortedByVelocity.findIndex(c => c.workspaceId === comp.workspaceId) + 1;
    comp.ranking.overall = Math.round((comp.ranking.quality + comp.ranking.velocity) / 2);
  });

  return comparisons.sort((a, b) => a.ranking.overall - b.ranking.overall);
}

export async function getQualityHeatmap(
  organizationId: string
): Promise<QualityHeatmap> {
  const supabase = createUntypedAdminClient();

  // Get workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('organization_id', organizationId);

  if (!workspaces || workspaces.length === 0) {
    return { workspaces: [] };
  }

  const result: QualityHeatmap = { workspaces: [] };

  for (const workspace of workspaces) {
    // Get teams in workspace
    const { data: teams } = await supabase
      .from('pi_teams')
      .select('id, name')
      .eq('workspace_id', workspace.id);

    const workspaceTeams: QualityHeatmap['workspaces'][0]['teams'] = [];

    for (const team of (teams || [])) {
      // Get average dimensions for this team
      const { data: scores } = await supabase
        .from('story_scores')
        .select('dimensions')
        .eq('workspace_id', workspace.id)
        // Would need team association in real implementation
        .limit(50);

      const dimensions = {
        completeness: 0,
        clarity: 0,
        estimability: 0,
        traceability: 0,
        testability: 0,
      };

      if (scores && scores.length > 0) {
        scores.forEach(s => {
          const dims = s.dimensions as Record<string, number> | null;
          if (dims) {
            dimensions.completeness += dims.completeness || 0;
            dimensions.clarity += dims.clarity || 0;
            dimensions.estimability += dims.estimability || 0;
            dimensions.traceability += dims.traceability || 0;
            dimensions.testability += dims.testability || 0;
          }
        });

        const count = scores.length;
        dimensions.completeness = Math.round(dimensions.completeness / count);
        dimensions.clarity = Math.round(dimensions.clarity / count);
        dimensions.estimability = Math.round(dimensions.estimability / count);
        dimensions.traceability = Math.round(dimensions.traceability / count);
        dimensions.testability = Math.round(dimensions.testability / count);
      }

      const overallScore = Math.round(
        (dimensions.completeness + dimensions.clarity + dimensions.estimability +
         dimensions.traceability + dimensions.testability) / 5
      );

      workspaceTeams.push({
        id: team.id,
        name: team.name,
        dimensions,
        overallScore,
      });
    }

    result.workspaces.push({
      id: workspace.id,
      name: workspace.name,
      teams: workspaceTeams,
    });
  }

  return result;
}

export async function getVelocityForecast(
  organizationId: string,
  workspaceId?: string,
  periodsAhead = 4
): Promise<VelocityForecast> {
  const supabase = createUntypedAdminClient();

  let query = supabase
    .from('sprints')
    .select('id, name, story_points_completed, start_date, end_date')
    .eq('status', 'completed')
    .order('end_date', { ascending: false })
    .limit(12);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  } else {
    // Get all workspaces in org
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('organization_id', organizationId);

    const workspaceIds = workspaces?.map(w => w.id) || [];
    if (workspaceIds.length > 0) {
      query = query.in('workspace_id', workspaceIds);
    }
  }

  const { data: sprints } = await query;

  if (!sprints || sprints.length < 3) {
    return {
      workspaceId,
      periods: [],
      trend: 'stable',
      confidence: 0,
    };
  }

  // Historical periods
  const periods: VelocityForecast['periods'] = sprints.map(s => ({
    period: s.end_date,
    actual: s.story_points_completed || 0,
    predicted: s.story_points_completed || 0,
    confidenceInterval: {
      low: s.story_points_completed || 0,
      high: s.story_points_completed || 0,
    },
  })).reverse();

  // Calculate average and std dev for forecasting
  const velocities = sprints.map(s => s.story_points_completed || 0);
  const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
  const variance = velocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / velocities.length;
  const stdDev = Math.sqrt(variance);

  // Simple trend calculation
  const recentAvg = velocities.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const trend: 'up' | 'stable' | 'down' =
    recentAvg > avgVelocity * 1.1 ? 'up' :
    recentAvg < avgVelocity * 0.9 ? 'down' : 'stable';

  // Add forecast periods
  const lastDate = new Date(sprints[0].end_date);
  const sprintDuration = 14; // Assume 2-week sprints

  for (let i = 1; i <= periodsAhead; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + (sprintDuration * i));

    // Simple linear forecast with trend
    const trendFactor = trend === 'up' ? 1.02 : trend === 'down' ? 0.98 : 1;
    const predicted = Math.round(avgVelocity * Math.pow(trendFactor, i));

    // Confidence interval widens with distance
    const intervalWidth = stdDev * (1 + (i * 0.2));

    periods.push({
      period: forecastDate.toISOString(),
      predicted,
      confidenceInterval: {
        low: Math.max(0, Math.round(predicted - intervalWidth)),
        high: Math.round(predicted + intervalWidth),
      },
    });
  }

  // Confidence decreases with fewer data points and higher variance
  const confidence = Math.min(0.95, Math.max(0.3,
    0.95 - (stdDev / avgVelocity) * 0.5 - (1 / sprints.length) * 0.2
  ));

  return {
    workspaceId,
    periods,
    trend,
    confidence: Math.round(confidence * 100) / 100,
  };
}

export async function getRiskAggregation(
  organizationId: string
): Promise<RiskAggregation> {
  const supabase = createUntypedAdminClient();

  // Get workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('organization_id', organizationId);

  const workspaceIds = workspaces?.map(w => w.id) || [];
  const workspaceMap = new Map(workspaces?.map(w => [w.id, w.name]));

  if (workspaceIds.length === 0) {
    return {
      totalRisks: 0,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      byType: { story_slip: 0, sprint_failure: 0, dependency_blocked: 0, capacity_overload: 0, quality_degradation: 0 },
      topRisks: [],
      riskTrend: 'stable',
    };
  }

  // Get risks (assuming a risks table exists)
  const { data: risks } = await supabase
    .from('pi_risks')
    .select('*')
    .in('workspace_id', workspaceIds)
    .is('resolved_at', null)
    .order('created_at', { ascending: false });

  const allRisks = risks || [];

  const bySeverity = {
    critical: allRisks.filter(r => r.severity === 'critical').length,
    high: allRisks.filter(r => r.severity === 'high').length,
    medium: allRisks.filter(r => r.severity === 'medium').length,
    low: allRisks.filter(r => r.severity === 'low').length,
  };

  const byType = {
    story_slip: allRisks.filter(r => r.type === 'story_slip').length,
    sprint_failure: allRisks.filter(r => r.type === 'sprint_failure').length,
    dependency_blocked: allRisks.filter(r => r.type === 'dependency_blocked').length,
    capacity_overload: allRisks.filter(r => r.type === 'capacity_overload').length,
    quality_degradation: allRisks.filter(r => r.type === 'quality_degradation').length,
  };

  const topRisks = allRisks
    .sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (severityOrder[a.severity as keyof typeof severityOrder] || 3) -
             (severityOrder[b.severity as keyof typeof severityOrder] || 3);
    })
    .slice(0, 5)
    .map(r => ({
      id: r.id,
      workspaceId: r.workspace_id,
      workspaceName: workspaceMap.get(r.workspace_id) || 'Unknown',
      title: r.title,
      severity: r.severity as 'critical' | 'high' | 'medium' | 'low',
      probability: r.probability || 50,
      impact: r.impact || 'Unknown',
    }));

  // Calculate risk trend (compare last 7 days vs previous 7 days)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentRisks = allRisks.filter(r => new Date(r.created_at) >= oneWeekAgo).length;
  const olderRisks = allRisks.filter(r => {
    const created = new Date(r.created_at);
    return created >= twoWeeksAgo && created < oneWeekAgo;
  }).length;

  const riskTrend: 'increasing' | 'stable' | 'decreasing' =
    recentRisks > olderRisks * 1.2 ? 'increasing' :
    recentRisks < olderRisks * 0.8 ? 'decreasing' : 'stable';

  return {
    totalRisks: allRisks.length,
    bySeverity,
    byType,
    topRisks,
    riskTrend,
  };
}
