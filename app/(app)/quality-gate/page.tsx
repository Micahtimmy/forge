"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Zap,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StoryCard } from "@/components/quality-gate/story-card";
import { SprintHealthSnapshot } from "@/components/quality-gate/sprint-health-snapshot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpTooltip, HelpInline } from "@/components/ui/help-tooltip";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
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
import { useAppStore } from "@/stores/app-store";
import { useStories, useSprints, useStoryStats } from "@/hooks/use-stories";
import { useJiraStatus } from "@/hooks/use-jira";
import { JiraConnectionPrompt } from "@/components/shared/jira-connection-prompt";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  PERSONA_CONFIGS,
  getPersonaInsights,
  HELP_CONTENT,
  type PersonaRole,
} from "@/lib/demo/persona-data";
import Link from "next/link";

function PersonaContextBanner({ role }: { role: PersonaRole }) {
  const config = PERSONA_CONFIGS[role];
  const storyFocus = config.dataFocus.stories;

  const focusLabels: Record<string, string> = {
    assigned: "your assigned stories",
    team: "your team's stories",
    sprint: "current sprint stories",
    all: "all backlog stories",
    at_risk: "at-risk stories only",
  };

  return (
    <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-iris/10 to-transparent border border-iris/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-iris/20">
            <FileText className="w-5 h-5 text-iris" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-text-primary">{config.label} View</h3>
              <HelpTooltip
                content={
                  <div>
                    <p className="font-medium mb-1">{config.label}</p>
                    <p className="text-slate-300">{config.description}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Default focus: {focusLabels[storyFocus]}
                    </p>
                  </div>
                }
              />
            </div>
            <p className="text-sm text-text-tertiary">
              Key metrics: {config.keyMetrics.slice(0, 3).join(", ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIInsightsPanel({ role }: { role: PersonaRole }) {
  const insights = getPersonaInsights(role).filter(i =>
    i.actionHref?.includes("quality") ||
    i.title.toLowerCase().includes("story") ||
    i.title.toLowerCase().includes("quality") ||
    i.title.toLowerCase().includes("sprint")
  );

  if (insights.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title="AI Insights"
      helpContent={HELP_CONTENT.aiSuggestions}
      defaultOpen={true}
      storageKey="qg-ai-insights"
      badge={
        <Badge variant="default" size="sm" className="bg-iris/20 text-iris">
          <Sparkles className="w-3 h-3 mr-1" />
          {insights.length}
        </Badge>
      }
    >
      <div className="space-y-2">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={cn(
              "p-3 rounded-lg border",
              insight.type === "warning" && "bg-amber/5 border-amber/20",
              insight.type === "success" && "bg-jade/5 border-jade/20",
              insight.type === "info" && "bg-iris/5 border-iris/20",
              insight.type === "action" && "bg-surface-02 border-border"
            )}
          >
            <div className="flex items-start gap-2">
              {insight.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber mt-0.5" />}
              {insight.type === "success" && <TrendingUp className="w-4 h-4 text-jade mt-0.5" />}
              {insight.type === "info" && <Sparkles className="w-4 h-4 text-iris mt-0.5" />}
              {insight.type === "action" && <FileText className="w-4 h-4 text-text-secondary mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary">{insight.title}</div>
                <div className="text-xs text-text-tertiary mt-0.5">{insight.description}</div>
                {insight.action && insight.actionHref && (
                  <Link href={insight.actionHref}>
                    <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">
                      {insight.action}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function ScoreDistributionPanel({ distribution }: { distribution: { excellent: number; good: number; fair: number; poor: number } }) {
  const total = distribution.excellent + distribution.good + distribution.fair + distribution.poor;

  return (
    <CollapsibleSection
      title="Score Distribution"
      helpContent={HELP_CONTENT.scoreRing}
      defaultOpen={true}
      storageKey="qg-score-distribution"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-jade" />
            <span className="text-text-secondary">Excellent (85+)</span>
          </div>
          <span className="font-mono text-text-primary">{distribution.excellent}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-iris" />
            <span className="text-text-secondary">Good (70-84)</span>
          </div>
          <span className="font-mono text-text-primary">{distribution.good}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber" />
            <span className="text-text-secondary">Fair (50-69)</span>
          </div>
          <span className="font-mono text-text-primary">{distribution.fair}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-coral" />
            <span className="text-text-secondary">Poor (&lt;50)</span>
          </div>
          <span className="font-mono text-text-primary">{distribution.poor}</span>
        </div>
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-tertiary">Total Stories</span>
            <span className="font-mono font-medium text-text-primary">{total}</span>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

function ScoringDimensionsPanel() {
  return (
    <CollapsibleSection
      title="Scoring Dimensions"
      helpContent="Stories are scored across 5 dimensions that determine overall quality."
      defaultOpen={false}
      storageKey="qg-dimensions"
    >
      <div className="space-y-2">
        {Object.entries(HELP_CONTENT.storyDimensions).map(([key, description]) => (
          <div key={key} className="p-2 rounded-lg bg-surface-02">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-text-primary capitalize">{key}</span>
            </div>
            <p className="text-xs text-text-tertiary">{description}</p>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

export default function QualityGatePage() {
  const toast = useToastActions();
  const { userRole } = useAppStore();
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

  const { data: jiraStatus } = useJiraStatus();
  const { data: sprintsData, isLoading: sprintsLoading } = useSprints();
  const sprints = sprintsData?.sprints || [];
  const isJiraConnected = jiraStatus?.connected ?? false;

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
        description={
          <span className="flex items-center gap-2">
            AI-powered story quality analysis for your sprint backlog
            <HelpTooltip
              content={
                <div className="max-w-xs">
                  <p className="font-medium mb-1">Quality Gate Module</p>
                  <p className="text-slate-300 text-xs">
                    {HELP_CONTENT.scoreRing}
                  </p>
                </div>
              }
            />
          </span>
        }
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

      {!isJiraConnected && <JiraConnectionPrompt variant="banner" />}

      {/* Persona Context Banner */}
      <PersonaContextBanner role={userRole} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <CollapsibleSection
            title="Sprint Health"
            helpContent={HELP_CONTENT.sprintHealth}
            defaultOpen={true}
            storageKey="qg-sprint-health"
          >
            <SprintHealthSnapshot
              sprintName={currentSprint?.name ?? "Sprint"}
              healthScore={stats.avgScore}
              totalStories={stats.totalStories}
              distribution={distribution}
              trend={{ direction: "up", value: 0 }}
              storiesAtRisk={stats.storiesAtRisk}
            />
          </CollapsibleSection>

          <ScoreDistributionPanel distribution={distribution} />
          <AIInsightsPanel role={userRole} />
          <ScoringDimensionsPanel />
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
                  <div className="px-2 py-1.5 text-sm text-text-tertiary">
                    No sprints found
                  </div>
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

          {/* View summary */}
          <div className="text-xs text-text-tertiary mb-3">
            Showing {stories.length} stories
            <span className="mx-1">•</span>
            <span className="text-text-secondary">{PERSONA_CONFIGS[userRole].label} view</span>
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
