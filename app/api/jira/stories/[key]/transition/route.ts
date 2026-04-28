import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { getJiraClientForWorkspace } from "@/lib/jira/auth";

const TransitionSchema = z.object({
  transitionId: z.string(),
  transitionName: z.string().optional(),
});

/**
 * GET /api/jira/stories/[key]/transition
 * Get available transitions for an issue
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;
    const userId = auth.context.user.id;

    const rateLimitResult = checkRateLimit(request, userId, RATE_LIMITS.jira);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const jiraClient = await getJiraClientForWorkspace(workspaceId);
    if (!jiraClient) {
      return NextResponse.json(
        { error: "JIRA not connected" },
        { status: 400 }
      );
    }

    const { transitions } = await jiraClient.getTransitions(key);

    return NextResponse.json({
      transitions: transitions.map((t) => ({
        id: t.id,
        name: t.name,
        to: {
          id: t.to.id,
          name: t.to.name,
          category: t.to.statusCategory.name,
        },
      })),
    });
  } catch (error) {
    console.error("[JIRA Transitions GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to get transitions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jira/stories/[key]/transition
 * Transition an issue to a new status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;
    const { workspaceId } = auth.context;
    const userId = auth.context.user.id;

    const rateLimitResult = checkRateLimit(request, userId, RATE_LIMITS.jira);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const body = await request.json();
    const validated = TransitionSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.issues },
        { status: 400 }
      );
    }

    const jiraClient = await getJiraClientForWorkspace(workspaceId);
    if (!jiraClient) {
      return NextResponse.json(
        { error: "JIRA not connected" },
        { status: 400 }
      );
    }

    await jiraClient.transitionIssue(key, validated.data.transitionId);

    return NextResponse.json({
      success: true,
      transitionedTo: validated.data.transitionName,
    });
  } catch (error) {
    console.error("[JIRA Transition POST] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to transition issue",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
