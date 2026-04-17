import { createUntypedServerClient } from "../client";

export interface StoryScore {
  id: string;
  workspaceId: string;
  storyId: string;
  totalScore: number;
  completeness: { score: number; max: number; reasoning: string | null };
  clarity: { score: number; max: number; reasoning: string | null };
  estimability: { score: number; max: number; reasoning: string | null };
  traceability: { score: number; max: number; reasoning: string | null };
  testability: { score: number; max: number; reasoning: string | null };
  suggestions: Array<{
    type: string;
    current: string;
    improved: string;
  }>;
  aiModel: string;
  promptVersion: string;
  scoredAt: Date;
}

// Get scores for a story
export async function getScoresForStory(
  workspaceId: string,
  storyId: string
): Promise<StoryScore[]> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("story_scores")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("story_id", storyId)
    .order("scored_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch scores: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    storyId: row.story_id,
    totalScore: row.total_score,
    completeness: {
      score: row.completeness_score,
      max: row.completeness_max,
      reasoning: row.completeness_reasoning,
    },
    clarity: {
      score: row.clarity_score,
      max: row.clarity_max,
      reasoning: row.clarity_reasoning,
    },
    estimability: {
      score: row.estimability_score,
      max: row.estimability_max,
      reasoning: row.estimability_reasoning,
    },
    traceability: {
      score: row.traceability_score,
      max: row.traceability_max,
      reasoning: row.traceability_reasoning,
    },
    testability: {
      score: row.testability_score,
      max: row.testability_max,
      reasoning: row.testability_reasoning,
    },
    suggestions: (row.suggestions as StoryScore["suggestions"]) || [],
    aiModel: row.ai_model,
    promptVersion: row.prompt_version,
    scoredAt: new Date(row.scored_at),
  }));
}

// Get latest score for a story
export async function getLatestScoreForStory(
  workspaceId: string,
  storyId: string
): Promise<StoryScore | null> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("story_scores")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("story_id", storyId)
    .order("scored_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch score: ${error.message}`);
  }

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    storyId: data.story_id,
    totalScore: data.total_score,
    completeness: {
      score: data.completeness_score,
      max: data.completeness_max,
      reasoning: data.completeness_reasoning,
    },
    clarity: {
      score: data.clarity_score,
      max: data.clarity_max,
      reasoning: data.clarity_reasoning,
    },
    estimability: {
      score: data.estimability_score,
      max: data.estimability_max,
      reasoning: data.estimability_reasoning,
    },
    traceability: {
      score: data.traceability_score,
      max: data.traceability_max,
      reasoning: data.traceability_reasoning,
    },
    testability: {
      score: data.testability_score,
      max: data.testability_max,
      reasoning: data.testability_reasoning,
    },
    suggestions: (data.suggestions as StoryScore["suggestions"]) || [],
    aiModel: data.ai_model,
    promptVersion: data.prompt_version,
    scoredAt: new Date(data.scored_at),
  };
}

// Upsert a score
export async function upsertStoryScore(
  workspaceId: string,
  storyId: string,
  score: {
    totalScore: number;
    completeness: { score: number; max: number; reasoning: string | null };
    clarity: { score: number; max: number; reasoning: string | null };
    estimability: { score: number; max: number; reasoning: string | null };
    traceability: { score: number; max: number; reasoning: string | null };
    testability: { score: number; max: number; reasoning: string | null };
    suggestions: Array<{ type: string; current: string; improved: string }>;
    aiModel: string;
    promptVersion: string;
  }
): Promise<StoryScore> {
  const supabase = createUntypedServerClient();

  const { data, error } = await supabase
    .from("story_scores")
    .insert({
      workspace_id: workspaceId,
      story_id: storyId,
      total_score: score.totalScore,
      completeness_score: score.completeness.score,
      completeness_max: score.completeness.max,
      completeness_reasoning: score.completeness.reasoning,
      clarity_score: score.clarity.score,
      clarity_max: score.clarity.max,
      clarity_reasoning: score.clarity.reasoning,
      estimability_score: score.estimability.score,
      estimability_max: score.estimability.max,
      estimability_reasoning: score.estimability.reasoning,
      traceability_score: score.traceability.score,
      traceability_max: score.traceability.max,
      traceability_reasoning: score.traceability.reasoning,
      testability_score: score.testability.score,
      testability_max: score.testability.max,
      testability_reasoning: score.testability.reasoning,
      suggestions: score.suggestions,
      ai_model: score.aiModel,
      prompt_version: score.promptVersion,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert score: ${error.message}`);
  }

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    storyId: data.story_id,
    totalScore: data.total_score,
    completeness: {
      score: data.completeness_score,
      max: data.completeness_max,
      reasoning: data.completeness_reasoning,
    },
    clarity: {
      score: data.clarity_score,
      max: data.clarity_max,
      reasoning: data.clarity_reasoning,
    },
    estimability: {
      score: data.estimability_score,
      max: data.estimability_max,
      reasoning: data.estimability_reasoning,
    },
    traceability: {
      score: data.traceability_score,
      max: data.traceability_max,
      reasoning: data.traceability_reasoning,
    },
    testability: {
      score: data.testability_score,
      max: data.testability_max,
      reasoning: data.testability_reasoning,
    },
    suggestions: (data.suggestions as StoryScore["suggestions"]) || [],
    aiModel: data.ai_model,
    promptVersion: data.prompt_version,
    scoredAt: new Date(data.scored_at),
  };
}

// Get average score for a sprint
export async function getSprintAverageScore(
  workspaceId: string,
  sprintId: number
): Promise<number | null> {
  const supabase = createUntypedServerClient();

  // First get story IDs in the sprint
  const { data: stories, error: storiesError } = await supabase
    .from("stories")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("sprint_id", sprintId)
    .is("archived_at", null);

  if (storiesError) {
    throw new Error(`Failed to fetch stories: ${storiesError.message}`);
  }

  if (!stories || stories.length === 0) {
    return null;
  }

  const storyIds = stories.map((s) => s.id);

  // Get latest scores for these stories
  const { data: scores, error: scoresError } = await supabase
    .from("story_scores")
    .select("story_id, total_score, scored_at")
    .in("story_id", storyIds)
    .order("scored_at", { ascending: false });

  if (scoresError) {
    throw new Error(`Failed to fetch scores: ${scoresError.message}`);
  }

  if (!scores || scores.length === 0) {
    return null;
  }

  // Get latest score per story
  const latestScores = new Map<string, number>();
  for (const score of scores) {
    if (!latestScores.has(score.story_id)) {
      latestScores.set(score.story_id, score.total_score);
    }
  }

  // Calculate average
  const scoreValues = Array.from(latestScores.values());
  return scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
}

// Get score distribution for a workspace
export async function getScoreDistribution(
  workspaceId: string,
  sprintId?: number
): Promise<{
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}> {
  const supabase = createUntypedServerClient();

  // Get stories (optionally filtered by sprint)
  let storiesQuery = supabase
    .from("stories")
    .select("id")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null);

  if (sprintId) {
    storiesQuery = storiesQuery.eq("sprint_id", sprintId);
  }

  const { data: stories, error: storiesError } = await storiesQuery;

  if (storiesError) {
    throw new Error(`Failed to fetch stories: ${storiesError.message}`);
  }

  if (!stories || stories.length === 0) {
    return { excellent: 0, good: 0, fair: 0, poor: 0 };
  }

  const storyIds = stories.map((s) => s.id);

  // Get latest scores
  const { data: scores, error: scoresError } = await supabase
    .from("story_scores")
    .select("story_id, total_score, scored_at")
    .in("story_id", storyIds)
    .order("scored_at", { ascending: false });

  if (scoresError) {
    throw new Error(`Failed to fetch scores: ${scoresError.message}`);
  }

  // Get latest score per story
  const latestScores = new Map<string, number>();
  for (const score of scores || []) {
    if (!latestScores.has(score.story_id)) {
      latestScores.set(score.story_id, score.total_score);
    }
  }

  // Categorize scores
  const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
  for (const score of latestScores.values()) {
    if (score >= 85) distribution.excellent++;
    else if (score >= 70) distribution.good++;
    else if (score >= 50) distribution.fair++;
    else distribution.poor++;
  }

  return distribution;
}
