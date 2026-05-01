import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { getDecisionById } from "@/lib/db/queries/decisions";
import { createAdminClient } from "@/lib/db/client";

/**
 * GET /api/decisions/[id]
 * Get a decision by ID
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

    const decision = await getDecisionById(workspaceId, id);

    if (!decision) {
      return NextResponse.json(
        { error: "Decision not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ decision });
  } catch (error) {
    console.error("[Decision GET] Error:", error);
    Sentry.captureException(error, { tags: { api: "decisions-id-get" } });
    return NextResponse.json(
      { error: "Failed to get decision" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/decisions/[id]
 * Delete a decision
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

    const supabase = createAdminClient();

    const { error } = await supabase
      .from("decisions")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Decision DELETE] Error:", error);
    Sentry.captureException(error, { tags: { api: "decisions-id-delete" } });
    return NextResponse.json(
      { error: "Failed to delete decision" },
      { status: 500 }
    );
  }
}
