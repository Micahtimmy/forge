"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PICanvasData } from "@/types/pi";
import type { ProgramIncrement } from "@/lib/db/queries/pis";

async function fetchPI(piId: string): Promise<ProgramIncrement> {
  const response = await fetch(`/api/pi/${piId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch program increment");
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
