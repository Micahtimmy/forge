/**
 * Story Slip Prediction
 * Predicts whether individual stories will complete within their sprint
 */

import { createUntypedAdminClient } from '@/lib/db/client';

export interface StorySlipInput {
  storyId: string;
  workspaceId: string;
}

export interface StorySlipResult {
  storyId: string;
  slipProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: StoryRiskFactor[];
  recommendation: string;
  modelVersion: string;
}

export interface StoryRiskFactor {
  factor: string;
  impact: number;
  description: string;
}

interface StoryMetrics {
  storyPoints: number;
  qualityScore: number;
  status: string;
  daysInProgress: number;
  daysRemaining: number;
  assigneeWorkload: number;
  hasAcceptanceCriteria: boolean;
  hasDescription: boolean;
  complexityIndicators: number;
  blockerCount: number;
  dependencyCount: number;
  teamAvgCycleTime: number;
  historicalSlipRate: number;
}

const MODEL_VERSION = '1.0.0-heuristic';

export async function predictStorySlip(
  input: StorySlipInput
): Promise<StorySlipResult> {
  const metrics = await gatherStoryMetrics(input);
  const factors = analyzeStoryRiskFactors(metrics);
  const slipProbability = calculateSlipProbability(factors, metrics);

  const riskLevel = getSlipRiskLevel(slipProbability);
  const recommendation = generateSlipRecommendation(factors, riskLevel, metrics);

  // Store prediction
  await storeSlipPrediction(input, slipProbability, factors, recommendation);

  return {
    storyId: input.storyId,
    slipProbability: Math.round(slipProbability),
    riskLevel,
    riskFactors: factors.slice(0, 4),
    recommendation,
    modelVersion: MODEL_VERSION,
  };
}

async function gatherStoryMetrics(input: StorySlipInput): Promise<StoryMetrics> {
  const supabase = createUntypedAdminClient();

  // Get story details
  const { data: story } = await supabase
    .from('stories')
    .select('*, sprints!inner(start_date, end_date)')
    .eq('id', input.storyId)
    .eq('workspace_id', input.workspaceId)
    .single();

  if (!story) {
    throw new Error('Story not found');
  }

  // Get quality score
  const { data: score } = await supabase
    .from('story_scores')
    .select('score')
    .eq('story_id', input.storyId)
    .order('scored_at', { ascending: false })
    .limit(1)
    .single();

  // Get assignee workload
  let assigneeWorkload = 0;
  if (story.assignee_id) {
    const { count } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('assignee_id', story.assignee_id)
      .eq('sprint_id', story.sprint_id)
      .in('status', ['in_progress', 'to_do']);
    assigneeWorkload = count || 0;
  }

  // Get historical slip rate for similar stories
  const { data: historicalStories } = await supabase
    .from('stories')
    .select('id, status, sprint_id, completed_at, sprints!inner(end_date)')
    .eq('workspace_id', input.workspaceId)
    .neq('sprint_id', story.sprint_id)
    .not('completed_at', 'is', null)
    .limit(100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slippedCount = (historicalStories || []).filter((s: any) => {
    if (!s.completed_at || !s.sprints?.end_date) return false;
    return new Date(s.completed_at) > new Date(s.sprints.end_date);
  }).length;

  const historicalSlipRate = historicalStories && historicalStories.length > 0
    ? (slippedCount / historicalStories.length) * 100
    : 15; // Default assumption

  // Get team average cycle time
  const { data: completedStories } = await supabase
    .from('stories')
    .select('created_at, completed_at')
    .eq('workspace_id', input.workspaceId)
    .eq('status', 'done')
    .not('completed_at', 'is', null)
    .limit(50);

  let avgCycleTime = 5; // Default 5 days
  if (completedStories && completedStories.length > 0) {
    const cycleTimes = completedStories
      .filter(s => s.completed_at && s.created_at)
      .map(s => {
        const start = new Date(s.created_at);
        const end = new Date(s.completed_at);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      });

    if (cycleTimes.length > 0) {
      avgCycleTime = cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length;
    }
  }

  // Calculate days in progress
  let daysInProgress = 0;
  if (story.status === 'in_progress' && story.started_at) {
    const started = new Date(story.started_at);
    const now = new Date();
    daysInProgress = Math.ceil((now.getTime() - started.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Calculate days remaining in sprint
  const sprintEnd = new Date(story.sprints.end_date);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((sprintEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Complexity indicators from description
  const description = story.description || '';
  const complexityIndicators = countComplexityIndicators(description);

  return {
    storyPoints: story.story_points || 0,
    qualityScore: score?.score || 0,
    status: story.status,
    daysInProgress,
    daysRemaining,
    assigneeWorkload,
    hasAcceptanceCriteria: description.toLowerCase().includes('acceptance criteria') ||
      description.toLowerCase().includes('given') ||
      description.toLowerCase().includes('when'),
    hasDescription: description.length > 50,
    complexityIndicators,
    blockerCount: 0, // Would need blocker tracking
    dependencyCount: 0, // Would need dependency tracking
    teamAvgCycleTime: avgCycleTime,
    historicalSlipRate,
  };
}

function countComplexityIndicators(text: string): number {
  const indicators = [
    /integrat/i,
    /migrat/i,
    /refactor/i,
    /performance/i,
    /security/i,
    /database/i,
    /api/i,
    /third[- ]party/i,
    /legacy/i,
    /complex/i,
  ];

  return indicators.filter(pattern => pattern.test(text)).length;
}

function analyzeStoryRiskFactors(metrics: StoryMetrics): StoryRiskFactor[] {
  const factors: StoryRiskFactor[] = [];

  // Size risk
  if (metrics.storyPoints >= 8) {
    factors.push({
      factor: 'large_story',
      impact: 25,
      description: `Story is ${metrics.storyPoints} points - consider breaking down`,
    });
  } else if (metrics.storyPoints >= 5) {
    factors.push({
      factor: 'medium_story',
      impact: 10,
      description: 'Medium-sized story may have hidden complexity',
    });
  }

  // Quality risk
  if (metrics.qualityScore > 0 && metrics.qualityScore < 60) {
    factors.push({
      factor: 'low_quality_score',
      impact: 20,
      description: `Quality score of ${metrics.qualityScore} indicates poor definition`,
    });
  }

  // Progress risk
  if (metrics.status === 'to_do' && metrics.daysRemaining <= 3) {
    factors.push({
      factor: 'not_started_late_sprint',
      impact: 35,
      description: 'Story not started with only ' + metrics.daysRemaining + ' days remaining',
    });
  }

  if (metrics.daysInProgress > metrics.teamAvgCycleTime) {
    factors.push({
      factor: 'exceeds_cycle_time',
      impact: 20,
      description: `In progress for ${metrics.daysInProgress} days (team avg: ${Math.round(metrics.teamAvgCycleTime)})`,
    });
  }

  // Workload risk
  if (metrics.assigneeWorkload > 5) {
    factors.push({
      factor: 'assignee_overloaded',
      impact: 15,
      description: `Assignee has ${metrics.assigneeWorkload} stories in this sprint`,
    });
  }

  // Definition risks
  if (!metrics.hasAcceptanceCriteria) {
    factors.push({
      factor: 'no_acceptance_criteria',
      impact: 15,
      description: 'No clear acceptance criteria found',
    });
  }

  if (!metrics.hasDescription) {
    factors.push({
      factor: 'minimal_description',
      impact: 10,
      description: 'Story lacks detailed description',
    });
  }

  // Complexity risk
  if (metrics.complexityIndicators >= 3) {
    factors.push({
      factor: 'high_complexity_indicators',
      impact: 15,
      description: 'Multiple complexity indicators in description',
    });
  }

  // Time pressure
  if (metrics.daysRemaining <= 1 && metrics.status !== 'done') {
    factors.push({
      factor: 'deadline_imminent',
      impact: 30,
      description: 'Sprint ends tomorrow/today',
    });
  }

  return factors.sort((a, b) => b.impact - a.impact);
}

function calculateSlipProbability(
  factors: StoryRiskFactor[],
  metrics: StoryMetrics
): number {
  // Base probability from historical rate
  let probability = metrics.historicalSlipRate;

  // Add factor impacts with diminishing returns
  for (let i = 0; i < factors.length; i++) {
    const weight = Math.pow(0.8, i);
    probability += factors[i].impact * weight * 0.5;
  }

  // Adjust for status
  if (metrics.status === 'done') {
    probability = 0;
  } else if (metrics.status === 'in_progress' && metrics.daysRemaining > 3) {
    probability *= 0.8;
  }

  return Math.min(95, Math.max(5, probability));
}

function getSlipRiskLevel(probability: number): StorySlipResult['riskLevel'] {
  if (probability >= 60) return 'high';
  if (probability >= 35) return 'medium';
  return 'low';
}

function generateSlipRecommendation(
  factors: StoryRiskFactor[],
  riskLevel: string,
  metrics: StoryMetrics
): string {
  if (metrics.status === 'done') {
    return 'Story is complete.';
  }

  if (factors.length === 0) {
    return 'Story is on track for sprint completion.';
  }

  const topFactor = factors[0];

  switch (topFactor.factor) {
    case 'large_story':
      return 'Consider breaking this story into smaller deliverables.';
    case 'not_started_late_sprint':
      return 'Start immediately or consider moving to next sprint.';
    case 'exceeds_cycle_time':
      return 'Investigate blockers and consider pair programming.';
    case 'assignee_overloaded':
      return 'Redistribute work or pair with another team member.';
    case 'low_quality_score':
      return 'Clarify requirements before continuing development.';
    case 'deadline_imminent':
      return 'Focus solely on this story or move to next sprint.';
    default:
      return `Address: ${topFactor.description}`;
  }
}

async function storeSlipPrediction(
  input: StorySlipInput,
  probability: number,
  factors: StoryRiskFactor[],
  recommendation: string
): Promise<void> {
  const supabase = createUntypedAdminClient();

  // Get sprint_id for the story
  const { data: story } = await supabase
    .from('stories')
    .select('sprint_id')
    .eq('id', input.storyId)
    .single();

  if (!story?.sprint_id) return;

  await supabase.from('story_slip_predictions').upsert(
    {
      workspace_id: input.workspaceId,
      story_id: input.storyId,
      sprint_id: story.sprint_id,
      prediction_date: new Date().toISOString().split('T')[0],
      slip_probability: probability,
      risk_factors: factors,
      recommendation,
      model_version: MODEL_VERSION,
    },
    { onConflict: 'workspace_id,story_id,prediction_date' }
  );
}

export async function predictSprintStories(
  workspaceId: string,
  sprintId: number
): Promise<StorySlipResult[]> {
  const supabase = createUntypedAdminClient();

  const { data: stories } = await supabase
    .from('stories')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('sprint_id', sprintId)
    .neq('status', 'done');

  if (!stories || stories.length === 0) return [];

  const predictions = await Promise.all(
    stories.map(s => predictStorySlip({ storyId: s.id, workspaceId }))
  );

  return predictions.sort((a, b) => b.slipProbability - a.slipProbability);
}
