import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { getJiraClientForWorkspace } from "@/lib/jira/auth";
import { JiraClient } from "@/lib/jira/client";
import * as Sentry from "@sentry/nextjs";

// Schema for PATCH request
const UpdateStorySchema = z.object({
  summary: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  storyPoints: z.number().min(0).max(100).optional(),
  labels: z
    .object({
      add: z.array(z.string()).optional(),
      remove: z.array(z.string()).optional(),
    })
    .optional(),
  assigneeAccountId: z.string().nullable().optional(),
});

/**
 * GET /api/jira/stories/[key]
 * Fetch a JIRA issue by key
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

    const issue = await jiraClient.getIssue(key);

    return NextResponse.json({
      issue: {
        key: issue.key,
        id: issue.id,
        summary: issue.fields.summary,
        description: JiraClient.adfToText(issue.fields.description),
        status: issue.fields.status.name,
        statusCategory: issue.fields.status.statusCategory.name,
        issueType: issue.fields.issuetype.name,
        priority: issue.fields.priority?.name,
        labels: issue.fields.labels,
        storyPoints: issue.fields.customfield_10016,
        assignee: issue.fields.assignee
          ? {
              accountId: issue.fields.assignee.accountId,
              displayName: issue.fields.assignee.displayName,
              avatarUrl: issue.fields.assignee.avatarUrls["48x48"],
            }
          : null,
        reporter: issue.fields.reporter
          ? {
              accountId: issue.fields.reporter.accountId,
              displayName: issue.fields.reporter.displayName,
            }
          : null,
        created: issue.fields.created,
        updated: issue.fields.updated,
      },
    });
  } catch (error) {
    console.error("[JIRA Story GET] Error:", error);
    Sentry.captureException(error, { tags: { api: "jira-story-get" } });
    return NextResponse.json(
      { error: "Failed to fetch JIRA issue" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jira/stories/[key]
 * Update a JIRA issue
 */
export async function PATCH(
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
    const validated = UpdateStorySchema.safeParse(body);
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

    const { summary, description, storyPoints, labels, assigneeAccountId } =
      validated.data;

    // Build update payload
    const updatePayload: Parameters<typeof jiraClient.updateIssue>[1] = {
      fields: {},
      update: {},
    };

    if (summary !== undefined) {
      updatePayload.fields!.summary = summary;
    }

    if (description !== undefined) {
      updatePayload.fields!.description = description;
    }

    if (storyPoints !== undefined) {
      updatePayload.fields!.customfield_10016 = storyPoints;
    }

    if (labels) {
      if (labels.add?.length) {
        updatePayload.update!.labels = labels.add.map((l) => ({ add: l }));
      }
      if (labels.remove?.length) {
        updatePayload.update!.labels = [
          ...(updatePayload.update!.labels || []),
          ...labels.remove.map((l) => ({ remove: l })),
        ];
      }
    }

    if (assigneeAccountId !== undefined) {
      await jiraClient.assignIssue(key, assigneeAccountId);
    }

    // Update the issue
    if (Object.keys(updatePayload.fields!).length > 0 ||
        Object.keys(updatePayload.update!).length > 0) {
      await jiraClient.updateIssue(key, updatePayload);
    }

    return NextResponse.json({ success: true, key });
  } catch (error) {
    console.error("[JIRA Story PATCH] Error:", error);
    Sentry.captureException(error, { tags: { api: "jira-story-patch" } });
    return NextResponse.json(
      {
        error: "Failed to update JIRA issue",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
