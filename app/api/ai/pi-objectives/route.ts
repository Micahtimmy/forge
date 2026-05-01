import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import {
  generatePIObjectives,
  streamPIObjectives,
  type PIContext,
} from "@/lib/ai/generate-pi-objectives";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";

// Request validation schema with size limits
const piObjectivesSchema = z.object({
  piName: z.string().max(200),
  startDate: z.string().max(50),
  endDate: z.string().max(50),
  iterations: z.number().int().min(1).max(12),
  teams: z
    .array(
      z.object({
        name: z.string().max(200),
        capacity: z.number().int().min(0).max(10000),
        features: z
          .array(
            z.object({
              key: z.string().max(50),
              title: z.string().max(500),
              description: z.string().max(5000).nullable(),
              storyPoints: z.number().int().min(0).max(1000),
            })
          )
          .max(100),
      })
    )
    .max(50),
  stream: z.boolean().optional().default(false),
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
    const validated = piObjectivesSchema.parse(body);

    const context: PIContext = {
      piName: validated.piName,
      startDate: validated.startDate,
      endDate: validated.endDate,
      iterations: validated.iterations,
      teams: validated.teams,
    };

    // Streaming response
    if (validated.stream) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const generator = streamPIObjectives(context);
            let result;

            while (!(result = await generator.next()).done) {
              const text = result.value;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }

            // Send the final parsed result
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  done: true,
                  teams: result.value.teams,
                })}\n\n`
              )
            );
            controller.close();
          } catch (error) {
            console.error("Streaming error:", error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error: error instanceof Error ? error.message : "Generation failed",
                })}\n\n`
              )
            );
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
    }

    // Non-streaming response
    const result = await generatePIObjectives(context);

    return NextResponse.json({
      success: true,
      teams: result.teams,
    });
  } catch (error) {
    console.error("PI Objectives API error:", error);

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

    Sentry.captureException(error, {
      tags: { api: "pi-objectives" },
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate PI objectives",
      },
      { status: 500 }
    );
  }
}
