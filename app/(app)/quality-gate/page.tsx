"use client";

import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Zap,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StoryCard } from "@/components/quality-gate/story-card";
import { SprintHealthSnapshot } from "@/components/quality-gate/sprint-health-snapshot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToastActions } from "@/components/ui/toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown";
import { SkeletonStoryCard } from "@/components/ui/skeleton";
import { EmptyStoriesState } from "@/components/ui/empty-state";
import { useQualityGateStore } from "@/stores/quality-gate-store";
import { useStories, useSprints, useStoryStats } from "@/hooks/use-stories";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

export default function QualityGatePage() {
  const toast = useToastActions();
  const {
    searchQuery,
    setSearchQuery,
    scoreFilter,
    setScoreFilter,
    viewMode,
    setViewMode,
    selectedSprintId,
    setSelectedSprintId,
    isScoring,
    setIsScoring,
  } = useQualityGateStore();

  const { data: sprintsData, isLoading: sprintsLoading } = useSprints();
  const sprints = sprintsData?.sprints || [];

  const effectiveSprintId = selectedSprintId || sprints.find(s => s.isActive)?.jiraSprintId?.toString();

  const {
    data: storiesData,
    isLoading: storiesLoading,
    refetch: refetchStories,
    isRefetching,
  } = useStories({
    sprintId: effectiveSprintId,
    scoreFilter: scoreFilter as "all" | "excellent" | "good" | "fair" | "poor",
    searchQuery: searchQuery || undefined,
  });

  const stories = storiesData?.stories || [];
  const distribution = storiesData?.distribution || { excellent: 0, good: 0, fair: 0, poor: 0 };
  const stats = useStoryStats(stories);

  const isLoading = storiesLoading || sprintsLoading;

  const handleScoreSprint = async () => {
    if (!effectiveSprintId || stories.length === 0) {
      toast.warning("No stories", "No stories available to score");
      return;
    }

    setIsScoring(true);
    try {
      const response = await fetch("/api/ai/score-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stories: stories.slice(0, 20).map((s) => ({
            key: s.jiraKey,
            title: s.title,
            description: s.description,
            acceptanceCriteria: s.acceptanceCriteria,
            storyPoints: s.storyPoints,
            epicKey: s.epicKey,
            labels: s.labels,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to score stories");
      }

      const result = await response.json();
      toast.success(
        "Sprint scored",
        `Successfully analyzed ${result.totalScored || stories.length} stories`
      );
      refetchStories();
    } catch (error) {
      toast.error(
        "Scoring failed",
        error instanceof Error ? error.message : "Unable to score stories"
      );
    } finally {
      setIsScoring(false);
    }
  };

  const handleSyncJira = async () => {
    try {
      const response = await fetch("/api/jira/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullSync: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sync failed");
      }

      toast.success(
        "JIRA sync complete",
        `Synced ${data.stories?.synced ?? 0} stories`
      );
      refetchStories();
    } catch (error) {
      toast.error(
        "Sync failed",
        error instanceof Error ? error.message : "Unable to sync with JIRA"
      );
    }
  };

  const currentSprint = sprints.find(
    (s) => s.jiraSprintId?.toString() === effectiveSprintId
  );

  return (
    <div>
      <PageHeader
        title="Quality Gate"
        description="AI-powered story quality analysis for your sprint backlog"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />}
              onClick={handleSyncJira}
              disabled={isRefetching}
            >
              {isRefetching ? "Syncing..." : "Sync JIRA"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Zap className="w-4 h-4" />}
              onClick={handleScoreSprint}
              isLoading={isScoring}
              disabled={stories.length === 0}
            >
              Score Sprint
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <SprintHealthSnapshot
            sprintName={currentSprint?.name ?? "Sprint"}
            healthScore={stats.avgScore}
            totalStories={stats.totalStories}
            distribution={distribution}
            trend={{ direction: "up", value: 0 }}
            storiesAtRisk={stats.storiesAtRisk}
          />
        </div>

        <div className="lg:col-span-3">
          <div className="flex items-center gap-3 mb-4">
            <Select
              value={effectiveSprintId || ""}
              onValueChange={setSelectedSprintId}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select sprint" />
              </SelectTrigger>
              <SelectContent>
                {sprints.length === 0 ? (
                  <SelectItem value="" disabled>
                    No sprints found
                  </SelectItem>
                ) : (
                  sprints.map((sprint) => (
                    <SelectItem
                      key={sprint.id}
                      value={sprint.jiraSprintId.toString()}
                    >
                      {sprint.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <div className="flex-1 max-w-xs">
              <Input
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  <Filter className="w-4 h-4 mr-1" />
                  Score
                  {scoreFilter !== "all" && (
                    <Badge variant="good" size="sm" className="ml-1">
                      {scoreFilter}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by score</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setScoreFilter("all")}>
                  All scores
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setScoreFilter("excellent")}>
                  <span className="w-2 h-2 rounded-full bg-jade mr-2" />
                  Excellent (85+)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setScoreFilter("good")}>
                  <span className="w-2 h-2 rounded-full bg-iris mr-2" />
                  Good (70-84)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setScoreFilter("fair")}>
                  <span className="w-2 h-2 rounded-full bg-amber mr-2" />
                  Fair (50-69)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setScoreFilter("poor")}>
                  <span className="w-2 h-2 rounded-full bg-coral mr-2" />
                  Poor (&lt;50)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center border border-border rounded-md">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-surface-03 text-text-primary"
                    : "text-text-tertiary hover:text-text-secondary"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "list"
                    ? "bg-surface-03 text-text-primary"
                    : "text-text-tertiary hover:text-text-secondary"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonStoryCard key={i} />
              ))}
            </div>
          ) : stories.length === 0 ? (
            <EmptyStoriesState />
          ) : (
            <motion.div
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {stories.map((story, index) => (
                <motion.div key={story.id} variants={staggerItem}>
                  <StoryCard
                    story={{
                      id: story.id,
                      workspaceId: story.workspaceId,
                      jiraId: story.jiraId,
                      jiraKey: story.jiraKey,
                      title: story.title,
                      description: story.description,
                      acceptanceCriteria: story.acceptanceCriteria,
                      storyPoints: story.storyPoints,
                      status: story.status,
                      assigneeId: null,
                      epicKey: story.epicKey,
                      sprintId: story.sprintId?.toString() || null,
                      labels: story.labels,
                      jiraUpdatedAt: story.jiraUpdatedAt,
                      syncedAt: story.syncedAt,
                      score: story.score
                        ? {
                            id: "score",
                            storyId: story.id,
                            rubricId: "default",
                            totalScore: story.score.totalScore,
                            completeness: null,
                            clarity: null,
                            estimability: null,
                            traceability: null,
                            testability: null,
                            aiSuggestions: null,
                            scoredAt: story.score.scoredAt,
                          }
                        : null,
                    }}
                    delay={index * 50}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
