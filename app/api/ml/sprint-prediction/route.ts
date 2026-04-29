/**
 * Sprint Failure Prediction API
 * POST /api/ml/sprint-prediction
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api/auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit';
import { predictSprintFailure, getSprintPredictionHistory } from '@/lib/ml/sprint-prediction';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { user, workspaceId } = auth.context;

    const rateLimitResult = checkRateLimit(
      request,
      user.id,
      RATE_LIMITS.aiScoring
    );
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    const body = await request.json();
    const { sprintId } = body;

    if (!sprintId) {
      return NextResponse.json(
        { error: 'sprintId is required' },
        { status: 400 }
      );
    }

    const prediction = await predictSprintFailure({
      sprintId: parseInt(sprintId, 10),
      workspaceId,
    });

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Sprint prediction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Prediction failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { workspaceId } = auth.context;

    const { searchParams } = new URL(request.url);
    const sprintId = searchParams.get('sprintId');

    if (!sprintId) {
      return NextResponse.json(
        { error: 'sprintId is required' },
        { status: 400 }
      );
    }

    const history = await getSprintPredictionHistory(
      workspaceId,
      parseInt(sprintId, 10)
    );

    return NextResponse.json({ predictions: history });
  } catch (error) {
    console.error('Sprint prediction history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prediction history' },
      { status: 500 }
    );
  }
}
