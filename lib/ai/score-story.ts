/**
 * Story Scoring AI Function
 * Uses Gemini to analyze JIRA stories against quality rubrics
 */

import * as Sentry from "@sentry/nextjs";
import { getModel, GENERATION_CONFIGS, generateContentWithTimeout, AITimeoutError } from "./client";
import {
  SCORE_STORY_SYSTEM,
  buildScoreStoryPrompt,
  parseScoreResponseSafe,
} from "./prompts/score-story";

export interface StoryInput {
  key: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  storyPoints: number | null;
  epicKey: string | null;
  labels: string[] | null;
}

export interface ScoreResult {
  storyKey: string;
  totalScore: number;
  dimensions: {
    completeness: { score: number; max: number; reasoning: string };
    clarity: { score: number; max: number; reasoning: string };
    estimability: { score: number; max: number; reasoning: string };
    traceability: { score: number; max: number; reasoning: string };
    testability: { score: number; max: number; reasoning: string };
  };
  suggestions: Array<{
    type: string;
    current: string;
    improved: string;
    reasoning?: string;
  }>;
  scoredAt: string;
  parseError?: string;
}

export class AIParseError extends Error {
  constructor(
    message: string,
    public readonly storyKey: string,
    public readonly rawResponse?: string
  ) {
    super(message);
    this.name = "AIParseError";
  }
}

export async function scoreStory(story: StoryInput): Promise<ScoreResult> {
  const model = getModel();

  const prompt = buildScoreStoryPrompt(story);

  try {
    const result = await generateContentWithTimeout(model, {
      contents: [
        {
          role: "user",
          parts: [
            { text: SCORE_STORY_SYSTEM },
            { text: prompt },
          ],
        },
      ],
      generationConfig: GENERATION_CONFIGS.scoring,
    });

    const response = result.response;
    const text = response.text();

    // Parse the XML response with explicit error handling
    const parsed = parseScoreResponseSafe(text);

    if (!parsed.success) {
      // Log the raw response for debugging (truncated)
      console.error("[AI Score] Parse failed for story", story.key, parsed.error);
      console.error("[AI Score] Raw response preview:", text.substring(0, 500));

      throw new AIParseError(
        parsed.error,
        story.key,
        text.substring(0, 1000) // Store truncated raw response
      );
    }

    return {
      storyKey: story.key,
      ...parsed.data,
      scoredAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof AIParseError) {
      throw error;
    }

    // Capture unexpected AI errors to Sentry
    Sentry.captureException(error, {
      tags: { module: "quality-gate", operation: "ai-scoring" },
      extra: { storyKey: story.key },
    });

    console.error("Error scoring story:", error);
    throw new Error(`Failed to score story ${story.key}: ${error}`);
  }
}

export async function scoreMultipleStories(
  stories: StoryInput[],
  onProgress?: (completed: number, total: number) => void
): Promise<ScoreResult[]> {
  const results: ScoreResult[] = [];

  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    try {
      const result = await scoreStory(story);
      results.push(result);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: "quality-gate", operation: "batch-scoring" },
        extra: { storyKey: story.key, batchIndex: i, batchSize: stories.length },
      });
      console.error(`Failed to score story ${story.key}:`, error);
      // Continue with other stories even if one fails
    }

    if (onProgress) {
      onProgress(i + 1, stories.length);
    }

    // Rate limiting: add small delay between requests
    if (i < stories.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}
