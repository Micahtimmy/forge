import { NextRequest } from "next/server";
import { z } from "zod";
import { getModel, GENERATION_CONFIGS } from "@/lib/ai/client";
import {
  GENERATE_UPDATE_SYSTEM,
  buildUpdatePrompt,
} from "@/lib/ai/prompts/generate-update";

// Request validation schema
const generateUpdateSchema = z.object({
  context: z.object({
    sprintName: z.string(),
    sprintGoal: z.string().optional(),
    completedStories: z
      .array(
        z.object({
          key: z.string(),
          title: z.string(),
          points: z.number().optional(),
        })
      )
      .optional(),
    inProgressStories: z
      .array(
        z.object({
          key: z.string(),
          title: z.string(),
          progress: z.number().optional(),
        })
      )
      .optional(),
    blockers: z
      .array(
        z.object({
          description: z.string(),
          impact: z.string(),
          resolution: z.string().optional(),
        })
      )
      .optional(),
    velocityTarget: z.number().optional(),
    velocityActual: z.number().optional(),
    highlights: z.array(z.string()).optional(),
    risks: z.array(z.string()).optional(),
    decisions: z.array(z.string()).optional(),
    additionalContext: z.string().optional(),
  }),
  audience: z.enum(["executive", "team", "client", "board"]),
  tone: z.number().min(1).max(5),
});

export async function POST(req: NextRequest) {
  try {
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

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate update",
      },
      { status: 500 }
    );
  }
}
