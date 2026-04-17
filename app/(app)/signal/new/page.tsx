"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeaderCompact } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { UpdateComposer } from "@/components/signal/update-composer";
import { useToastActions } from "@/components/ui/toast";
import type { AudienceType } from "@/types/signal";

// Mock sprint context
const mockContext = {
  sprintName: "Sprint 22",
  sprintGoal: "Complete payment gateway integration and user dashboard",
  completedStories: [
    { key: "PROJ-118", title: "User authentication with OAuth2", points: 5 },
    { key: "PROJ-119", title: "Dashboard layout and navigation", points: 3 },
    { key: "PROJ-120", title: "API rate limiting implementation", points: 2 },
  ],
  inProgressStories: [
    { key: "PROJ-121", title: "Payment gateway integration", progress: 60 },
    { key: "PROJ-122", title: "Email notification system", progress: 30 },
  ],
  blockers: [
    {
      description: "Waiting for payment provider sandbox credentials",
      impact: "Blocking payment testing",
    },
  ],
  velocityTarget: 21,
  velocityActual: 10,
  highlights: [
    "OAuth2 implementation completed ahead of schedule",
    "Dashboard received positive feedback from stakeholders",
  ],
  risks: [
    "Payment integration may spill over to next sprint",
  ],
};

export default function NewUpdatePage() {
  const router = useRouter();
  const toast = useToastActions();

  const handleSend = (
    audiences: AudienceType[],
    content: Record<AudienceType, string>
  ) => {
    // In real app, this would save to DB and send via email/Slack
    console.log("Sending updates to:", audiences);
    console.log("Content:", content);

    toast.success(
      "Updates sent!",
      `Successfully sent to ${audiences.length} audience(s)`
    );

    router.push("/signal");
  };

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <PageHeaderCompact
          title="Create Update"
          subtitle="Generate stakeholder updates for Sprint 22"
        />
      </div>

      <UpdateComposer context={mockContext} onSend={handleSend} />
    </div>
  );
}
