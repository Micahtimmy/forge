import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { updateDecisionOutcome } from "@/lib/db/queries/decisions";

const UpdateOutcomeSchema = z.object({
  outcome_status: z.enum(["pending", "successful", "partial", "failed", "unknown"]),
  outcome: z
    .object({
      actual_impact: z.string().min(10),
      lessons_learned: z.string().min(10),
      would_repeat: z.boolean(),
    })
    .optional(),
});

/**
 * PATCH /api/decisions/[id]/outcome
 * Update decision outcome
 */
export async function PATCH(
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

    const body = await request.json();
    const validated = UpdateOutcomeSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const decision = await updateDecisionOutcome(
      workspaceId,
      id,
      userId,
      validated.data
    );

    return NextResponse.json({ decision });
  } catch (error) {
    console.error("[Decision Outcome PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update outcome" },
      { status: 500 }
    );
  }
}
