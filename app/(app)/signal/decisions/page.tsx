"use client";

import { PageHeader } from "@/components/layout/page-header";
import { DecisionLogger } from "@/components/signal/decision-logger";
import { InfoPanel } from "@/components/ui/info-tip";
import { useDecisions, useCreateDecision, useDeleteDecision } from "@/hooks/use-decisions";

export default function DecisionsPage() {
  const { data: decisions = [], isLoading } = useDecisions();
  const createMutation = useCreateDecision();
  const deleteMutation = useDeleteDecision();

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
