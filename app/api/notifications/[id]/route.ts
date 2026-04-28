import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { markNotificationRead } from "@/lib/db/queries/notifications";

/**
 * PATCH /api/notifications/[id]
 * Mark a notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const userId = auth.context.user.id;

    const rateLimitResult = checkRateLimit(request, userId, RATE_LIMITS.standard);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    await markNotificationRead(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Notification PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to mark notification read" },
      { status: 500 }
    );
  }
}
