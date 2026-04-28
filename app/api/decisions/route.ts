import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import {
  createDecision,
  listDecisions,
  linkDecisionToStories,
} from "@/lib/db/queries/decisions";
import { inngest } from "@/lib/inngest/client";

const CreateDecisionSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  decision_type: z.enum([
    "scope_change",
    "priority_shift",
    "resource_allocation",
    "technical_decision",
    "process_change",
    "risk_acceptance",
    "other",
  ]),
  context: z
    .object({
      sprint_id: z.number().optional(),
      pi_id: z.string().uuid().optional(),
      linked_stories: z.array(z.string()).optional(),
      linked_risks: z.array(z.string()).optional(),
      linked_dependencies: z.array(z.string()).optional(),
    })
    .default({}),
  decision: z.object({
    choice: z.string().min(10),
    alternatives_considered: z.array(z.string()).optional(),
    rationale: z.string().min(20),
    expected_impact: z.string(),
    risks_acknowledged: z.array(z.string()).optional(),
  }),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(["private", "team", "workspace"]).default("team"),
  generate_ai_summary: z.boolean().default(true),
});

const ListDecisionsSchema = z.object({
  decision_type: z.string().optional(),
  outcome_status: z.string().optional(),
  sprint_id: z.coerce.number().optional(),
  pi_id: z.string().uuid().optional(),
  tags: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * POST /api/decisions
 * Create a new decision
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
    const validated = CreateDecisionSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const decision = await createDecision(
      workspaceId,
      userId,
      validated.data
    );

    // Link to stories if provided
    if (validated.data.context.linked_stories?.length) {
      await linkDecisionToStories(
        workspaceId,
        decision.id,
        validated.data.context.linked_stories
      );
    }

    // Trigger AI summary generation
    if (validated.data.generate_ai_summary) {
      try {
        await inngest.send({
          name: "decision/summarize.requested",
          data: { decisionId: decision.id },
        });
      } catch (e) {
        console.warn("[Decisions] Failed to trigger AI summary:", e);
      }
    }

    return NextResponse.json({ decision }, { status: 201 });
  } catch (error) {
    console.error("[Decisions POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create decision" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/decisions
 * List decisions with filters
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validated = ListDecisionsSchema.safeParse(params);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validated.error.issues },
        { status: 400 }
      );
    }

    const filters = {
      decision_type: validated.data.decision_type as "scope_change" | "priority_shift" | "resource_allocation" | "technical_decision" | "process_change" | "risk_acceptance" | "other" | undefined,
      outcome_status: validated.data.outcome_status as "pending" | "successful" | "partial" | "failed" | "unknown" | undefined,
      tags: validated.data.tags?.split(",").filter(Boolean),
      search: validated.data.search,
      limit: validated.data.limit,
      offset: validated.data.offset,
    };

    const { decisions, total } = await listDecisions(workspaceId, filters);

    return NextResponse.json({
      decisions,
      total,
      hasMore: validated.data.offset + decisions.length < total,
    });
  } catch (error) {
    console.error("[Decisions GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to list decisions" },
      { status: 500 }
    );
  }
}
