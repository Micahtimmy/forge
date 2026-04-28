import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import {
  getUserNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/db/queries/notifications";

const UpdatePreferencesSchema = z.object({
  email_enabled: z.boolean().optional(),
  slack_enabled: z.boolean().optional(),
  in_app_enabled: z.boolean().optional(),
  digest_frequency: z
    .enum(["realtime", "hourly", "daily", "weekly"])
    .optional(),
  digest_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  digest_timezone: z.string().optional(),
  quiet_hours_enabled: z.boolean().optional(),
  quiet_hours_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  quiet_hours_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  event_preferences: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/notifications/preferences
 * Get user notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;
    const userId = auth.context.user.id;

    const preferences = await getUserNotificationPreferences(
      userId,
      workspaceId
    );

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("[Notification Preferences GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to get preferences" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update user notification preferences
 */
export async function PATCH(request: NextRequest) {
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
    const validated = UpdatePreferencesSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const preferences = await updateNotificationPreferences(
      userId,
      workspaceId,
      validated.data
    );

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("[Notification Preferences PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
