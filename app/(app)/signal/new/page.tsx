"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { PageHeaderCompact } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UpdateComposer } from "@/components/signal/update-composer";
import { useToastActions } from "@/components/ui/toast";
import { useStories, useSprints } from "@/hooks/use-stories";
import { useCreateSignalUpdate, useSaveDraft, useSendUpdate } from "@/hooks/use-signal";
import type { AudienceType } from "@/types/signal";

export default function NewUpdatePage() {
  const router = useRouter();
  const toast = useToastActions();
  const [updateId, setUpdateId] = useState<string | null>(null);

  const { data: sprintsData, isLoading: sprintsLoading } = useSprints();
  const activeSprint = sprintsData?.sprints?.find((s) => s.isActive);
  const sprintId = activeSprint?.jiraSprintId?.toString();

  const { data: storiesData, isLoading: storiesLoading } = useStories({
    sprintId,
    limit: 50,
  });

  const createUpdate = useCreateSignalUpdate();
  const saveDraft = useSaveDraft();
  const sendUpdate = useSendUpdate();

  const isLoading = sprintsLoading || storiesLoading;

  const context = useMemo(() => {
    if (!storiesData?.stories || !activeSprint) {
      return {
        sprintName: activeSprint?.name || "Current Sprint",
        completedStories: [],
        inProgressStories: [],
        blockers: [],
        velocityTarget: 0,
        velocityActual: 0,
      };
    }

    const stories = storiesData.stories;
    const completedStories = stories
      .filter((s) => s.status === "Done" || s.status === "Closed")
      .map((s) => ({ key: s.jiraKey, title: s.title, points: s.storyPoints || 0 }));

    const inProgressStories = stories
      .filter((s) => s.status === "In Progress" || s.status === "In Review")
      .map((s) => ({ key: s.jiraKey, title: s.title, progress: 50 }));

    const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints || 0), 0);
    const completedPoints = completedStories.reduce((sum, s) => sum + (s.points || 0), 0);

    return {
      sprintName: activeSprint.name,
      completedStories,
      inProgressStories,
      blockers: [],
      velocityTarget: totalPoints,
      velocityActual: completedPoints,
    };
  }, [storiesData, activeSprint]);

  const handleSend = async (
    audiences: AudienceType[],
    content: Record<AudienceType, string>
  ) => {
    try {
      let currentUpdateId = updateId;

      if (!currentUpdateId) {
        const result = await createUpdate.mutateAsync(context.sprintName);
        currentUpdateId = result.update?.id;
        setUpdateId(currentUpdateId || null);
      }

      if (!currentUpdateId) {
        throw new Error("Failed to create update record");
      }

      for (const audience of audiences) {
        if (content[audience]) {
          await saveDraft.mutateAsync({
            updateId: currentUpdateId,
            audience,
            content: content[audience],
            tone: 3,
            aiGenerated: true,
          });
        }
      }

      await sendUpdate.mutateAsync({
        updateId: currentUpdateId,
        audiences,
        channels: ["email"],
      });

      toast.success(
        "Updates sent!",
        `Successfully sent to ${audiences.length} audience(s)`
      );

      router.push("/signal");
    } catch (err) {
      toast.error(
        "Failed to send",
        err instanceof Error ? err.message : "Unknown error"
      );
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-8 w-24 mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

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
          subtitle={`Generate stakeholder updates for ${context.sprintName}`}
        />
      </div>

      <UpdateComposer context={context} onSend={handleSend} />
    </div>
  );
}
