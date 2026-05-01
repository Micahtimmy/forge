"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Zap,
  RefreshCw,
  ArrowUpRight,
  AlertTriangle,
  Brain,
  User,
  Users,
  TrendingUp,
  Target,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
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
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  DEMO_SPRINTS,
  DEMO_STORY_INSIGHTS,
  DEMO_STORY_SLIP_PREDICTIONS,
  DEMO_SPRINT_PREDICTION,
  calculateSprintHealth,
  getScoreDistribution,
} from "@/lib/demo/mock-data";
import {
  PERSONA_STORIES,
  PERSONA_CONFIGS,
  filterStoriesForPersona,
  getPersonaMetrics,
  getPersonaInsights,
  HELP_CONTENT,
  type PersonaRole,
} from "@/lib/demo/persona-data";
import { useDemoStore } from "@/stores/demo-store";
import { StoryInsightCard } from "@/components/system/intelligence/StoryInsightCard";
import { SmartEmptyState } from "@/components/system/feedback/SmartEmptyState";

type ScoreFilter = "all" | "excellent" | "good" | "fair" | "poor";
type ViewMode = "grid" | "list" | "insights";

function StoryCard({ story, index }: { story: (typeof PERSONA_STORIES)[0]; index: number }) {
  const score = story.score?.totalScore ?? 0;
  const hasSuggestions = story.score?.aiSuggestions && story.score.aiSuggestions.length > 0;

  return (
    <Link href={`/demo/quality-gate/story/${story.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg border bg-surface-01",
          "hover:bg-surface-02 hover:border-border-strong cursor-pointer transition-colors",
          score >= 70
            ? "border-border"
            : score >= 50
            ? "border-l-2 border-l-amber border-border"
            : "border-l-2 border-l-coral border-border"
        )}
      >
        <ScoreRing score={score} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-text-tertiary">
              {story.jiraKey}
            </span>
            <Badge variant="default" size="sm">
              {story.status}
            </Badge>
            {story.epicKey && (
              <Badge variant="default" size="sm" className="bg-iris-dim text-iris border-iris/20">
                {story.epicKey}
              </Badge>
            )}
            {hasSuggestions && (
              <Badge variant="fair" size="sm">
                {story.score?.aiSuggestions?.length} suggestions
              </Badge>
            )}
          </div>
          <div className="text-sm font-medium text-text-primary line-clamp-1">
            {story.title}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
            {story.storyPoints && (
              <span>{story.storyPoints} pts</span>
            )}
            {(story as any).assigneeName && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {(story as any).assigneeName}
              </span>
            )}
            {(story as any).team && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {(story as any).team}
              </span>
            )}
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
      </motion.div>
    </Link>
  );
}

function PersonaContextBanner({ role }: { role: PersonaRole }) {
  const config = PERSONA_CONFIGS[role];
  const metrics = getPersonaMetrics(role);
  const insights = getPersonaInsights(role);

  // Get relevant insight for quick display
  const primaryInsight = insights.find(i => i.type === "warning" || i.type === "action");

  return (
    <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-iris/10 to-transparent border border-iris/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-iris/20">
            {role === "developer" && <User className="w-5 h-5 text-iris" />}
            {role === "scrum_master" && <Target className="w-5 h-5 text-iris" />}
            {role === "product_manager" && <BarChart3 className="w-5 h-5 text-iris" />}
            {role === "engineering_manager" && <Users className="w-5 h-5 text-iris" />}
            {role === "rte" && <TrendingUp className="w-5 h-5 text-iris" />}
            {role === "executive" && <TrendingUp className="w-5 h-5 text-iris" />}
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
                      Showing: {config.dataFocus.stories === "assigned" ? "Your assigned stories" :
                        config.dataFocus.stories === "sprint" ? "Current sprint stories" :
                        config.dataFocus.stories === "team" ? "Team stories" :
                        config.dataFocus.stories === "at_risk" ? "At-risk stories" : "All stories"}
                    </p>
                  </div>
                }
              />
            </div>
            <p className="text-sm text-text-tertiary">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {primaryInsight && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
              primaryInsight.type === "warning" ? "bg-amber/10 text-amber" : "bg-iris/10 text-iris"
            )}>
              {primaryInsight.type === "warning" && <AlertTriangle className="w-4 h-4" />}
              {primaryInsight.title}
            </div>
          )}
          <div className="text-right">
            <div className="text-2xl font-bold text-text-primary">{metrics.totalStories}</div>
            <div className="text-xs text-text-tertiary">stories in view</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SprintHealthPanel({ stories, role }: { stories: typeof PERSONA_STORIES; role: PersonaRole }) {
  const health = calculateSprintHealth(stories);
  const distribution = getScoreDistribution(stories);
  const totalPoints = stories.reduce((acc, s) => acc + (s.storyPoints ?? 0), 0);
  const completedPoints = stories
    .filter((s) => s.status === "Done")
    .reduce((acc, s) => acc + (s.storyPoints ?? 0), 0);

  const metrics = getPersonaMetrics(role);

  return (
    <div className="space-y-4">
      <CollapsibleSection
        title="Sprint Health"
        helpContent={HELP_CONTENT.sprintHealth}
        defaultOpen={true}
        storageKey="qg-sprint-health"
        badge={
          <Badge
            variant={health >= 80 ? "good" : health >= 60 ? "fair" : "poor"}
            size="sm"
          >
            {health}%
          </Badge>
        }
      >
        <div className="flex items-center justify-center mb-4">
          <ScoreRing score={health} size="xl" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Total Stories</span>
            <span className="font-mono text-text-primary">{stories.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <HelpInline
              label="Story Points"
              content="Total story points in the sprint. Completed/Total format."
            />
            <span className="font-mono text-text-primary">{completedPoints}/{totalPoints}</span>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Score Distribution"
        helpContent="Breakdown of stories by quality score ranges. Aim for more green, fewer red."
        defaultOpen={true}
        storageKey="qg-score-dist"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-jade" />
              <span className="text-text-secondary">Excellent (85+)</span>
            </div>
            <span className="font-mono text-jade">{distribution.excellent}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-iris" />
              <span className="text-text-secondary">Good (70-84)</span>
            </div>
            <span className="font-mono text-iris">{distribution.good}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber" />
              <span className="text-text-secondary">Fair (50-69)</span>
            </div>
            <span className="font-mono text-amber">{distribution.fair}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-coral" />
              <HelpInline
                label="Poor (<50)"
                content={HELP_CONTENT.atRiskStories}
              />
            </div>
            <span className="font-mono text-coral">{distribution.poor}</span>
          </div>
        </div>
      </CollapsibleSection>

      {/* Role-specific metrics */}
      <CollapsibleSection
        title={`${PERSONA_CONFIGS[role].label} Metrics`}
        helpContent={`Key metrics for your ${PERSONA_CONFIGS[role].label.toLowerCase()} role.`}
        defaultOpen={role !== "executive"}
        storageKey={`qg-${role}-metrics`}
      >
        <div className="space-y-2">
          {role === "developer" && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">My Points</span>
                <span className="font-mono text-text-primary">{(metrics as any).myPoints ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">PR Reviews Pending</span>
                <span className="font-mono text-amber">{(metrics as any).prReviewsPending ?? 0}</span>
              </div>
            </>
          )}
          {role === "scrum_master" && (
            <>
              <div className="flex items-center justify-between text-sm">
                <HelpInline label="Velocity" content={HELP_CONTENT.velocity} />
                <span className="font-mono text-text-primary">{(metrics as any).teamVelocity ?? 0} pts</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Capacity</span>
                <span className="font-mono text-text-primary">{(metrics as any).capacityUtilization ?? 0}%</span>
              </div>
            </>
          )}
          {role === "product_manager" && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Ready for Sprint</span>
                <span className="font-mono text-jade">{(metrics as any).readyForSprint ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Needs Refinement</span>
                <span className="font-mono text-amber">{(metrics as any).needsRefinement ?? 0}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">At Risk</span>
            <span className="font-mono text-coral">{metrics.atRiskCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <HelpInline label="Avg Score" content={HELP_CONTENT.scoreRing} />
            <span className="font-mono text-text-primary">{metrics.averageScore}</span>
          </div>
        </div>
      </CollapsibleSection>

      <div className="pt-2">
        <Link href="/demo/quality-gate/rubrics">
          <Button variant="secondary" size="sm" className="w-full">
            Configure Rubric
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PersonaInsightsPanel({ role }: { role: PersonaRole }) {
  const insights = getPersonaInsights(role);

  if (insights.length === 0) return null;

  return (
    <CollapsibleSection
      title="AI Insights"
      helpContent="AI-generated insights and recommendations based on your role and current data."
      defaultOpen={true}
      storageKey="qg-ai-insights"
      badge={
        <Badge variant="default" size="sm" className="bg-iris/20 text-iris">
          <Brain className="w-3 h-3 mr-1" />
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
              {insight.type === "info" && <Brain className="w-4 h-4 text-iris mt-0.5" />}
              {insight.type === "action" && <Target className="w-4 h-4 text-text-secondary mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary">{insight.title}</div>
                <div className="text-xs text-text-tertiary mt-0.5">{insight.description}</div>
                {insight.action && insight.actionHref && (
                  <Link href={insight.actionHref}>
                    <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">
                      {insight.action}
                      <ArrowUpRight className="w-3 h-3 ml-1" />
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

export default function DemoQualityGatePage() {
  const toast = useToastActions();
  const router = useRouter();
  const { selectedRole } = useDemoStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("insights");
  const [selectedSprint, setSelectedSprint] = useState(DEMO_SPRINTS[0].id);
  const [isScoring, setIsScoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter stories based on persona
  const personaFilteredStories = useMemo(() => {
    return filterStoriesForPersona(PERSONA_STORIES, selectedRole);
  }, [selectedRole]);

  const storiesAtRisk = DEMO_STORY_SLIP_PREDICTIONS.filter(p => p.slipProbability >= 50).length;

  // Apply search and score filters on top of persona filter
  const filteredStories = useMemo(() => {
    return personaFilteredStories.filter((story) => {
      if (searchQuery && !story.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !story.jiraKey.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (scoreFilter !== "all" && story.score) {
        const score = story.score.totalScore;
        switch (scoreFilter) {
          case "excellent": if (score < 85) return false; break;
          case "good": if (score < 70 || score >= 85) return false; break;
          case "fair": if (score < 50 || score >= 70) return false; break;
          case "poor": if (score >= 50) return false; break;
        }
      }
      return true;
    });
  }, [personaFilteredStories, searchQuery, scoreFilter]);

  const handleScoreSprint = async () => {
    setIsScoring(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast.success("Sprint scored", `Analyzed ${filteredStories.length} stories with AI`);
    setIsScoring(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success("Sync complete", "Stories are up to date with JIRA");
    setIsSyncing(false);
  };

  return (
    <div>
      <PageHeader
        title="Quality Gate"
        description={
          <span className="flex items-center gap-2">
            AI-powered story quality analysis with ML slip prediction
            <HelpTooltip
              content={
                <div className="max-w-xs">
                  <p className="font-medium mb-1">Quality Gate</p>
                  <p className="text-slate-300 text-xs">
                    Analyzes your JIRA stories using AI to identify quality issues before they impact your sprint.
                    Each story is scored on 5 dimensions: Completeness, Clarity, Estimability, Traceability, and Testability.
                  </p>
                </div>
              }
            />
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            {/* ML Prediction Badge */}
            {storiesAtRisk > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-coral/10 border border-coral/20">
                <AlertTriangle className="w-4 h-4 text-coral" />
                <span className="text-sm font-medium text-coral">
                  {storiesAtRisk} slip {storiesAtRisk === 1 ? 'risk' : 'risks'}
                </span>
                <HelpTooltip
                  content="ML-predicted stories likely to slip based on historical patterns and current quality scores."
                  side="bottom"
                />
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-iris/10 border border-iris/20">
              <Brain className="w-4 h-4 text-iris" />
              <span className="text-sm font-medium text-iris">
                {DEMO_SPRINT_PREDICTION.projectedCompletion.likely}% predicted
              </span>
              <HelpTooltip
                content="ML prediction of sprint completion based on current velocity, story quality, and historical data."
                side="bottom"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />}
              onClick={handleSync}
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

      {/* Persona Context Banner */}
      <PersonaContextBanner role={selectedRole} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Sprint Health & Insights */}
        <div className="lg:col-span-1 space-y-4">
          <SprintHealthPanel stories={filteredStories} role={selectedRole} />
          <PersonaInsightsPanel role={selectedRole} />
        </div>

        {/* Right: Story List */}
        <div className="lg:col-span-3">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select sprint" />
              </SelectTrigger>
              <SelectContent>
                {DEMO_SPRINTS.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
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
                onClick={() => setViewMode("insights")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "insights"
                    ? "bg-iris/20 text-iris"
                    : "text-text-tertiary hover:text-text-secondary"
                )}
                title="AI Insights View"
              >
                <Brain className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-surface-03 text-text-primary"
                    : "text-text-tertiary hover:text-text-secondary"
                )}
                title="Grid View"
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
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-text-tertiary mb-3">
            Showing {filteredStories.length} of {personaFilteredStories.length} stories
            <span className="mx-2">•</span>
            <span className="text-text-secondary">{PERSONA_CONFIGS[selectedRole].label} view</span>
            {viewMode === "insights" && (
              <span className="ml-2 px-2 py-0.5 rounded bg-iris/10 text-iris text-xs font-medium">
                AI Insights Mode
              </span>
            )}
          </div>

          {/* Insights View (V2 Cards) */}
          {viewMode === "insights" && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {filteredStories.map((story) => {
                const insight = DEMO_STORY_INSIGHTS.find(i => i.storyId === story.id);
                const slipPrediction = DEMO_STORY_SLIP_PREDICTIONS.find(p => p.storyId === story.id);

                const storyInsight = insight || {
                  storyId: story.id,
                  storyKey: story.jiraKey,
                  summary: story.title,
                  score: story.score?.totalScore ?? 0,
                  riskLevel: (story.score?.totalScore ?? 0) >= 70 ? "low" : (story.score?.totalScore ?? 0) >= 50 ? "medium" : "high",
                  slipProbability: slipPrediction?.slipProbability ?? (100 - (story.score?.totalScore ?? 50)),
                  dimensions: [
                    { name: "completeness", score: story.score?.completeness ?? 0, maxScore: 25 },
                    { name: "clarity", score: story.score?.clarity ?? 0, maxScore: 25 },
                    { name: "estimability", score: story.score?.estimability ?? 0, maxScore: 20 },
                  ],
                  suggestions: story.score?.aiSuggestions?.map(s => ({
                    type: s.type === "acceptance_criteria" ? "critical" : "improvement",
                    message: s.improved.substring(0, 100) + "...",
                    action: `Improve ${s.type}`,
                  })) ?? [],
                  predictedBy: "gemini" as const,
                  confidence: 0.85,
                  updatedAt: story.score?.scoredAt ?? new Date().toISOString(),
                };

                return (
                  <motion.div key={story.id} variants={staggerItem}>
                    <StoryInsightCard
                      insight={storyInsight as any}
                      onViewDetails={() => router.push(`/demo/quality-gate/story/${story.id}`)}
                      onRescore={() => toast.success("Re-scoring", `${story.jiraKey} is being analyzed...`)}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* List/Grid View */}
          {(viewMode === "list" || viewMode === "grid") && (
            <motion.div
              className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-2"}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {filteredStories.map((story, index) => (
                <StoryCard key={story.id} story={story} index={index} />
              ))}
            </motion.div>
          )}

          {filteredStories.length === 0 && (
            <SmartEmptyState
              context="stories"
              onSecondaryAction={() => {
                setSearchQuery("");
                setScoreFilter("all");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
