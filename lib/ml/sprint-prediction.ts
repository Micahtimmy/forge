/**
 * Sprint Failure Prediction
 * ML-based prediction of sprint completion probability
 */

import { createUntypedAdminClient } from '@/lib/db/client';

export interface SprintPredictionInput {
  sprintId: number;
  workspaceId: string;
}

export interface SprintPredictionResult {
  sprintId: number;
  failureProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  recommendation: string;
  confidence: number;
  modelVersion: string;
}

export interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
  suggestion?: string;
}

interface SprintMetrics {
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  daysRemaining: number;
  totalDays: number;
  storiesTotal: number;
  storiesCompleted: number;
  storiesInProgress: number;
  avgQualityScore: number;
  blockedStories: number;
  scopeChangeCount: number;
  teamVelocity: number;
  lastSprintCompletion: number;
}

const MODEL_VERSION = '1.0.0-heuristic';

export async function predictSprintFailure(
  input: SprintPredictionInput
): Promise<SprintPredictionResult> {
  const metrics = await gatherSprintMetrics(input);
  const factors = analyzeRiskFactors(metrics);
  const failureProbability = calculateFailureProbability(factors);

  const riskLevel = getRiskLevel(failureProbability);
  const recommendation = generateRecommendation(factors, riskLevel);

  // Store prediction for model training
  await storePrediction(input, failureProbability, factors);

  return {
    sprintId: input.sprintId,
    failureProbability: Math.round(failureProbability),
    riskLevel,
    riskFactors: factors.slice(0, 5), // Top 5 factors
    recommendation,
    confidence: calculateConfidence(metrics),
    modelVersion: MODEL_VERSION,
  };
}

async function gatherSprintMetrics(
  input: SprintPredictionInput
): Promise<SprintMetrics> {
  const supabase = createUntypedAdminClient();

  // Get sprint details
  const { data: sprint } = await supabase
    .from('sprints')
    .select('*')
    .eq('id', input.sprintId)
    .eq('workspace_id', input.workspaceId)
    .single();

  if (!sprint) {
    throw new Error('Sprint not found');
  }

  // Get stories in sprint
  const { data: stories } = await supabase
    .from('stories')
    .select('id, status, story_points, jira_status')
    .eq('sprint_id', input.sprintId)
    .eq('workspace_id', input.workspaceId);

  const storyList = stories || [];

  // Get quality scores
  const storyIds = storyList.map(s => s.id);
  const { data: scores } = await supabase
    .from('story_scores')
    .select('score')
    .in('story_id', storyIds);

  // Get historical velocity
  const { data: pastSprints } = await supabase
    .from('sprints')
    .select('completed_points, total_points')
    .eq('workspace_id', input.workspaceId)
    .eq('status', 'completed')
    .order('end_date', { ascending: false })
    .limit(5);

  // Calculate metrics
  const totalPoints = storyList.reduce((sum, s) => sum + (s.story_points || 0), 0);
  const completedStories = storyList.filter(s => s.status === 'done');
  const completedPoints = completedStories.reduce((sum, s) => sum + (s.story_points || 0), 0);
  const inProgressStories = storyList.filter(s => s.status === 'in_progress');
  const blockedStories = storyList.filter(
    s => s.jira_status?.toLowerCase().includes('blocked') || s.jira_status?.toLowerCase().includes('impediment')
  );

  const startDate = new Date(sprint.start_date);
  const endDate = new Date(sprint.end_date);
  const now = new Date();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const avgScore = scores && scores.length > 0
    ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
    : 0;

  const pastVelocities = (pastSprints || [])
    .filter(s => s.total_points > 0)
    .map(s => (s.completed_points / s.total_points) * 100);
  const avgVelocity = pastVelocities.length > 0
    ? pastVelocities.reduce((a, b) => a + b, 0) / pastVelocities.length
    : 80;

  return {
    totalPoints,
    completedPoints,
    remainingPoints: totalPoints - completedPoints,
    daysRemaining,
    totalDays,
    storiesTotal: storyList.length,
    storiesCompleted: completedStories.length,
    storiesInProgress: inProgressStories.length,
    avgQualityScore: avgScore,
    blockedStories: blockedStories.length,
    scopeChangeCount: 0, // Would need to track scope changes
    teamVelocity: avgVelocity,
    lastSprintCompletion: pastVelocities[0] || 80,
  };
}

function analyzeRiskFactors(metrics: SprintMetrics): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // Progress-based risks
  const progressPercentage = metrics.totalPoints > 0
    ? (metrics.completedPoints / metrics.totalPoints) * 100
    : 0;
  const timePercentage = metrics.totalDays > 0
    ? ((metrics.totalDays - metrics.daysRemaining) / metrics.totalDays) * 100
    : 0;
  const progressDelta = timePercentage - progressPercentage;

  if (progressDelta > 30) {
    factors.push({
      factor: 'severe_velocity_lag',
      impact: Math.min(progressDelta, 50),
      description: `Sprint is ${Math.round(progressDelta)}% behind schedule`,
      suggestion: 'Consider removing lower-priority stories from sprint scope',
    });
  } else if (progressDelta > 15) {
    factors.push({
      factor: 'velocity_lag',
      impact: progressDelta,
      description: `Sprint is ${Math.round(progressDelta)}% behind schedule`,
      suggestion: 'Focus on completing in-progress work before starting new stories',
    });
  }

  // Blocked stories risk
  if (metrics.blockedStories > 0) {
    const blockageImpact = (metrics.blockedStories / metrics.storiesTotal) * 30;
    factors.push({
      factor: 'blocked_stories',
      impact: blockageImpact,
      description: `${metrics.blockedStories} stories are currently blocked`,
      suggestion: 'Prioritize unblocking activities and escalate impediments',
    });
  }

  // Quality score risk
  if (metrics.avgQualityScore > 0 && metrics.avgQualityScore < 60) {
    factors.push({
      factor: 'low_quality_scores',
      impact: 20,
      description: `Average story quality score is ${Math.round(metrics.avgQualityScore)}/100`,
      suggestion: 'Improve acceptance criteria and story definitions',
    });
  } else if (metrics.avgQualityScore > 0 && metrics.avgQualityScore < 75) {
    factors.push({
      factor: 'medium_quality_scores',
      impact: 10,
      description: `Story quality scores could be improved (${Math.round(metrics.avgQualityScore)}/100)`,
    });
  }

  // Too much WIP risk
  const wipPercentage = metrics.storiesTotal > 0
    ? (metrics.storiesInProgress / metrics.storiesTotal) * 100
    : 0;
  if (wipPercentage > 50) {
    factors.push({
      factor: 'high_wip',
      impact: 15,
      description: `${Math.round(wipPercentage)}% of stories are in progress simultaneously`,
      suggestion: 'Reduce work-in-progress by focusing on completing started stories',
    });
  }

  // Historical velocity risk
  if (metrics.lastSprintCompletion < 70) {
    factors.push({
      factor: 'historical_underperformance',
      impact: 15,
      description: `Last sprint completed only ${Math.round(metrics.lastSprintCompletion)}% of planned work`,
      suggestion: 'Consider reducing sprint commitment based on historical capacity',
    });
  }

  // Days remaining risk
  if (metrics.daysRemaining <= 2 && metrics.remainingPoints > metrics.completedPoints * 0.3) {
    factors.push({
      factor: 'deadline_pressure',
      impact: 25,
      description: `${metrics.daysRemaining} days remaining with ${metrics.remainingPoints} points of work`,
      suggestion: 'Focus on highest-value stories that can realistically complete',
    });
  }

  // No progress risk
  if (timePercentage > 50 && progressPercentage < 10) {
    factors.push({
      factor: 'minimal_progress',
      impact: 40,
      description: 'Sprint is over halfway complete with minimal progress',
      suggestion: 'Investigate blockers and consider a mid-sprint retrospective',
    });
  }

  // Sort by impact
  return factors.sort((a, b) => b.impact - a.impact);
}

function calculateFailureProbability(factors: RiskFactor[]): number {
  if (factors.length === 0) {
    return 10; // Base risk
  }

  // Sum impacts with diminishing returns
  let totalRisk = 10; // Base risk

  for (let i = 0; i < factors.length; i++) {
    const factor = factors[i];
    // Diminishing returns for multiple factors
    const weight = Math.pow(0.85, i);
    totalRisk += factor.impact * weight;
  }

  return Math.min(95, Math.max(5, totalRisk));
}

function getRiskLevel(probability: number): SprintPredictionResult['riskLevel'] {
  if (probability >= 70) return 'critical';
  if (probability >= 50) return 'high';
  if (probability >= 30) return 'medium';
  return 'low';
}

function generateRecommendation(factors: RiskFactor[], riskLevel: string): string {
  if (factors.length === 0) {
    return 'Sprint is on track. Continue current pace.';
  }

  const topFactor = factors[0];

  switch (riskLevel) {
    case 'critical':
      return `Critical: ${topFactor.suggestion || topFactor.description}. Consider emergency scope reduction.`;
    case 'high':
      return `High risk: ${topFactor.suggestion || topFactor.description}. Take immediate action.`;
    case 'medium':
      return `Attention needed: ${topFactor.suggestion || topFactor.description}`;
    default:
      return 'Sprint is progressing well. Monitor for changes.';
  }
}

function calculateConfidence(metrics: SprintMetrics): number {
  // Confidence increases with more data points and mid-sprint timing
  let confidence = 50;

  // More stories = more reliable prediction
  if (metrics.storiesTotal >= 10) confidence += 15;
  else if (metrics.storiesTotal >= 5) confidence += 10;

  // Mid-sprint predictions are more accurate
  const progressInSprint = 1 - (metrics.daysRemaining / metrics.totalDays);
  if (progressInSprint > 0.3 && progressInSprint < 0.8) {
    confidence += 20;
  } else if (progressInSprint >= 0.8) {
    confidence += 10; // Less valuable at very end
  }

  // Quality scores available increases confidence
  if (metrics.avgQualityScore > 0) {
    confidence += 10;
  }

  return Math.min(90, confidence);
}

async function storePrediction(
  input: SprintPredictionInput,
  probability: number,
  factors: RiskFactor[]
): Promise<void> {
  const supabase = createUntypedAdminClient();

  await supabase.from('sprint_predictions').upsert(
    {
      workspace_id: input.workspaceId,
      sprint_id: input.sprintId,
      prediction_date: new Date().toISOString().split('T')[0],
      failure_probability: probability,
      risk_factors: factors,
      model_version: MODEL_VERSION,
    },
    { onConflict: 'workspace_id,sprint_id,prediction_date' }
  );
}

export async function getSprintPredictionHistory(
  workspaceId: string,
  sprintId: number
): Promise<SprintPredictionResult[]> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from('sprint_predictions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('sprint_id', sprintId)
    .order('prediction_date', { ascending: true });

  if (error || !data) return [];

  return data.map(p => ({
    sprintId: p.sprint_id,
    failureProbability: p.failure_probability,
    riskLevel: getRiskLevel(p.failure_probability),
    riskFactors: p.risk_factors || [],
    recommendation: '',
    confidence: p.confidence || 50,
    modelVersion: p.model_version,
  }));
}
