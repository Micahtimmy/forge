"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProgramIncrement, PICanvasData, PITeam, PIDependency, PIRisk } from "@/types/pi";

interface PIFilters {
  status?: "planning" | "active" | "completed";
  limit?: number;
}

interface PIsResponse {
  pis: ProgramIncrement[];
  total: number;
}

// Fetch all PIs
export function useProgramIncrements(filters: PIFilters = {}) {
  return useQuery<PIsResponse>({
    queryKey: ["program-increments", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.limit) params.set("limit", filters.limit.toString());

      const response = await fetch(`/api/horizon?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch program increments");
      }
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// Fetch a single PI by ID
export function useProgramIncrement(piId: string | null) {
  return useQuery<ProgramIncrement & { teams: PITeam[]; dependencies: PIDependency[]; risks: PIRisk[] }>({
    queryKey: ["program-increment", piId],
    queryFn: async () => {
      if (!piId) throw new Error("PI ID required");
      const response = await fetch(`/api/horizon/${piId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch program increment");
      }
      return response.json();
    },
    enabled: !!piId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Create a new PI
export function useCreatePI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      startDate: string;
      endDate: string;
      iterations: number;
    }) => {
      const response = await fetch("/api/horizon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create PI");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-increments"] });
    },
  });
}

// Update PI canvas data
export function useUpdatePICanvas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      piId,
      canvasData,
    }: {
      piId: string;
      canvasData: PICanvasData;
    }) => {
      const response = await fetch(`/api/horizon/${piId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvasData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update canvas");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["program-increment", variables.piId] });
    },
  });
}

// Fetch PI teams
export function usePITeams(piId: string | null) {
  return useQuery<PITeam[]>({
    queryKey: ["pi-teams", piId],
    queryFn: async () => {
      if (!piId) throw new Error("PI ID required");
      const response = await fetch(`/api/horizon/${piId}/teams`);
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      return response.json();
    },
    enabled: !!piId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Add team to PI
export function useAddPITeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      piId,
      team,
    }: {
      piId: string;
      team: { name: string; capacity: number };
    }) => {
      const response = await fetch(`/api/horizon/${piId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(team),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add team");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pi-teams", variables.piId] });
      queryClient.invalidateQueries({ queryKey: ["program-increment", variables.piId] });
    },
  });
}

// Fetch PI dependencies
export function usePIDependencies(piId: string | null) {
  return useQuery<PIDependency[]>({
    queryKey: ["pi-dependencies", piId],
    queryFn: async () => {
      if (!piId) throw new Error("PI ID required");
      const response = await fetch(`/api/horizon/${piId}/dependencies`);
      if (!response.ok) {
        throw new Error("Failed to fetch dependencies");
      }
      return response.json();
    },
    enabled: !!piId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Add dependency
export function useAddDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      piId,
      dependency,
    }: {
      piId: string;
      dependency: {
        fromFeatureId: string;
        toFeatureId: string;
        description?: string;
      };
    }) => {
      const response = await fetch(`/api/horizon/${piId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dependency),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add dependency");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pi-dependencies", variables.piId] });
    },
  });
}

// Update dependency status
export function useUpdateDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      piId,
      dependencyId,
      status,
    }: {
      piId: string;
      dependencyId: string;
      status: "open" | "resolved" | "at_risk" | "blocked";
    }) => {
      const response = await fetch(`/api/horizon/${piId}/dependencies/${dependencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update dependency");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pi-dependencies", variables.piId] });
    },
  });
}

// Fetch PI risks
export function usePIRisks(piId: string | null) {
  return useQuery<PIRisk[]>({
    queryKey: ["pi-risks", piId],
    queryFn: async () => {
      if (!piId) throw new Error("PI ID required");
      const response = await fetch(`/api/horizon/${piId}/risks`);
      if (!response.ok) {
        throw new Error("Failed to fetch risks");
      }
      return response.json();
    },
    enabled: !!piId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Add risk
export function useAddRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      piId,
      risk,
    }: {
      piId: string;
      risk: {
        title: string;
        description: string;
        type: string;
        impact: "low" | "medium" | "high";
        mitigation?: string;
      };
    }) => {
      const response = await fetch(`/api/horizon/${piId}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(risk),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add risk");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pi-risks", variables.piId] });
    },
  });
}

// Generate AI-powered PI objectives
export function useGeneratePIObjectives() {
  return useMutation({
    mutationFn: async ({
      piId,
      context,
    }: {
      piId: string;
      context: {
        piName: string;
        teams: string[];
        features: Array<{ title: string; description: string; points: number }>;
        businessGoals?: string[];
      };
    }) => {
      const response = await fetch("/api/ai/pi-objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piId, ...context }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate objectives");
      }

      return response.json();
    },
  });
}

// Analyze risks with AI
export function useAnalyzePIRisks() {
  return useMutation({
    mutationFn: async ({
      piId,
      dependencies,
      capacityUtilization,
    }: {
      piId: string;
      dependencies: Array<{ from: string; to: string; status: string }>;
      capacityUtilization: Array<{ team: string; committed: number; capacity: number }>;
    }) => {
      const response = await fetch("/api/ai/analyze-risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piId, dependencies, capacityUtilization }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze risks");
      }

      return response.json();
    },
  });
}
