/**
 * Team Capacity Intelligence API
 * GET /api/ml/capacity
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from '@/lib/api/auth';
import { analyzeTeamCapacity } from '@/lib/ml/capacity-intelligence';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { workspaceId } = auth.context;

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId') || undefined;
    const sprintId = searchParams.get('sprintId');

    const analysis = await analyzeTeamCapacity({
      workspaceId,
      teamId,
      sprintId: sprintId ? parseInt(sprintId, 10) : undefined,
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Capacity intelligence error:', error);
    Sentry.captureException(error, { tags: { api: "ml-capacity" } });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
