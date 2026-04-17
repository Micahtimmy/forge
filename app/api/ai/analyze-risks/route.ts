import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  analyzeRisks,
  streamRiskAnalysis,
  type RiskAnalysisContext,
} from "@/lib/ai/analyze-risks";

// Request validation schema
const riskAnalysisSchema = z.object({
  piName: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  teams: z.array(
    z.object({
      name: z.string(),
      capacity: z.number().int().min(0),
      committedPoints: z.number().int().min(0),
      objectives: z.array(
        z.object({
          title: z.string(),
          businessValue: z.number().int().min(1).max(10),
          commitment: z.enum(["committed", "uncommitted"]),
        })
      ),
    })
  ),
  dependencies: z.array(
    z.object({
      id: z.string(),
      fromTeam: z.string(),
      toTeam: z.string(),
      fromStory: z.string(),
      toStory: z.string(),
      status: z.string(),
      description: z.string().optional(),
    })
  ),
  previousPIMetrics: z
    .object({
      velocityAccuracy: z.number().min(0).max(100),
      objectivesAchieved: z.number().int().min(0),
      totalObjectives: z.number().int().min(1),
    })
    .optional(),
  stream: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
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

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to analyze risks",
      },
      { status: 500 }
    );
  }
}
