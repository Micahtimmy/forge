import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import {
  calculateProgramHealth,
  getLatestHealthScore,
  getHealthScoreHistory,
} from "@/lib/db/queries/health";

const HealthQuerySchema = z.object({
  piId: z.string().uuid().optional(),
  days: z.coerce.number().min(1).max(365).default(30),
  limit: z.coerce.number().min(1).max(100).default(30),
});

/**
 * GET /api/program-health
 * Get program health score and history
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validated = HealthQuerySchema.safeParse(params);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { piId, days, limit } = validated.data;

    const [current, history] = await Promise.all([
      getLatestHealthScore(workspaceId, piId),
      getHealthScoreHistory(workspaceId, { piId, days, limit }),
    ]);

    return NextResponse.json({
      current,
      history,
      hasData: current !== null,
    });
  } catch (error) {
    console.error("[Program Health GET] Error:", error);
    Sentry.captureException(error, { tags: { api: "program-health" } });
    return NextResponse.json(
      { error: "Failed to get health score" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/program-health
 * Calculate and save new program health score
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

    const body = await request.json().catch(() => ({}));
    const piId = body.piId;

    const healthScore = await calculateProgramHealth(workspaceId, piId);

    return NextResponse.json({ healthScore }, { status: 201 });
  } catch (error) {
    console.error("[Program Health POST] Error:", error);
    Sentry.captureException(error, { tags: { api: "program-health" } });
    return NextResponse.json(
      { error: "Failed to calculate health score" },
      { status: 500 }
    );
  }
}
