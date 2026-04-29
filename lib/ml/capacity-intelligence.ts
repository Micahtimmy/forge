/**
 * Team Capacity Intelligence
 * Burnout detection and capacity optimization
 */

import { createUntypedAdminClient } from '@/lib/db/client';

export interface CapacityIntelligenceInput {
  workspaceId: string;
  teamId?: string;
  sprintId?: number;
}

export interface CapacityIntelligenceResult {
  overallHealth: 'healthy' | 'warning' | 'critical';
  burnoutRisk: number;
  overallocationRisk: number;
  alerts: CapacityAlert[];
  teamMetrics: TeamCapacityMetrics;
  recommendations: string[];
  modelVersion: string;
}

export interface CapacityAlert {
  type: 'burnout' | 'overallocation' | 'underutilization' | 'velocity_drop' | 'concentration';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affectedMembers?: string[];
}

export interface TeamCapacityMetrics {
  teamSize: number;
  totalCapacity: number;
  allocatedPoints: number;
  utilizationPercent: number;
  avgPointsPerMember: number;
  maxPointsPerMember: number;
  minPointsPerMember: number;
  recentVelocityTrend: 'increasing' | 'stable' | 'decreasing';
  sprintOverSprintChange: number;
}

interface MemberWorkload {
  userId: string;
  name: string;
  assignedPoints: number;
  assignedStories: number;
  completedPoints: number;
  inProgressDays: number;
  recentSprints: number[];
}

const MODEL_VERSION = '1.0.0-heuristic';

export async function analyzeTeamCapacity(
  input: CapacityIntelligenceInput
): Promise<CapacityIntelligenceResult> {
  const metrics = await gatherCapacityMetrics(input);
  const memberWorkloads = await getMemberWorkloads(input);
  const alerts = generateCapacityAlerts(metrics, memberWorkloads);

  const burnoutRisk = calculateBurnoutRisk(memberWorkloads, metrics);
  const overallocationRisk = calculateOverallocationRisk(metrics);
  const overallHealth = determineOverallHealth(burnoutRisk, overallocationRisk, alerts);

  const recommendations = generateRecommendations(alerts, metrics, memberWorkloads);

  // Store snapshot for ML training
  await storeCapacitySnapshot(input, metrics, burnoutRisk);

  return {
    overallHealth,
    burnoutRisk: Math.round(burnoutRisk),
    overallocationRisk: Math.round(overallocationRisk),
    alerts,
    teamMetrics: metrics,
    recommendations,
    modelVersion: MODEL_VERSION,
  };
}

async function gatherCapacityMetrics(
  input: CapacityIntelligenceInput
): Promise<TeamCapacityMetrics> {
  const supabase = createUntypedAdminClient();

  // Get team members
  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', input.workspaceId);

  const teamSize = members?.length || 1;

  // Get current sprint stories
  let storiesQuery = supabase
    .from('stories')
    .select('story_points, assignee_id, status')
    .eq('workspace_id', input.workspaceId);

  if (input.sprintId) {
    storiesQuery = storiesQuery.eq('sprint_id', input.sprintId);
  }

  const { data: stories } = await storiesQuery;
  const storyList = stories || [];

  // Calculate metrics
  const totalPoints = storyList.reduce((sum, s) => sum + (s.story_points || 0), 0);
  const completedPoints = storyList
    .filter(s => s.status === 'done')
    .reduce((sum, s) => sum + (s.story_points || 0), 0);

  // Points per member
  const memberPoints = new Map<string, number>();
  storyList.forEach(s => {
    if (s.assignee_id) {
      const current = memberPoints.get(s.assignee_id) || 0;
      memberPoints.set(s.assignee_id, current + (s.story_points || 0));
    }
  });

  const pointsArray = Array.from(memberPoints.values());
  const avgPoints = pointsArray.length > 0
    ? pointsArray.reduce((a, b) => a + b, 0) / pointsArray.length
    : 0;
  const maxPoints = pointsArray.length > 0 ? Math.max(...pointsArray) : 0;
  const minPoints = pointsArray.length > 0 ? Math.min(...pointsArray) : 0;

  // Assumed capacity (industry standard: ~8-10 points per sprint per dev)
  const totalCapacity = teamSize * 8;
  const utilizationPercent = totalCapacity > 0 ? (totalPoints / totalCapacity) * 100 : 0;

  // Get velocity trend from past sprints
  const { data: pastSprints } = await supabase
    .from('sprints')
    .select('completed_points')
    .eq('workspace_id', input.workspaceId)
    .eq('status', 'completed')
    .order('end_date', { ascending: false })
    .limit(5);

  let velocityTrend: TeamCapacityMetrics['recentVelocityTrend'] = 'stable';
  let sprintChange = 0;

  if (pastSprints && pastSprints.length >= 2) {
    const velocities = pastSprints.map(s => s.completed_points || 0);
    const recentAvg = (velocities[0] + velocities[1]) / 2;
    const olderAvg = velocities.slice(2).reduce((a, b) => a + b, 0) / Math.max(1, velocities.length - 2);

    if (recentAvg > olderAvg * 1.1) velocityTrend = 'increasing';
    else if (recentAvg < olderAvg * 0.9) velocityTrend = 'decreasing';

    sprintChange = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  }

  return {
    teamSize,
    totalCapacity,
    allocatedPoints: totalPoints,
    utilizationPercent: Math.round(utilizationPercent),
    avgPointsPerMember: Math.round(avgPoints * 10) / 10,
    maxPointsPerMember: maxPoints,
    minPointsPerMember: minPoints,
    recentVelocityTrend: velocityTrend,
    sprintOverSprintChange: Math.round(sprintChange),
  };
}

async function getMemberWorkloads(
  input: CapacityIntelligenceInput
): Promise<MemberWorkload[]> {
  const supabase = createUntypedAdminClient();

  // Get team members with their names
  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id, users!inner(full_name)')
    .eq('workspace_id', input.workspaceId);

  if (!members) return [];

  const workloads: MemberWorkload[] = [];

  for (const member of members) {
    // Get current sprint assignments
    let query = supabase
      .from('stories')
      .select('story_points, status, started_at')
      .eq('workspace_id', input.workspaceId)
      .eq('assignee_id', member.user_id);

    if (input.sprintId) {
      query = query.eq('sprint_id', input.sprintId);
    }

    const { data: stories } = await query;
    const storyList = stories || [];

    const assignedPoints = storyList.reduce((sum, s) => sum + (s.story_points || 0), 0);
    const completedPoints = storyList
      .filter(s => s.status === 'done')
      .reduce((sum, s) => sum + (s.story_points || 0), 0);

    // Calculate avg days in progress
    const inProgressStories = storyList.filter(s => s.status === 'in_progress' && s.started_at);
    let avgInProgressDays = 0;
    if (inProgressStories.length > 0) {
      const now = new Date();
      const totalDays = inProgressStories.reduce((sum, s) => {
        const started = new Date(s.started_at);
        return sum + Math.ceil((now.getTime() - started.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      avgInProgressDays = totalDays / inProgressStories.length;
    }

    // Get recent sprint history
    const { data: recentWork } = await supabase
      .from('stories')
      .select('story_points, sprints!inner(id)')
      .eq('workspace_id', input.workspaceId)
      .eq('assignee_id', member.user_id)
      .eq('status', 'done')
      .order('completed_at', { ascending: false })
      .limit(20);

    const sprintPoints = new Map<number, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (recentWork || []).forEach((w: any) => {
      const sprintId = w.sprints?.id;
      if (sprintId) {
        sprintPoints.set(sprintId, (sprintPoints.get(sprintId) || 0) + (w.story_points || 0));
      }
    });

    workloads.push({
      userId: member.user_id,
      name: (member.users as unknown as { full_name: string })?.full_name || 'Unknown',
      assignedPoints,
      assignedStories: storyList.length,
      completedPoints,
      inProgressDays: Math.round(avgInProgressDays),
      recentSprints: Array.from(sprintPoints.values()).slice(0, 5),
    });
  }

  return workloads;
}

function generateCapacityAlerts(
  metrics: TeamCapacityMetrics,
  workloads: MemberWorkload[]
): CapacityAlert[] {
  const alerts: CapacityAlert[] = [];

  // Overallocation alert
  if (metrics.utilizationPercent > 120) {
    alerts.push({
      type: 'overallocation',
      severity: 'critical',
      title: 'Team significantly overallocated',
      description: `Team is at ${metrics.utilizationPercent}% capacity utilization`,
    });
  } else if (metrics.utilizationPercent > 100) {
    alerts.push({
      type: 'overallocation',
      severity: 'warning',
      title: 'Team slightly overallocated',
      description: `Team is at ${metrics.utilizationPercent}% capacity`,
    });
  }

  // Underutilization alert
  if (metrics.utilizationPercent < 50 && metrics.allocatedPoints > 0) {
    alerts.push({
      type: 'underutilization',
      severity: 'info',
      title: 'Team may be underutilized',
      description: `Only ${metrics.utilizationPercent}% of capacity allocated`,
    });
  }

  // Individual overload
  const overloadedMembers = workloads.filter(w => w.assignedPoints > 13);
  if (overloadedMembers.length > 0) {
    alerts.push({
      type: 'burnout',
      severity: overloadedMembers.some(w => w.assignedPoints > 18) ? 'critical' : 'warning',
      title: `${overloadedMembers.length} team member(s) overloaded`,
      description: 'Some members have significantly more points than sustainable',
      affectedMembers: overloadedMembers.map(m => m.name),
    });
  }

  // Work concentration
  if (metrics.maxPointsPerMember > metrics.avgPointsPerMember * 2 && metrics.teamSize > 1) {
    const concentratedMember = workloads.find(w => w.assignedPoints === metrics.maxPointsPerMember);
    alerts.push({
      type: 'concentration',
      severity: 'warning',
      title: 'Work concentration detected',
      description: `One member has ${metrics.maxPointsPerMember} points vs avg ${metrics.avgPointsPerMember}`,
      affectedMembers: concentratedMember ? [concentratedMember.name] : undefined,
    });
  }

  // Velocity decline
  if (metrics.recentVelocityTrend === 'decreasing' && metrics.sprintOverSprintChange < -15) {
    alerts.push({
      type: 'velocity_drop',
      severity: 'warning',
      title: 'Velocity trending down',
      description: `Velocity decreased ${Math.abs(metrics.sprintOverSprintChange)}% recently`,
    });
  }

  // Long in-progress stories
  const stuckMembers = workloads.filter(w => w.inProgressDays > 5);
  if (stuckMembers.length > 0) {
    alerts.push({
      type: 'burnout',
      severity: 'warning',
      title: 'Stories stuck in progress',
      description: 'Some team members have stories in progress for extended periods',
      affectedMembers: stuckMembers.map(m => m.name),
    });
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function calculateBurnoutRisk(
  workloads: MemberWorkload[],
  metrics: TeamCapacityMetrics
): number {
  if (workloads.length === 0) return 0;

  let risk = 0;

  // Overallocation contributes to burnout
  if (metrics.utilizationPercent > 100) {
    risk += Math.min((metrics.utilizationPercent - 100) * 0.5, 30);
  }

  // Individual overloads
  const overloadedCount = workloads.filter(w => w.assignedPoints > 10).length;
  risk += (overloadedCount / workloads.length) * 25;

  // Stuck work indicates frustration
  const stuckCount = workloads.filter(w => w.inProgressDays > 5).length;
  risk += (stuckCount / workloads.length) * 20;

  // Declining velocity suggests fatigue
  if (metrics.recentVelocityTrend === 'decreasing') {
    risk += 15;
  }

  // Uneven distribution causes some to burn out
  if (metrics.maxPointsPerMember > metrics.avgPointsPerMember * 2) {
    risk += 10;
  }

  return Math.min(95, risk);
}

function calculateOverallocationRisk(metrics: TeamCapacityMetrics): number {
  if (metrics.utilizationPercent <= 80) return 10;
  if (metrics.utilizationPercent <= 100) return 30;
  if (metrics.utilizationPercent <= 120) return 60;
  return 90;
}

function determineOverallHealth(
  burnoutRisk: number,
  overallocationRisk: number,
  alerts: CapacityAlert[]
): CapacityIntelligenceResult['overallHealth'] {
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

  if (criticalAlerts > 0 || burnoutRisk > 60 || overallocationRisk > 70) {
    return 'critical';
  }

  const warningAlerts = alerts.filter(a => a.severity === 'warning').length;

  if (warningAlerts > 1 || burnoutRisk > 40 || overallocationRisk > 50) {
    return 'warning';
  }

  return 'healthy';
}

function generateRecommendations(
  alerts: CapacityAlert[],
  metrics: TeamCapacityMetrics,
  workloads: MemberWorkload[]
): string[] {
  const recommendations: string[] = [];

  const hasOverallocation = alerts.some(a => a.type === 'overallocation');
  const hasConcentration = alerts.some(a => a.type === 'concentration');
  const hasBurnout = alerts.some(a => a.type === 'burnout');
  const hasVelocityDrop = alerts.some(a => a.type === 'velocity_drop');

  if (hasOverallocation) {
    const excessPoints = metrics.allocatedPoints - metrics.totalCapacity;
    recommendations.push(
      `Remove ${Math.ceil(excessPoints)} story points from the sprint backlog`
    );
  }

  if (hasConcentration) {
    recommendations.push(
      'Redistribute work more evenly across team members'
    );
  }

  if (hasBurnout) {
    recommendations.push(
      'Schedule 1:1s with overloaded team members to discuss workload'
    );
    recommendations.push(
      'Consider pairing on complex stories to distribute knowledge'
    );
  }

  if (hasVelocityDrop) {
    recommendations.push(
      'Conduct a focused retrospective on velocity decline'
    );
  }

  if (metrics.recentVelocityTrend === 'decreasing') {
    recommendations.push(
      'Review and address any recurring impediments'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Team capacity looks healthy - maintain current planning approach'
    );
  }

  return recommendations.slice(0, 5);
}

async function storeCapacitySnapshot(
  input: CapacityIntelligenceInput,
  metrics: TeamCapacityMetrics,
  burnoutRisk: number
): Promise<void> {
  const supabase = createUntypedAdminClient();

  await supabase.from('team_capacity_snapshots').insert({
    workspace_id: input.workspaceId,
    team_id: input.teamId || null,
    sprint_id: input.sprintId || null,
    snapshot_date: new Date().toISOString().split('T')[0],
    total_capacity: metrics.totalCapacity,
    allocated_points: metrics.allocatedPoints,
    team_size: metrics.teamSize,
    avg_velocity: metrics.avgPointsPerMember,
    burnout_indicators: {
      risk: burnoutRisk,
      utilizationPercent: metrics.utilizationPercent,
      velocityTrend: metrics.recentVelocityTrend,
    },
  });
}
