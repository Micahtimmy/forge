import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { updateViolationStatus } from "@/lib/db/queries/quality-gates";

const UpdateViolationSchema = z.object({
  status: z.enum(["resolved", "waived"]),
  waiver_reason: z.string().min(10).optional(),
});

/**
 * PATCH /api/quality-gates/violations/[id]
 * Update violation status
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
    const validated = UpdateViolationSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    // Require waiver reason for waivers
    if (validated.data.status === "waived" && !validated.data.waiver_reason) {
      return NextResponse.json(
        { error: "Waiver reason is required when waiving a violation" },
        { status: 400 }
      );
    }

    const violation = await updateViolationStatus(
      workspaceId,
      id,
      userId,
      validated.data
    );

    return NextResponse.json({ violation });
  } catch (error) {
    console.error("[Quality Violation PATCH] Error:", error);
    Sentry.captureException(error, { tags: { api: "quality-gates-violations-id" } });
    return NextResponse.json(
      { error: "Failed to update violation" },
      { status: 500 }
    );
  }
}
