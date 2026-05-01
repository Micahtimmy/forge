import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import {
  analyzeRisks,
  streamRiskAnalysis,
  type RiskAnalysisContext,
} from "@/lib/ai/analyze-risks";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";

// Request validation schema with size limits
const riskAnalysisSchema = z.object({
  piName: z.string().max(200),
  startDate: z.string().max(50),
  endDate: z.string().max(50),
  teams: z
    .array(
      z.object({
        name: z.string().max(200),
        capacity: z.number().int().min(0).max(10000),
        committedPoints: z.number().int().min(0).max(10000),
        objectives: z
          .array(
            z.object({
              title: z.string().max(500),
              businessValue: z.number().int().min(1).max(10),
              commitment: z.enum(["committed", "uncommitted"]),
            })
          )
          .max(50),
      })
    )
    .max(50),
  dependencies: z
    .array(
      z.object({
        id: z.string().max(100),
        fromTeam: z.string().max(200),
        toTeam: z.string().max(200),
        fromStory: z.string().max(100),
        toStory: z.string().max(100),
        status: z.string().max(50),
        description: z.string().max(1000).optional(),
      })
    )
    .max(200),
  previousPIMetrics: z
    .object({
      velocityAccuracy: z.number().min(0).max(100),
      objectivesAchieved: z.number().int().min(0).max(1000),
      totalObjectives: z.number().int().min(1).max(1000),
    })
    .optional(),
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
    const validated = riskAnalysisSchema.parse(body);

    const context: RiskAnalysisContext = {
      piName: validated.piName,
      startDate: validated.startDate,
      endDate: validated.endDate,
      teams: validated.teams,
      dependencies: validated.dependencies,
      previousPIMetrics: validated.previousPIMetrics,
    };

    // Streaming response
    if (validated.stream) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const generator = streamRiskAnalysis(context);
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
                  summary: result.value.summary,
                  risks: result.value.risks,
                  recommendations: result.value.recommendations,
                })}\n\n`
              )
            );
            controller.close();
          } catch (error) {
            console.error("Streaming error:", error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error: error instanceof Error ? error.message : "Analysis failed",
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
    const result = await analyzeRisks(context);

    return NextResponse.json({
      success: true,
      summary: result.summary,
      risks: result.risks,
      recommendations: result.recommendations,
    });
  } catch (error) {
    console.error("Risk Analysis API error:", error);

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
      tags: { api: "analyze-risks" },
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze risks",
      },
      { status: 500 }
    );
  }
}
