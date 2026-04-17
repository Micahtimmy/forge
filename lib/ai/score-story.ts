/**
 * Story Scoring AI Function
 * Uses Gemini to analyze JIRA stories against quality rubrics
 */

import { getModel, GENERATION_CONFIGS } from "./client";
import {
  SCORE_STORY_SYSTEM,
  buildScoreStoryPrompt,
  parseScoreResponse,
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
}

export async function scoreStory(story: StoryInput): Promise<ScoreResult> {
  const model = getModel();

  const prompt = buildScoreStoryPrompt(story);

  try {
    const result = await model.generateContent({
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

    // Parse the XML response
    const parsed = parseScoreResponse(text);

    return {
      storyKey: story.key,
      ...parsed,
      scoredAt: new Date().toISOString(),
    };
  } catch (error) {
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
