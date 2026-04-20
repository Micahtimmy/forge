"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import type { StoryWithScore } from "@/types/story";

// Mock data
const mockStories: StoryWithScore[] = [
  {
    id: "1",
    workspaceId: "ws-1",
    jiraId: "10001",
    jiraKey: "PROJ-123",
    title: "Implement user authentication flow with OAuth2",
    description: "As a user, I want to sign in with Google so that I can access my account",
    acceptanceCriteria: "User can sign in with Google OAuth",
    storyPoints: 5,
    status: "In Progress",
    assigneeId: "user-1",
    epicKey: "AUTH",
    sprintId: "sprint-22",
    labels: ["security", "auth"],
    jiraUpdatedAt: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-1",
      storyId: "1",
      rubricId: "rubric-1",
      totalScore: 85,
      completeness: 22,
      clarity: 20,
      estimability: 18,
      traceability: 14,
      testability: 11,
      aiSuggestions: null,
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "2",
    workspaceId: "ws-1",
    jiraId: "10002",
    jiraKey: "PROJ-124",
    title: "Add payment gateway integration",
    description: "Handle payments",
    acceptanceCriteria: null,
    storyPoints: 8,
    status: "To Do",
    assigneeId: null,
    epicKey: "PAYMENTS",
    sprintId: "sprint-22",
    labels: ["payments"],
    jiraUpdatedAt: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-2",
      storyId: "2",
      rubricId: "rubric-1",
      totalScore: 42,
      completeness: 10,
      clarity: 8,
      estimability: 12,
      traceability: 8,
      testability: 4,
      aiSuggestions: [
        {
          type: "acceptance_criteria",
          current: "",
          improved: "Given a user is on the checkout page, when they enter valid payment details and click Pay, then the payment is processed within 5 seconds and a confirmation is shown",
        },
      ],
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "3",
    workspaceId: "ws-1",
    jiraId: "10003",
    jiraKey: "PROJ-125",
    title: "Create dashboard analytics with charts and KPIs",
    description: "As a product manager, I want to see key metrics on the dashboard so I can make data-driven decisions",
    acceptanceCriteria: "Dashboard shows DAU, WAU, MAU metrics with trend charts",
    storyPoints: 3,
    status: "To Do",
    assigneeId: "user-2",
    epicKey: "ANALYTICS",
    sprintId: "sprint-22",
    labels: ["analytics", "dashboard"],
    jiraUpdatedAt: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-3",
      storyId: "3",
      rubricId: "rubric-1",
      totalScore: 72,
      completeness: 18,
      clarity: 17,
      estimability: 15,
      traceability: 12,
      testability: 10,
      aiSuggestions: null,
      scoredAt: new Date().toISOString(),
    },
  },
  {
    id: "4",
    workspaceId: "ws-1",
    jiraId: "10004",
    jiraKey: "PROJ-126",
    title: "Implement email notification system",
    description: "Send emails for important events",
    acceptanceCriteria: "Emails are sent",
    storyPoints: 5,
    status: "To Do",
    assigneeId: null,
    epicKey: "NOTIFICATIONS",
    sprintId: "sprint-22",
    labels: ["notifications"],
    jiraUpdatedAt: new Date().toISOString(),
    syncedAt: new Date().toISOString(),
    score: {
      id: "score-4",
      storyId: "4",
      rubricId: "rubric-1",
      totalScore: 58,
      completeness: 14,
      clarity: 12,
      estimability: 14,
      traceability: 10,
      testability: 8,
      aiSuggestions: [
        {
          type: "description",
          current: "Send emails for important events",
          improved: "As a user, I want to receive email notifications for account-related events (password changes, login from new device, payment confirmations) so I stay informed about my account activity",
        },
      ],
      scoredAt: new Date().toISOString(),
    },
  },
];

const sprints = [
  { id: "sprint-22", name: "Sprint 22", startDate: "2026-04-13", endDate: "2026-04-27" },
  { id: "sprint-21", name: "Sprint 21", startDate: "2026-03-30", endDate: "2026-04-12" },
  { id: "sprint-20", name: "Sprint 20", startDate: "2026-03-16", endDate: "2026-03-29" },
];

export default function QualityGatePage() {
  const toast = useToastActions();
  const {
    searchQuery,
    setSearchQuery,
    scoreFilter,
    setScoreFilter,
    viewMode,
    setViewMode,
    isScoring,
    setIsScoring,
  } = useQualityGateStore();

  const [selectedSprint, setSelectedSprint] = useState(sprints[0].id);
  const [isLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter stories
  const filteredStories = mockStories.filter((story) => {
    if (searchQuery && !story.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (scoreFilter !== "all" && story.score) {
      const score = story.score.totalScore;
      switch (scoreFilter) {
        case "excellent":
          if (score < 85) return false;
          break;
        case "good":
          if (score < 70 || score >= 85) return false;
          break;
        case "fair":
          if (score < 50 || score >= 70) return false;
          break;
        case "poor":
          if (score >= 50) return false;
          break;
      }
    }
    return true;
  });

  // Calculate distribution
  const distribution = {
    excellent: mockStories.filter((s) => (s.score?.totalScore ?? 0) >= 85).length,
    good: mockStories.filter((s) => {
      const score = s.score?.totalScore ?? 0;
      return score >= 70 && score < 85;
    }).length,
    fair: mockStories.filter((s) => {
      const score = s.score?.totalScore ?? 0;
      return score >= 50 && score < 70;
    }).length,
    poor: mockStories.filter((s) => (s.score?.totalScore ?? 0) < 50).length,
  };

  const avgScore = Math.round(
    mockStories.reduce((acc, s) => acc + (s.score?.totalScore ?? 0), 0) / mockStories.length
  );

  const handleScoreSprint = async () => {
    setIsScoring(true);
    try {
      // Simulate scoring - in real app, this would call the AI scoring API
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(
        "Sprint scored",
        `Successfully analyzed ${mockStories.length} stories`
      );
    } catch {
      toast.error(
        "Scoring failed",
        "Unable to score stories. Please try again."
      );
    } finally {
      setIsScoring(false);
    }
  };

  const handleSyncJira = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/jira/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey: "PROJ", // In real app, this would come from workspace settings
          fullSync: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sync failed");
      }

      toast.success(
        "JIRA sync complete",
        `Synced ${data.stories?.synced ?? 0} stories`
      );
    } catch (error) {
      toast.error(
        "Sync failed",
        error instanceof Error ? error.message : "Unable to sync with JIRA"
      );
    } finally {
      setIsSyncing(false);
    }
  };

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
              leftIcon={<RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />}
              onClick={handleSyncJira}
              disabled={isSyncing}
            >
              {isSyncing ? "Syncing..." : "Sync JIRA"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Zap className="w-4 h-4" />}
              onClick={handleScoreSprint}
              isLoading={isScoring}
            >
              Score Sprint
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Sprint Health */}
        <div className="lg:col-span-1">
          <SprintHealthSnapshot
            sprintName={sprints.find((s) => s.id === selectedSprint)?.name ?? "Sprint"}
            healthScore={avgScore}
            totalStories={mockStories.length}
            distribution={distribution}
            trend={{ direction: "up", value: 5 }}
            storiesAtRisk={distribution.poor + distribution.fair}
          />
        </div>

        {/* Right: Story List */}
        <div className="lg:col-span-3">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            {/* Sprint Selector */}
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select sprint" />
              </SelectTrigger>
              <SelectContent>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="flex-1 max-w-xs">
              <Input
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Score Filter */}
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

            {/* View Toggle */}
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

          {/* Story List */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonStoryCard key={i} />
              ))}
            </div>
          ) : filteredStories.length === 0 ? (
            <EmptyStoriesState />
          ) : (
            <motion.div
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {filteredStories.map((story, index) => (
                <motion.div key={story.id} variants={staggerItem}>
                  <StoryCard story={story} delay={index * 50} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
