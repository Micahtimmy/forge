"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  VelocityDataPoint,
  QualityTrendDataPoint,
  TeamMemberCapacity,
  BurndownDataPoint,
  IndividualStats,
  KanbanColumn,
} from "@/lib/db/queries/analytics";

async function fetchVelocityData(): Promise<VelocityDataPoint[]> {
  const response = await fetch("/api/analytics/velocity");
  if (!response.ok) throw new Error("Failed to fetch velocity data");
  return response.json();
}

async function fetchQualityTrend(): Promise<QualityTrendDataPoint[]> {
  const response = await fetch("/api/analytics/quality-trend");
  if (!response.ok) throw new Error("Failed to fetch quality trend");
  return response.json();
}

async function fetchTeamCapacity(): Promise<TeamMemberCapacity[]> {
  const response = await fetch("/api/analytics/capacity");
  if (!response.ok) throw new Error("Failed to fetch team capacity");
  return response.json();
}

async function fetchBurndownData(): Promise<{ data: BurndownDataPoint[]; totalPoints: number }> {
  const response = await fetch("/api/analytics/burndown");
  if (!response.ok) throw new Error("Failed to fetch burndown data");
  return response.json();
}

async function fetchIndividualStats(): Promise<IndividualStats> {
  const response = await fetch("/api/analytics/individual");
  if (!response.ok) throw new Error("Failed to fetch individual stats");
  return response.json();
}

async function fetchKanbanBoard(sprintId?: number): Promise<KanbanColumn[]> {
  const params = sprintId ? `?sprintId=${sprintId}` : "";
  const response = await fetch(`/api/analytics/kanban${params}`);
  if (!response.ok) throw new Error("Failed to fetch kanban board");
  return response.json();
}

export function useVelocityData() {
  return useQuery({
    queryKey: ["analytics", "velocity"],
    queryFn: fetchVelocityData,
    staleTime: 1000 * 60 * 5,
  });
}

export function useQualityTrend() {
  return useQuery({
    queryKey: ["analytics", "quality-trend"],
    queryFn: fetchQualityTrend,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTeamCapacity() {
  return useQuery({
    queryKey: ["analytics", "capacity"],
    queryFn: fetchTeamCapacity,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBurndownData() {
  return useQuery({
    queryKey: ["analytics", "burndown"],
    queryFn: fetchBurndownData,
    staleTime: 1000 * 60 * 5,
  });
}

export function useIndividualStats() {
  return useQuery({
    queryKey: ["analytics", "individual"],
    queryFn: fetchIndividualStats,
    staleTime: 1000 * 60 * 5,
  });
}

export function useKanbanBoard(sprintId?: number) {
  return useQuery({
    queryKey: ["analytics", "kanban", sprintId],
    queryFn: () => fetchKanbanBoard(sprintId),
    staleTime: 1000 * 60 * 2,
  });
}
