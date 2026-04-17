import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scoreStory, scoreMultipleStories } from "@/lib/ai/score-story";

// Request validation schema
const scoreStorySchema = z.object({
  storyId: z.string(),
  story: z.object({
    key: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    acceptanceCriteria: z.string().nullable(),
    storyPoints: z.number().nullable(),
    epicKey: z.string().nullable(),
    labels: z.array(z.string()).nullable(),
  }),
  rubricId: z.string().optional(),
});

const scoreMultipleSchema = z.object({
  stories: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      acceptanceCriteria: z.string().nullable(),
      storyPoints: z.number().nullable(),
      epicKey: z.string().nullable(),
      labels: z.array(z.string()).nullable(),
    })
  ),
  rubricId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
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

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to score story",
      },
      { status: 500 }
    );
  }
}
