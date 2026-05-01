import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { getJiraClientForWorkspace } from "@/lib/jira/auth";
import * as Sentry from "@sentry/nextjs";

const AddCommentSchema = z.object({
  body: z.string().min(1).max(10000),
  internal: z.boolean().default(false),
});

/**
 * POST /api/jira/stories/[key]/comment
 * Add a comment to a JIRA issue
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
    const validated = AddCommentSchema.safeParse(body);
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

    const comment = await jiraClient.addComment(key, validated.data.body);

    return NextResponse.json({
      success: true,
      commentId: comment.id,
      created: comment.created,
    });
  } catch (error) {
    console.error("[JIRA Comment POST] Error:", error);
    Sentry.captureException(error, { tags: { api: "jira-comment-post" } });
    return NextResponse.json(
      {
        error: "Failed to add comment",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
