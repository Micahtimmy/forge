"use client";

import { PageHeader } from "@/components/layout/page-header";
import { DecisionLogger, type Decision as LoggerDecision } from "@/components/signal/decision-logger";
import { InfoPanel } from "@/components/ui/info-tip";
import { useDecisions, useCreateSimpleDecision, useDeleteDecision } from "@/hooks/use-decisions";

export default function DecisionsPage() {
  const { data, isLoading } = useDecisions();
  const createMutation = useCreateSimpleDecision();
  const deleteMutation = useDeleteDecision();

  // Map API decisions to DecisionLogger format
  const decisions: LoggerDecision[] = (data?.decisions ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    reasoning: d.description || (d.decision as Record<string, unknown>)?.rationale as string || null,
    madeById: d.created_by,
    madeByName: d.creator?.full_name,
    affectedTickets: (d.context as Record<string, unknown>)?.linked_stories as string[] || [],
    tags: d.tags || [],
    createdAt: new Date(d.created_at),
    signalUpdateId: null,
  }));

  const handleCreateDecision = async (data: {
    title: string;
    reasoning?: string;
    affectedTickets?: string[];
    tags?: string[];
  }) => {
    await createMutation.mutateAsync(data);
  };

  const handleDeleteDecision = async (decisionId: string) => {
    await deleteMutation.mutateAsync(decisionId);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Decision Log"
        description="Track and document important decisions made during the sprint"
      />

      <div className="space-y-6">
        <InfoPanel termKey="decisionLog" />

        <DecisionLogger
          decisions={decisions}
          onCreateDecision={handleCreateDecision}
          onDeleteDecision={handleDeleteDecision}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
