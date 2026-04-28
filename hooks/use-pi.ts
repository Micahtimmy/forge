"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PICanvasData } from "@/types/pi";
import type { ProgramIncrement, PITeam, PIFeature, PIDependency, PIRisk } from "@/lib/db/queries/pis";

export interface PIListItem {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "completed";
  iterationCount: number;
  iterationLengthWeeks: number;
  teamsCount: number;
  dependenciesCount: number;
  risksCount: number;
  createdAt: string;
}

async function fetchPIs(status?: string): Promise<{ pis: PIListItem[] }> {
  const params = status ? `?status=${status}` : "";
  const response = await fetch(`/api/pi${params}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch PIs");
  }
  return response.json();
}

async function fetchPI(piId: string): Promise<ProgramIncrement> {
  const response = await fetch(`/api/pi/${piId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch program increment");
  }
  return response.json();
}

async function createPI(data: {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  iterationCount?: number;
  iterationLengthWeeks?: number;
}): Promise<{ success: boolean; pi: PIListItem }> {
  const response = await fetch("/api/pi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create PI");
  }
  return response.json();
}

async function updatePICanvas(
  piId: string,
  canvasData: PICanvasData
): Promise<void> {
  const response = await fetch(`/api/pi/${piId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ canvasData }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update canvas");
  }
}

export function usePIs(status?: "planning" | "active" | "completed") {
  return useQuery({
    queryKey: ["pis", status],
    queryFn: () => fetchPIs(status),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreatePI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pis"] });
    },
  });
}

export function usePI(piId: string) {
  return useQuery({
    queryKey: ["pi", piId],
    queryFn: () => fetchPI(piId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!piId,
  });
}

export function usePICanvasMutation(piId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (canvasData: PICanvasData) => updatePICanvas(piId, canvasData),
    onSuccess: () => {
      // Invalidate the PI query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["pi", piId] });
    },
    onError: (error) => {
      console.error("Failed to save canvas:", error);
    },
  });
}

// Fetch PI teams
async function fetchPITeams(piId: string): Promise<{ teams: PITeam[] }> {
  const response = await fetch(`/api/pi/${piId}/teams`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch teams");
  }
  return response.json();
}

export function usePITeams(piId: string) {
  return useQuery({
    queryKey: ["pi", piId, "teams"],
    queryFn: () => fetchPITeams(piId),
    staleTime: 1000 * 60 * 2,
    enabled: !!piId,
  });
}

export function useCreatePITeam(piId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; totalCapacity?: number }) => {
      const response = await fetch(`/api/pi/${piId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create team");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pi", piId, "teams"] });
    },
  });
}

// Fetch PI features
async function fetchPIFeatures(piId: string): Promise<{ features: PIFeature[] }> {
  const response = await fetch(`/api/pi/${piId}/features`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch features");
  }
  return response.json();
}

export function usePIFeatures(piId: string) {
  return useQuery({
    queryKey: ["pi", piId, "features"],
    queryFn: () => fetchPIFeatures(piId),
    staleTime: 1000 * 60 * 2,
    enabled: !!piId,
  });
}

export function useCreatePIFeature(piId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      teamId?: string;
      title: string;
      description?: string;
      points?: number;
      iterationIndex?: number;
      jiraKey?: string;
      riskLevel?: "none" | "low" | "medium" | "high";
    }) => {
      const response = await fetch(`/api/pi/${piId}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create feature");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pi", piId, "features"] });
    },
  });
}

// Fetch PI dependencies
async function fetchPIDependencies(piId: string): Promise<{ dependencies: PIDependency[] }> {
  const response = await fetch(`/api/pi/${piId}/dependencies`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch dependencies");
  }
  return response.json();
}

export function usePIDependencies(piId: string) {
  return useQuery({
    queryKey: ["pi", piId, "dependencies"],
    queryFn: () => fetchPIDependencies(piId),
    staleTime: 1000 * 60 * 2,
    enabled: !!piId,
  });
}

export function useCreatePIDependency(piId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      sourceFeatureId: string;
      targetFeatureId: string;
      description?: string;
    }) => {
      const response = await fetch(`/api/pi/${piId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create dependency");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pi", piId, "dependencies"] });
    },
  });
}

// Fetch PI risks
async function fetchPIRisks(piId: string): Promise<{ risks: PIRisk[] }> {
  const response = await fetch(`/api/pi/${piId}/risks`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch risks");
  }
  return response.json();
}

export function usePIRisks(piId: string) {
  return useQuery({
    queryKey: ["pi", piId, "risks"],
    queryFn: () => fetchPIRisks(piId),
    staleTime: 1000 * 60 * 2,
    enabled: !!piId,
  });
}

export function useCreatePIRisk(piId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      probability: "low" | "medium" | "high";
      impact: "low" | "medium" | "high";
      mitigation?: string;
      ownerId?: string;
    }) => {
      const response = await fetch(`/api/pi/${piId}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create risk");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pi", piId, "risks"] });
    },
  });
}

// PI Objectives generation
export interface PIObjectivesInput {
  piName: string;
  startDate: string;
  endDate: string;
  iterations: number;
  teams: Array<{
    name: string;
    capacity: number;
    features: Array<{
      key: string;
      title: string;
      description: string | null;
      storyPoints: number;
    }>;
  }>;
}

export interface PIObjective {
  title: string;
  description: string;
  businessValue: number;
  commitmentLevel: "committed" | "uncommitted";
  successCriteria: string[];
  relatedFeatures: Array<{ key: string; title: string }>;
  dependencies: Array<{
    type: "providing" | "receiving";
    team: string;
    description: string;
  }>;
  risks: Array<{ severity: "low" | "medium" | "high"; description: string }>;
}

export interface TeamObjectives {
  teamName: string;
  objectives: PIObjective[];
}

export function useGeneratePIObjectives() {
  return useMutation({
    mutationFn: async (input: PIObjectivesInput): Promise<{ teams: TeamObjectives[] }> => {
      const response = await fetch("/api/ai/pi-objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate objectives");
      }
      return response.json();
    },
  });
}

// Risk Analysis
export interface RiskAnalysisInput {
  piName: string;
  startDate: string;
  endDate: string;
  teams: Array<{
    name: string;
    capacity: number;
    committedPoints: number;
    objectives: Array<{
      title: string;
      businessValue: number;
      commitment: "committed" | "uncommitted";
    }>;
  }>;
  dependencies: Array<{
    id: string;
    fromTeam: string;
    toTeam: string;
    fromStory: string;
    toStory: string;
    status: string;
    description?: string;
  }>;
  previousPIMetrics?: {
    velocityAccuracy: number;
    objectivesAchieved: number;
    totalObjectives: number;
  };
}

export interface Risk {
  id: string;
  title: string;
  category: "dependency" | "capacity" | "technical" | "external" | "scope";
  severity: "critical" | "high" | "medium" | "low";
  probability: number;
  impact: number;
  description: string;
  affectedTeams: string[];
  affectedObjectives: Array<{ team: string; title: string }>;
  roamStatus: "resolved" | "owned" | "accepted" | "mitigated";
  owner: string;
  mitigationActions: Array<{ priority: number; action: string }>;
  triggers: string;
  contingency: string;
}

export interface Recommendation {
  priority: number;
  action: string;
  rationale: string;
  owner: string;
}

export interface RiskSummary {
  totalRisks: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  overallRiskLevel: "low" | "medium" | "high" | "critical";
}

export interface RiskAnalysisResult {
  summary: RiskSummary;
  risks: Risk[];
  recommendations: Recommendation[];
}

export function useAnalyzeRisks() {
  return useMutation({
    mutationFn: async (input: RiskAnalysisInput): Promise<RiskAnalysisResult> => {
      const response = await fetch("/api/ai/analyze-risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze risks");
      }
      return response.json();
    },
  });
}
