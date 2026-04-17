import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  generatePIObjectives,
  streamPIObjectives,
  type PIContext,
} from "@/lib/ai/generate-pi-objectives";

// Request validation schema
const piObjectivesSchema = z.object({
  piName: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  iterations: z.number().int().min(1).max(12),
  teams: z.array(
    z.object({
      name: z.string(),
      capacity: z.number().int().min(0),
      features: z.array(
        z.object({
          key: z.string(),
          title: z.string(),
          description: z.string().nullable(),
          storyPoints: z.number().int().min(0),
        })
      ),
    })
  ),
  stream: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
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

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate PI objectives",
      },
      { status: 500 }
    );
  }
}
