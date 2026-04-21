/**
 * Story Writer AI Function
 * Generates well-formed user stories from brief descriptions
 */

import { getModel, GENERATION_CONFIGS } from "./client";
import {
  GENERATE_STORY_SYSTEM,
  buildGenerateStoryPrompt,
  parseGeneratedStory,
  type StoryWriterInput,
  type GeneratedStory,
} from "./prompts/generate-story";

export type { StoryWriterInput, GeneratedStory };

export interface GenerateStoryResult extends GeneratedStory {
  generatedAt: string;
}

export async function generateStory(
  input: StoryWriterInput
): Promise<GenerateStoryResult> {
  const model = getModel();
  const prompt = buildGenerateStoryPrompt(input);

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: GENERATE_STORY_SYSTEM }, { text: prompt }],
        },
      ],
      generationConfig: GENERATION_CONFIGS.scoring,
    });

    const response = result.response;
    const text = response.text();
    const parsed = parseGeneratedStory(text);

    return {
      ...parsed,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error(`Failed to generate story: ${error}`);
  }
}

export async function* generateStoryStream(
  input: StoryWriterInput
): AsyncGenerator<string, GeneratedStory, unknown> {
  const model = getModel();
  const prompt = buildGenerateStoryPrompt(input);

  let fullText = "";

  const result = await model.generateContentStream({
    contents: [
      {
        role: "user",
        parts: [{ text: GENERATE_STORY_SYSTEM }, { text: prompt }],
      },
    ],
    generationConfig: GENERATION_CONFIGS.scoring,
  });

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullText += text;
      yield text;
    }
  }

  return parseGeneratedStory(fullText);
}
