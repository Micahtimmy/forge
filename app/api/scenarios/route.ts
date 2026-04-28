import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { createScenario, listScenarios } from "@/lib/db/queries/scenarios";

const ModificationSchema = z.object({
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
});

const BaseStateSchema = z.object({
  pi_id: z.string().uuid().optional(),
  sprint_id: z.string().optional(),
  snapshot_date: z.string(),
  team_capacity: z.record(z.string(), z.number()),
  story_count: z.number(),
  total_points: z.number(),
  current_velocity: z.number(),
});

const CreateScenarioSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  scenario_type: z.enum(["capacity", "scope", "timeline", "dependency", "custom"]),
  base_state: BaseStateSchema,
  modifications: z.array(ModificationSchema),
});

const ListScenariosSchema = z.object({
  type: z
    .enum(["capacity", "scope", "timeline", "dependency", "custom"])
    .optional(),
  status: z.enum(["draft", "simulated", "applied", "archived"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /api/scenarios
 * List scenarios
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validated = ListScenariosSchema.safeParse(params);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { scenarios, total } = await listScenarios(
      workspaceId,
      validated.data
    );

    return NextResponse.json({
      scenarios,
      total,
      hasMore: validated.data.offset + scenarios.length < total,
    });
  } catch (error) {
    console.error("[Scenarios GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to list scenarios" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scenarios
 * Create a scenario
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
    const validated = CreateScenarioSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const scenario = await createScenario(
      workspaceId,
      userId,
      validated.data
    );

    return NextResponse.json({ scenario }, { status: 201 });
  } catch (error) {
    console.error("[Scenarios POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create scenario" },
      { status: 500 }
    );
  }
}
