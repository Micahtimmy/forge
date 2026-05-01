import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { compareScenarios } from "@/lib/db/queries/scenarios";

const CompareSchema = z.object({
  scenarioIds: z.array(z.string().uuid()).min(2).max(5),
});

/**
 * POST /api/scenarios/compare
 * Compare multiple scenarios
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const body = await request.json();
    const validated = CompareSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const result = await compareScenarios(
      workspaceId,
      validated.data.scenarioIds
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Scenarios Compare POST] Error:", error);
    Sentry.captureException(error, { tags: { api: "scenarios-compare" } });
    return NextResponse.json(
      {
        error: "Failed to compare scenarios",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
