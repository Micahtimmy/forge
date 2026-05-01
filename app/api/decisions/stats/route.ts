import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { getDecisionStats } from "@/lib/db/queries/decisions";

/**
 * GET /api/decisions/stats
 * Get decision statistics
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const stats = await getDecisionStats(workspaceId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("[Decision Stats GET] Error:", error);
    Sentry.captureException(error, { tags: { api: "decisions-stats" } });
    return NextResponse.json(
      { error: "Failed to get decision stats" },
      { status: 500 }
    );
  }
}
