import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Decision } from "@/lib/db/queries/signals";

async function fetchDecisions(options?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<Decision[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.offset) params.set("offset", options.offset.toString());
  if (options?.search) params.set("search", options.search);

  const response = await fetch(`/api/decisions?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch decisions");
  }
  const data = await response.json();
  return data.decisions.map((d: Decision & { createdAt: string }) => ({
    ...d,
    createdAt: new Date(d.createdAt),
  }));
}

async function createDecision(data: {
  title: string;
  reasoning?: string;
  affectedTickets?: string[];
  tags?: string[];
  signalUpdateId?: string;
}): Promise<Decision> {
  const response = await fetch("/api/decisions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create decision");
  }
  const result = await response.json();
  return {
    ...result.decision,
    createdAt: new Date(result.decision.createdAt),
  };
}

async function deleteDecision(decisionId: string): Promise<void> {
  const response = await fetch(`/api/decisions/${decisionId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete decision");
  }
}

export function useDecisions(options?: {
  limit?: number;
  offset?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["decisions", options],
    queryFn: () => fetchDecisions(options),
    staleTime: 30 * 1000,
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDecision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
    },
  });
}

export function useDeleteDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDecision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions"] });
    },
  });
}
