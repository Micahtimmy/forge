import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { runScenario } from "@/lib/db/queries/scenarios";

/**
 * POST /api/scenarios/[id]/run
 * Run a scenario simulation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;
    const userId = auth.context.user.id;

    const rateLimitResult = checkRateLimit(request, userId, RATE_LIMITS.standard);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const scenario = await runScenario(workspaceId, id);

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error("[Scenario Run POST] Error:", error);
    Sentry.captureException(error, { tags: { api: "scenarios-run" } });
    return NextResponse.json(
      {
        error: "Failed to run scenario",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
