import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { scoreStory, scoreMultipleStories, AIParseError } from "@/lib/ai/score-story";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";

// Request validation schema
const scoreStorySchema = z.object({
  storyId: z.string().max(100),
  story: z.object({
    key: z.string().max(50),
    title: z.string().max(500),
    description: z.string().max(10000).nullable(),
    acceptanceCriteria: z.string().max(10000).nullable(),
    storyPoints: z.number().min(0).max(100).nullable(),
    epicKey: z.string().max(50).nullable(),
    labels: z.array(z.string().max(100)).max(50).nullable(),
  }),
  rubricId: z.string().max(100).optional(),
});

const scoreMultipleSchema = z.object({
  stories: z
    .array(
      z.object({
        key: z.string().max(50),
        title: z.string().max(500),
        description: z.string().max(10000).nullable(),
        acceptanceCriteria: z.string().max(10000).nullable(),
        storyPoints: z.number().min(0).max(100).nullable(),
        epicKey: z.string().max(50).nullable(),
        labels: z.array(z.string().max(100)).max(50).nullable(),
      })
    )
    .max(50), // Limit batch size
  rubricId: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate request
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    // Rate limiting
    const rateLimit = checkRateLimit(
      req,
      auth.context.user.id,
      RATE_LIMITS.aiScoring
    );
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const body = await req.json();

    // Check if scoring single story or multiple
    if (body.stories) {
      // Multiple stories
      const validated = scoreMultipleSchema.parse(body);
      const results = await scoreMultipleStories(validated.stories);

      return NextResponse.json({
        success: true,
        results,
        totalScored: results.length,
      });
    } else {
      // Single story
      const validated = scoreStorySchema.parse(body);
      const result = await scoreStory(validated.story);

      return NextResponse.json({
        success: true,
        storyId: validated.storyId,
        ...result,
      });
    }
  } catch (error) {
    console.error("Score story API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle AI parse errors with specific error type
    if (error instanceof AIParseError) {
      Sentry.captureException(error, {
        tags: { module: "quality-gate", operation: "score-story", errorType: "parse" },
        extra: { storyKey: error.storyKey },
      });
      return NextResponse.json(
        {
          success: false,
          error: "AI response could not be parsed",
          details: error.message,
          storyKey: error.storyKey,
        },
        { status: 422 } // Unprocessable Entity - AI returned unusable response
      );
    }

    // Capture unexpected errors
    Sentry.captureException(error, {
      tags: { module: "quality-gate", operation: "score-story" },
    });

    // Don't expose internal error details in production
    return NextResponse.json(
      {
        success: false,
        error: "Failed to score story",
      },
      { status: 500 }
    );
  }
}
