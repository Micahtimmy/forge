/**
 * Single JIRA Instance API
 * GET /api/jira/instances/[instanceId]
 * PATCH /api/jira/instances/[instanceId]
 * DELETE /api/jira/instances/[instanceId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api/auth';
import { multiJiraService } from '@/lib/jira/multi-jira-service';

interface RouteContext {
  params: Promise<{ instanceId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { workspaceId } = auth.context;
    const { instanceId } = await context.params;
    const instance = await multiJiraService.getInstance(instanceId);

    if (!instance || instance.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    const projects = await multiJiraService.getProjectMappings(instanceId);

    return NextResponse.json({ instance, projects });
  } catch (error) {
    console.error('Get JIRA instance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instance' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { workspaceId } = auth.context;
    const { instanceId } = await context.params;
    const body = await request.json();

    // Verify ownership
    const instance = await multiJiraService.getInstance(instanceId);
    if (!instance || instance.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    // Handle set primary
    if (body.isPrimary === true) {
      await multiJiraService.setPrimaryInstance(instanceId, workspaceId);
    }

    // Could add more update operations here

    const updated = await multiJiraService.getInstance(instanceId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update JIRA instance error:', error);
    return NextResponse.json(
      { error: 'Failed to update instance' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { workspaceId } = auth.context;
    const { instanceId } = await context.params;

    await multiJiraService.removeInstance(instanceId, workspaceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete JIRA instance error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete instance' },
      { status: 500 }
    );
  }
}
