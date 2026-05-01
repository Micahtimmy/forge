import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import {
  getUserNotifications,
  markAllNotificationsRead,
} from "@/lib/db/queries/notifications";

const ListNotificationsSchema = z.object({
  unreadOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  channel: z.enum(["email", "slack", "in_app"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /api/notifications
 * List notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;
    const userId = auth.context.user.id;

    const rateLimitResult = checkRateLimit(request, userId, RATE_LIMITS.standard);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validated = ListNotificationsSchema.safeParse(params);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { notifications, unreadCount } = await getUserNotifications(
      userId,
      workspaceId,
      validated.data
    );

    return NextResponse.json({
      notifications,
      unreadCount,
      hasMore: validated.data.offset + notifications.length < unreadCount,
    });
  } catch (error) {
    console.error("[Notifications GET] Error:", error);
    Sentry.captureException(error, { tags: { api: "notifications" } });
    return NextResponse.json(
      { error: "Failed to list notifications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
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

    const count = await markAllNotificationsRead(userId, workspaceId);

    return NextResponse.json({ markedRead: count });
  } catch (error) {
    console.error("[Notifications POST] Error:", error);
    Sentry.captureException(error, { tags: { api: "notifications" } });
    return NextResponse.json(
      { error: "Failed to mark notifications read" },
      { status: 500 }
    );
  }
}
