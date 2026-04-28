import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { cloneScenario } from "@/lib/db/queries/scenarios";

const CloneSchema = z.object({
  name: z.string().min(3).max(100),
});

/**
 * POST /api/scenarios/[id]/clone
 * Clone a scenario
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

    const body = await request.json();
    const validated = CloneSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const scenario = await cloneScenario(
      workspaceId,
      id,
      userId,
      validated.data.name
    );

    return NextResponse.json({ scenario }, { status: 201 });
  } catch (error) {
    console.error("[Scenario Clone POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to clone scenario" },
      { status: 500 }
    );
  }
}
