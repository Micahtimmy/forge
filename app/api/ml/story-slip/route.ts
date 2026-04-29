/**
 * Story Slip Prediction API
 * POST /api/ml/story-slip
 * GET /api/ml/story-slip?sprintId=123 (batch for sprint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api/auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit';
import { predictStorySlip, predictSprintStories } from '@/lib/ml/story-slip-prediction';

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
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: 'storyId is required' },
        { status: 400 }
      );
    }

    const prediction = await predictStorySlip({
      storyId,
      workspaceId,
    });

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Story slip prediction error:', error);
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

    const predictions = await predictSprintStories(
      workspaceId,
      parseInt(sprintId, 10)
    );

    return NextResponse.json({
      predictions,
      summary: {
        total: predictions.length,
        highRisk: predictions.filter(p => p.riskLevel === 'high').length,
        mediumRisk: predictions.filter(p => p.riskLevel === 'medium').length,
        lowRisk: predictions.filter(p => p.riskLevel === 'low').length,
      },
    });
  } catch (error) {
    console.error('Sprint stories prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}
