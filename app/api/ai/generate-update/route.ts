import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getModel, GENERATION_CONFIGS } from "@/lib/ai/client";
import {
  GENERATE_UPDATE_SYSTEM,
  buildUpdatePrompt,
} from "@/lib/ai/prompts/generate-update";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";

// Request validation schema with size limits
const generateUpdateSchema = z.object({
  context: z.object({
    sprintName: z.string().max(200),
    sprintGoal: z.string().max(1000).optional(),
    completedStories: z
      .array(
        z.object({
          key: z.string().max(50),
          title: z.string().max(500),
          points: z.number().min(0).max(100).optional(),
        })
      )
      .max(100)
      .optional(),
    inProgressStories: z
      .array(
        z.object({
          key: z.string().max(50),
          title: z.string().max(500),
          progress: z.number().min(0).max(100).optional(),
        })
      )
      .max(100)
      .optional(),
    blockers: z
      .array(
        z.object({
          description: z.string().max(1000),
          impact: z.string().max(500),
          resolution: z.string().max(1000).optional(),
        })
      )
      .max(20)
      .optional(),
    velocityTarget: z.number().min(0).max(1000).optional(),
    velocityActual: z.number().min(0).max(1000).optional(),
    highlights: z.array(z.string().max(500)).max(20).optional(),
    risks: z.array(z.string().max(500)).max(20).optional(),
    decisions: z.array(z.string().max(500)).max(20).optional(),
    additionalContext: z.string().max(5000).optional(),
  }),
  audience: z.enum(["executive", "team", "client", "board"]),
  tone: z.number().min(1).max(5),
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
      RATE_LIMITS.aiGeneration
    );
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const body = await req.json();
    const validated = generateUpdateSchema.parse(body);

    const model = getModel();
    const prompt = buildUpdatePrompt(
      validated.context,
      validated.audience,
      validated.tone as 1 | 2 | 3 | 4 | 5
    );

    // Stream the response
    const result = await model.generateContentStream({
      contents: [
        {
          role: "user",
          parts: [{ text: GENERATE_UPDATE_SYSTEM }, { text: prompt }],
        },
      ],
      generationConfig: GENERATION_CONFIGS.drafting,
    });

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              const data = JSON.stringify({
                audience: validated.audience,
                chunk: text,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          // Send done signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
          controller.close();
        } catch (error) {
          const errorData = JSON.stringify({
            error: error instanceof Error ? error.message : "Stream error",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Generate update API error:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: "Invalid request body",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Don't expose internal error details in production
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate update",
      },
      { status: 500 }
    );
  }
}
