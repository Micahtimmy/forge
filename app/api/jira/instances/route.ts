/**
 * Multi-JIRA Instances API
 * GET /api/jira/instances - List all instances
 * POST /api/jira/instances - Add new instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api/auth';
import { multiJiraService } from '@/lib/jira/multi-jira-service';

export async function GET() {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const instances = await multiJiraService.getInstances(auth.context.workspaceId);

    return NextResponse.json({ instances });
  } catch (error) {
    console.error('Get JIRA instances error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch JIRA instances' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { workspaceId } = auth.context;

    const body = await request.json();
    const { name, cloudId, siteUrl, accessToken, refreshToken, scopes, isPrimary } = body;

    if (!name || !cloudId || !siteUrl || !accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const instance = await multiJiraService.addInstance({
      workspaceId,
      name,
      cloudId,
      siteUrl,
      accessToken,
      refreshToken,
      scopes: scopes || [],
      isPrimary,
    });

    return NextResponse.json(instance, { status: 201 });
  } catch (error) {
    console.error('Add JIRA instance error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add instance' },
      { status: 500 }
    );
  }
}
