/**
 * ML Prediction Hooks
 * TanStack Query hooks for sprint/story predictions and capacity intelligence
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface SprintPrediction {
  sprintId: number;
  failureProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: Array<{
    factor: string;
    impact: number;
    description: string;
    suggestion?: string;
  }>;
  recommendation: string;
  confidence: number;
  modelVersion: string;
}

export interface StorySlipPrediction {
  storyId: string;
  slipProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendation: string;
  modelVersion: string;
}

export interface CapacityIntelligence {
  overallHealth: 'healthy' | 'warning' | 'critical';
  burnoutRisk: number;
  overallocationRisk: number;
  alerts: Array<{
    type: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    affectedMembers?: string[];
  }>;
  teamMetrics: {
    teamSize: number;
    totalCapacity: number;
    allocatedPoints: number;
    utilizationPercent: number;
    avgPointsPerMember: number;
    maxPointsPerMember: number;
    minPointsPerMember: number;
    recentVelocityTrend: 'increasing' | 'stable' | 'decreasing';
    sprintOverSprintChange: number;
  };
  recommendations: string[];
  modelVersion: string;
}

// Sprint Prediction Hooks
export function useSprintPrediction(sprintId: number | undefined) {
  return useQuery({
    queryKey: ['sprint-prediction', sprintId],
    queryFn: async (): Promise<SprintPrediction> => {
      const response = await fetch(`/api/ml/sprint-prediction?sprintId=${sprintId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sprint prediction');
      }
      const data = await response.json();
      return data.predictions?.[0] || null;
    },
    enabled: !!sprintId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useSprintPredictionHistory(sprintId: number | undefined) {
  return useQuery({
    queryKey: ['sprint-prediction-history', sprintId],
    queryFn: async (): Promise<SprintPrediction[]> => {
      const response = await fetch(`/api/ml/sprint-prediction?sprintId=${sprintId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch prediction history');
      }
      const data = await response.json();
      return data.predictions || [];
    },
    enabled: !!sprintId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useGenerateSprintPrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sprintId: number): Promise<SprintPrediction> => {
      const response = await fetch('/api/ml/sprint-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprintId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate prediction');
      }

      return response.json();
    },
    onSuccess: (data, sprintId) => {
      queryClient.setQueryData(['sprint-prediction', sprintId], data);
      queryClient.invalidateQueries({ queryKey: ['sprint-prediction-history', sprintId] });
    },
  });
}

// Story Slip Prediction Hooks
export function useStorySlipPrediction(storyId: string | undefined) {
  return useQuery({
    queryKey: ['story-slip', storyId],
    queryFn: async (): Promise<StorySlipPrediction> => {
      const response = await fetch('/api/ml/story-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch story slip prediction');
      }

      return response.json();
    },
    enabled: !!storyId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSprintStoriesPredictions(sprintId: number | undefined) {
  return useQuery({
    queryKey: ['sprint-stories-predictions', sprintId],
    queryFn: async () => {
      const response = await fetch(`/api/ml/story-slip?sprintId=${sprintId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sprint stories predictions');
      }
      return response.json() as Promise<{
        predictions: StorySlipPrediction[];
        summary: {
          total: number;
          highRisk: number;
          mediumRisk: number;
          lowRisk: number;
        };
      }>;
    },
    enabled: !!sprintId,
    staleTime: 5 * 60 * 1000,
  });
}

// Capacity Intelligence Hooks
export function useCapacityIntelligence(options?: { teamId?: string; sprintId?: number }) {
  const params = new URLSearchParams();
  if (options?.teamId) params.set('teamId', options.teamId);
  if (options?.sprintId) params.set('sprintId', String(options.sprintId));

  return useQuery({
    queryKey: ['capacity-intelligence', options?.teamId, options?.sprintId],
    queryFn: async (): Promise<CapacityIntelligence> => {
      const url = params.toString()
        ? `/api/ml/capacity?${params.toString()}`
        : '/api/ml/capacity';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch capacity intelligence');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// Combined dashboard hook
export function useSprintIntelligence(sprintId: number | undefined) {
  const prediction = useSprintPrediction(sprintId);
  const storyPredictions = useSprintStoriesPredictions(sprintId);
  const capacity = useCapacityIntelligence({ sprintId });

  return {
    sprintPrediction: prediction.data,
    storyPredictions: storyPredictions.data?.predictions || [],
    storySummary: storyPredictions.data?.summary,
    capacity: capacity.data,
    isLoading: prediction.isLoading || storyPredictions.isLoading || capacity.isLoading,
    error: prediction.error || storyPredictions.error || capacity.error,
    refetch: () => {
      prediction.refetch();
      storyPredictions.refetch();
      capacity.refetch();
    },
  };
}
