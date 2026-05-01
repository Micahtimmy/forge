import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import {
  listQualityViolations,
  getViolationStats,
} from "@/lib/db/queries/quality-gates";

const ListViolationsSchema = z.object({
  status: z.enum(["open", "resolved", "waived", "expired"]).optional(),
  gateId: z.string().uuid().optional(),
  storyId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /api/quality-gates/violations
 * List quality violations
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validated = ListViolationsSchema.safeParse(params);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validated.error.issues },
        { status: 400 }
      );
    }

    const includeStats = searchParams.get("stats") === "true";

    const { violations, total } = await listQualityViolations(
      workspaceId,
      validated.data
    );

    let stats = null;
    if (includeStats) {
      stats = await getViolationStats(workspaceId);
    }

    return NextResponse.json({
      violations,
      total,
      hasMore: validated.data.offset + violations.length < total,
      ...(stats && { stats }),
    });
  } catch (error) {
    console.error("[Quality Violations GET] Error:", error);
    Sentry.captureException(error, { tags: { api: "quality-gates-violations" } });
    return NextResponse.json(
      { error: "Failed to list violations" },
      { status: 500 }
    );
  }
}
