import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import {
  updateQualityGate,
  deleteQualityGate,
} from "@/lib/db/queries/quality-gates";

const UpdateGateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  trigger: z
    .enum(["on_status_change", "on_sprint_start", "on_sprint_end", "manual"])
    .optional(),
  conditions: z
    .array(
      z.object({
        type: z.enum([
          "min_score",
          "required_fields",
          "max_points",
          "has_acceptance_criteria",
        ]),
        config: z.record(z.string(), z.unknown()),
      })
    )
    .optional(),
  actions: z
    .array(
      z.object({
        type: z.enum([
          "block_transition",
          "add_label",
          "notify",
          "create_violation",
        ]),
        config: z.record(z.string(), z.unknown()),
      })
    )
    .optional(),
  is_blocking: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

/**
 * PATCH /api/quality-gates/[id]
 * Update a quality gate
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
    const validated = UpdateGateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const gate = await updateQualityGate(workspaceId, id, validated.data);

    return NextResponse.json({ gate });
  } catch (error) {
    console.error("[Quality Gate PATCH] Error:", error);
    Sentry.captureException(error, { tags: { api: "quality-gates-id" } });
    return NextResponse.json(
      { error: "Failed to update quality gate" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quality-gates/[id]
 * Delete a quality gate
 */
export async function DELETE(
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

    await deleteQualityGate(workspaceId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Quality Gate DELETE] Error:", error);
    Sentry.captureException(error, { tags: { api: "quality-gates-id" } });
    return NextResponse.json(
      { error: "Failed to delete quality gate" },
      { status: 500 }
    );
  }
}
