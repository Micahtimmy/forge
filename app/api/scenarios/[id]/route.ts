import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import {
  getScenarioById,
  updateScenario,
  deleteScenario,
} from "@/lib/db/queries/scenarios";

const UpdateScenarioSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  modifications: z
    .array(
      z.object({
        type: z.enum([
          "add_scope",
          "remove_scope",
          "change_capacity",
          "shift_timeline",
          "add_dependency",
          "remove_dependency",
        ]),
        description: z.string(),
        config: z.record(z.string(), z.unknown()),
      })
    )
    .optional(),
});

/**
 * GET /api/scenarios/[id]
 * Get a scenario by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const scenario = await getScenarioById(workspaceId, id);

    if (!scenario) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error("[Scenario GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to get scenario" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/scenarios/[id]
 * Update a scenario
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
    const validated = UpdateScenarioSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const scenario = await updateScenario(workspaceId, id, validated.data);

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error("[Scenario PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update scenario" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scenarios/[id]
 * Delete a scenario
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

    await deleteScenario(workspaceId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Scenario DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete scenario" },
      { status: 500 }
    );
  }
}
