import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { checkQualityGates } from "@/lib/db/queries/quality-gates";

const CheckGateSchema = z.object({
  storyId: z.string().uuid(),
  trigger: z.enum(["on_status_change", "on_sprint_start", "on_sprint_end", "manual"]),
});

/**
 * POST /api/quality-gates/check
 * Check a story against quality gates
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
    const validated = CheckGateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const results = await checkQualityGates(
      workspaceId,
      validated.data.storyId,
      validated.data.trigger
    );

    const allPassed = results.every((r) => r.passed);
    const blockingFailed = results.some((r) => !r.passed && r.gate.action === "block");

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        passed: results.filter((r) => r.passed).length,
        failed: results.filter((r) => !r.passed).length,
        allPassed,
        blockingFailed,
      },
    });
  } catch (error) {
    console.error("[Quality Gates Check POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to check quality gates" },
      { status: 500 }
    );
  }
}
