import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import {
  generateSprintPrediction,
  getSprintPrediction,
} from "@/lib/db/queries/health";

const PredictionQuerySchema = z.object({
  sprintId: z.string(),
});

/**
 * GET /api/program-health/predictions
 * Get sprint prediction
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validated = PredictionQuerySchema.safeParse(params);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validated.error.issues },
        { status: 400 }
      );
    }

    const prediction = await getSprintPrediction(
      workspaceId,
      validated.data.sprintId
    );

    return NextResponse.json({ prediction });
  } catch (error) {
    console.error("[Predictions GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to get prediction" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/program-health/predictions
 * Generate new sprint prediction
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;
    const userId = auth.context.user.id;

    const rateLimitResult = checkRateLimit(request, userId, RATE_LIMITS.standard);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const body = await request.json();
    const validated = PredictionQuerySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const prediction = await generateSprintPrediction(
      workspaceId,
      validated.data.sprintId
    );

    return NextResponse.json({ prediction }, { status: 201 });
  } catch (error) {
    console.error("[Predictions POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate prediction" },
      { status: 500 }
    );
  }
}
