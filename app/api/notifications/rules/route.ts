import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import {
  createNotificationRule,
  listNotificationRules,
} from "@/lib/db/queries/notifications";

const CreateRuleSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  event_types: z.array(z.string()).min(1),
  conditions: z.record(z.string(), z.unknown()).optional(),
  channels: z.array(z.enum(["email", "slack", "in_app"])).min(1),
  recipients: z.object({
    type: z.enum(["user", "role", "team", "all"]),
    ids: z.array(z.string()).optional(),
  }),
});

/**
 * GET /api/notifications/rules
 * List notification rules for the workspace
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const rules = await listNotificationRules(workspaceId);

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("[Notification Rules GET] Error:", error);
    Sentry.captureException(error, { tags: { api: "notifications-rules" } });
    return NextResponse.json(
      { error: "Failed to list rules" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/rules
 * Create a notification rule
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
    const validated = CreateRuleSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const rule = await createNotificationRule(
      workspaceId,
      userId,
      validated.data
    );

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("[Notification Rules POST] Error:", error);
    Sentry.captureException(error, { tags: { api: "notifications-rules" } });
    return NextResponse.json(
      { error: "Failed to create rule" },
      { status: 500 }
    );
  }
}
