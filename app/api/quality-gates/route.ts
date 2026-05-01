import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import {
  createQualityGate,
  listQualityGates,
} from "@/lib/db/queries/quality-gates";

const CreateGateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  trigger_transition: z.string().min(1),
  min_score: z.number().min(0).max(100),
  action: z.enum(["block", "warn", "comment"]),
  required_dimensions: z.array(z.string()).optional(),
  notification_channels: z.array(z.string()).optional(),
});

const ListGatesSchema = z.object({
  activeOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  trigger: z.string().optional(),
});

/**
 * GET /api/quality-gates
 * List quality gates
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validated = ListGatesSchema.safeParse(params);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validated.error.issues },
        { status: 400 }
      );
    }

    const gates = await listQualityGates(workspaceId, {
      trigger: validated.data.trigger,
      is_active: validated.data.activeOnly,
    });

    return NextResponse.json({ gates });
  } catch (error) {
    console.error("[Quality Gates GET] Error:", error);
    Sentry.captureException(error, { tags: { api: "quality-gates" } });
    return NextResponse.json(
      { error: "Failed to list quality gates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quality-gates
 * Create a quality gate
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
    const validated = CreateGateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const gate = await createQualityGate(workspaceId, userId, {
      name: validated.data.name,
      description: validated.data.description,
      trigger_transition: validated.data.trigger_transition,
      min_score: validated.data.min_score,
      action: validated.data.action,
      required_dimensions: validated.data.required_dimensions,
      notification_channels: validated.data.notification_channels,
    });

    return NextResponse.json({ gate }, { status: 201 });
  } catch (error) {
    console.error("[Quality Gates POST] Error:", error);
    Sentry.captureException(error, { tags: { api: "quality-gates" } });
    return NextResponse.json(
      { error: "Failed to create quality gate" },
      { status: 500 }
    );
  }
}
