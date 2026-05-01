/**
 * JIRA Instance Projects API
 * GET /api/jira/instances/[instanceId]/projects - List/discover projects
 * POST /api/jira/instances/[instanceId]/projects - Add project mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api/auth';
import { multiJiraService } from '@/lib/jira/multi-jira-service';
import * as Sentry from "@sentry/nextjs";

interface RouteContext {
  params: Promise<{ instanceId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { workspaceId } = auth.context;
    const { instanceId } = await context.params;
    const { searchParams } = new URL(request.url);
    const discover = searchParams.get('discover') === 'true';

    // Verify ownership
    const instance = await multiJiraService.getInstance(instanceId);
    if (!instance || instance.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    if (discover) {
      // Fetch available projects from JIRA
      const available = await multiJiraService.discoverProjects(instanceId);
      const mapped = await multiJiraService.getProjectMappings(instanceId);
      const mappedIds = new Set(mapped.map(m => m.projectId));

      return NextResponse.json({
        available: available.map(p => ({
          ...p,
          isMapped: mappedIds.has(p.id),
        })),
        mapped,
      });
    }

    // Just return current mappings
    const projects = await multiJiraService.getProjectMappings(instanceId);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Get JIRA projects error:', error);
    Sentry.captureException(error, { tags: { api: "jira-projects-get" } });
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { workspaceId } = auth.context;
    const { instanceId } = await context.params;
    const body = await request.json();
    const { projectId, projectKey, projectName } = body;

    if (!projectId || !projectKey || !projectName) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, projectKey, projectName' },
        { status: 400 }
      );
    }

    // Verify ownership
    const instance = await multiJiraService.getInstance(instanceId);
    if (!instance || instance.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    const mapping = await multiJiraService.addProjectMapping(
      instanceId,
      workspaceId,
      projectId,
      projectKey,
      projectName
    );

    return NextResponse.json(mapping, { status: 201 });
  } catch (error) {
    console.error('Add JIRA project mapping error:', error);
    Sentry.captureException(error, { tags: { api: "jira-projects-post" } });
    return NextResponse.json(
      { error: 'Failed to add project mapping' },
      { status: 500 }
    );
  }
}
