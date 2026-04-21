"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DecisionLogger, type Decision } from "@/components/signal/decision-logger";
import { InfoPanel } from "@/components/ui/info-tip";

const DEMO_DECISIONS: Decision[] = [
  {
    id: "1",
    title: "Descoped Verve card integration from MVP",
    reasoning:
      "Vendor integration was delayed by 3 weeks due to compliance review. Decided to launch with Mastercard/Visa only and add Verve in v1.1 to avoid delaying overall release.",
    madeById: "demo-user-1",
    madeByName: "Adaeze Okonkwo",
    affectedTickets: ["PAY-142", "PAY-143", "PAY-156"],
    tags: ["scope-change", "timeline", "dependency"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    title: "Switched from REST to GraphQL for mobile API",
    reasoning:
      "Mobile team reported excessive round-trips for dashboard data. GraphQL allows fetching all required data in a single request, improving app load time by ~40%.",
    madeById: "demo-user-2",
    madeByName: "Chidi Eze",
    affectedTickets: ["API-089", "MOB-201", "MOB-202"],
    tags: ["technical", "process"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    title: "Added 2 engineers to Card Management squad",
    reasoning:
      "PI Planning identified Card Management as critical path for Q2 objectives. Reallocated from Platform team which has lower PI risk.",
    madeById: "demo-user-1",
    madeByName: "Adaeze Okonkwo",
    affectedTickets: [],
    tags: ["resource", "risk"],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    title: "Deferred dark mode to post-launch",
    reasoning:
      "User research showed dark mode was nice-to-have, not blocking adoption. Team capacity better spent on core payment flows.",
    madeById: "demo-user-3",
    madeByName: "Ngozi Adeyemi",
    affectedTickets: ["UI-078", "UI-079"],
    tags: ["scope-change", "budget"],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
];

export default function DemoDecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>(DEMO_DECISIONS);

  const handleCreateDecision = async (data: {
    title: string;
    reasoning?: string;
    affectedTickets?: string[];
    tags?: string[];
  }) => {
    await new Promise((r) => setTimeout(r, 500));

    const newDecision: Decision = {
      id: `demo-${Date.now()}`,
      title: data.title,
      reasoning: data.reasoning || null,
      madeById: "demo-current-user",
      madeByName: "You (Demo User)",
      affectedTickets: data.affectedTickets || [],
      tags: data.tags || [],
      createdAt: new Date(),
    };

    setDecisions([newDecision, ...decisions]);
  };

  const handleDeleteDecision = async (decisionId: string) => {
    await new Promise((r) => setTimeout(r, 300));
    setDecisions(decisions.filter((d) => d.id !== decisionId));
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
        />
      </div>
    </div>
  );
}
