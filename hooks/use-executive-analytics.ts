'use client';

/**
 * Executive Analytics Hooks
 * TanStack Query hooks for cross-workspace analytics
 */

import { useQuery } from '@tanstack/react-query';
import type {
  ExecutiveSummary,
  WorkspaceComparison,
  QualityHeatmap,
  VelocityForecast,
  RiskAggregation,
} from '@/lib/analytics/cross-workspace';

interface ExecutiveAnalyticsAll {
  summary: ExecutiveSummary;
  comparison: { workspaces: WorkspaceComparison[] };
  heatmap: QualityHeatmap;
  forecast: VelocityForecast;
  risks: RiskAggregation;
}

async function fetchExecutiveAnalytics<T>(
  view: string,
  params?: Record<string, string | number>
): Promise<T> {
  const searchParams = new URLSearchParams({ view });
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(`/api/analytics/executive?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch executive analytics');
  }

  return response.json();
}

export function useExecutiveSummary(periodDays = 30) {
  return useQuery<ExecutiveSummary>({
    queryKey: ['executive', 'summary', periodDays],
    queryFn: () => fetchExecutiveAnalytics('summary', { periodDays }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useWorkspaceComparison() {
  return useQuery<{ workspaces: WorkspaceComparison[] }>({
    queryKey: ['executive', 'comparison'],
    queryFn: () => fetchExecutiveAnalytics('comparison'),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useQualityHeatmap() {
  return useQuery<QualityHeatmap>({
    queryKey: ['executive', 'quality-heatmap'],
    queryFn: () => fetchExecutiveAnalytics('quality-heatmap'),
    staleTime: 10 * 60 * 1000, // 10 minutes - less frequently updated
    gcTime: 60 * 60 * 1000,
  });
}

export function useVelocityForecast(workspaceId?: string, periodsAhead = 4) {
  return useQuery<VelocityForecast>({
    queryKey: ['executive', 'velocity-forecast', workspaceId, periodsAhead],
    queryFn: () => fetchExecutiveAnalytics('velocity-forecast', { workspaceId: workspaceId || '', periodsAhead }),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000,
  });
}

export function useRiskAggregation() {
  return useQuery<RiskAggregation>({
    queryKey: ['executive', 'risks'],
    queryFn: () => fetchExecutiveAnalytics('risks'),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useExecutiveAnalyticsAll(periodDays = 30) {
  return useQuery<ExecutiveAnalyticsAll>({
    queryKey: ['executive', 'all', periodDays],
    queryFn: () => fetchExecutiveAnalytics('all', { periodDays }),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Helper to get trend icon/color
export function getTrendIndicator(trend: 'improving' | 'stable' | 'declining' | 'increasing' | 'decreasing' | 'up' | 'down') {
  const indicators = {
    improving: { icon: '↑', color: 'text-jade', label: 'Improving' },
    up: { icon: '↑', color: 'text-jade', label: 'Up' },
    stable: { icon: '→', color: 'text-text-secondary', label: 'Stable' },
    declining: { icon: '↓', color: 'text-coral', label: 'Declining' },
    down: { icon: '↓', color: 'text-coral', label: 'Down' },
    increasing: { icon: '↑', color: 'text-coral', label: 'Increasing' }, // Increasing risks = bad
    decreasing: { icon: '↓', color: 'text-jade', label: 'Decreasing' }, // Decreasing risks = good
  };

  return indicators[trend] || indicators.stable;
}

// Helper to format period dates
export function formatPeriod(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}
