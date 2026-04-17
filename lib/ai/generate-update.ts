/**
 * Stakeholder Update Generation AI Function
 * Uses Gemini to generate audience-aware updates with streaming
 */

import { getModel, GENERATION_CONFIGS } from "./client";
import {
  GENERATE_UPDATE_SYSTEM,
  buildUpdatePrompt,
  type UpdateContext,
} from "./prompts/generate-update";

export type AudienceType = "executive" | "team" | "client" | "board";
export type ToneLevel = 1 | 2 | 3 | 4 | 5;

export interface GenerateUpdateInput {
  context: UpdateContext;
  audience: AudienceType;
  tone: ToneLevel;
}

export interface GenerateUpdateResult {
  audience: AudienceType;
  content: string;
  generatedAt: string;
}

/**
 * Generate a single update (non-streaming)
 */
export async function generateUpdate(
  input: GenerateUpdateInput
): Promise<GenerateUpdateResult> {
  const model = getModel();
  const prompt = buildUpdatePrompt(input.context, input.audience, input.tone);

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: GENERATE_UPDATE_SYSTEM }, { text: prompt }],
      },
    ],
    generationConfig: GENERATION_CONFIGS.drafting,
  });

  const response = result.response;
  const text = response.text();

  return {
    audience: input.audience,
    content: text,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate update with streaming
 */
export async function* generateUpdateStream(
  input: GenerateUpdateInput
): AsyncGenerator<{ audience: AudienceType; chunk: string }, void, unknown> {
  const model = getModel();
  const prompt = buildUpdatePrompt(input.context, input.audience, input.tone);

  const result = await model.generateContentStream({
    contents: [
      {
        role: "user",
        parts: [{ text: GENERATE_UPDATE_SYSTEM }, { text: prompt }],
      },
    ],
    generationConfig: GENERATION_CONFIGS.drafting,
  });

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield { audience: input.audience, chunk: text };
    }
  }
}

/**
 * Generate updates for multiple audiences in sequence
 */
export async function generateMultipleUpdates(
  context: UpdateContext,
  audiences: AudienceType[],
  tone: ToneLevel,
  onProgress?: (audience: AudienceType, progress: "start" | "complete") => void
): Promise<Record<AudienceType, GenerateUpdateResult>> {
  const results: Partial<Record<AudienceType, GenerateUpdateResult>> = {};

  for (const audience of audiences) {
    onProgress?.(audience, "start");

    const result = await generateUpdate({
      context,
      audience,
      tone,
    });

    results[audience] = result;
    onProgress?.(audience, "complete");

    // Small delay between requests for rate limiting
    if (audiences.indexOf(audience) < audiences.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return results as Record<AudienceType, GenerateUpdateResult>;
}
