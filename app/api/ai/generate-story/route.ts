import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { generateStory } from "@/lib/ai/generate-story";
import { authenticateRequest } from "@/lib/api/auth";

const requestSchema = z.object({
  briefDescription: z.string().min(10).max(500),
  projectContext: z.string().optional(),
  epicName: z.string().optional(),
  targetAudience: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }

    const body = await request.json();
    const validated = requestSchema.parse(body);

    const result = await generateStory(validated);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Generate story API error:", error);
    Sentry.captureException(error, {
      tags: { api: "generate-story" },
    });
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
