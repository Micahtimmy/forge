/**
 * Sync specific JIRA instance
 * POST /api/jira/instances/[instanceId]/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api/auth';
import { multiJiraService } from '@/lib/jira/multi-jira-service';
import * as Sentry from "@sentry/nextjs";

interface RouteContext {
  params: Promise<{ instanceId: string }>;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { workspaceId } = auth.context;
    const { instanceId } = await context.params;

    // Verify ownership
    const instance = await multiJiraService.getInstance(instanceId);
    if (!instance || instance.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    const result = await multiJiraService.syncInstance(instanceId, workspaceId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync JIRA instance error:', error);
    Sentry.captureException(error, { tags: { api: "jira-instance-sync" } });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
