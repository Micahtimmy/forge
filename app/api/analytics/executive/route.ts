/**
 * Executive Analytics API
 * GET /api/analytics/executive
 * Cross-workspace analytics for organization-level insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api/auth';
import {
  getExecutiveSummary,
  getWorkspaceComparison,
  getQualityHeatmap,
  getVelocityForecast,
  getRiskAggregation,
} from '@/lib/analytics/cross-workspace';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { user, workspaceId } = auth.context;

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'summary';
    const periodDays = parseInt(searchParams.get('periodDays') || '30', 10);

    // For now, use workspace_id as organization_id
    // In a full implementation, we'd look up the organization from user
    const organizationId = workspaceId;

    switch (view) {
      case 'summary': {
        const summary = await getExecutiveSummary(organizationId, periodDays);
        return NextResponse.json(summary);
      }

      case 'comparison': {
        const comparison = await getWorkspaceComparison(organizationId);
        return NextResponse.json({ workspaces: comparison });
      }

      case 'quality-heatmap': {
        const heatmap = await getQualityHeatmap(organizationId);
        return NextResponse.json(heatmap);
      }

      case 'velocity-forecast': {
        const targetWorkspaceId = searchParams.get('workspaceId') || undefined;
        const periodsAhead = parseInt(searchParams.get('periodsAhead') || '4', 10);
        const forecast = await getVelocityForecast(organizationId, targetWorkspaceId, periodsAhead);
        return NextResponse.json(forecast);
      }

      case 'risks': {
        const risks = await getRiskAggregation(organizationId);
        return NextResponse.json(risks);
      }

      case 'all': {
        const [summary, comparison, heatmap, forecast, risks] = await Promise.all([
          getExecutiveSummary(organizationId, periodDays),
          getWorkspaceComparison(organizationId),
          getQualityHeatmap(organizationId),
          getVelocityForecast(organizationId),
          getRiskAggregation(organizationId),
        ]);

        return NextResponse.json({
          summary,
          comparison: { workspaces: comparison },
          heatmap,
          forecast,
          risks,
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid view: ${view}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Executive analytics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
