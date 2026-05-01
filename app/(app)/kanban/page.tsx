"use client";

import { motion } from "framer-motion";
import {
  Clock,
  AlertCircle,
  MoreHorizontal,
  RefreshCw,
  Inbox,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreRing } from "@/components/ui/score-ring";
import { LabelWithInfo, MetricCard } from "@/components/ui/info-tip";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { cn } from "@/lib/utils";
import { useKanbanBoard } from "@/hooks/use-analytics";
import { useAppStore } from "@/stores/app-store";
import type { KanbanColumn } from "@/lib/db/queries/analytics";
import {
  PERSONA_CONFIGS,
  getPersonaInsights,
  HELP_CONTENT,
  type PersonaRole,
} from "@/lib/demo/persona-data";

interface KanbanStory {
  id: string;
  jiraKey: string;
  title: string;
  points: number | null;
  assignee: string | null;
  priority: string | null;
  score: number | null;
  daysInColumn: number;
}

function KanbanCard({ item }: { item: KanbanStory }) {
  const priorityColors: Record<string, string> = {
    Highest: "border-l-coral",
    High: "border-l-coral",
    Medium: "border-l-amber",
    Low: "border-l-text-tertiary",
    Lowest: "border-l-text-tertiary",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-surface-02 border border-border rounded-lg p-3",
        "hover:border-border-strong transition-colors",
        "border-l-2",
        priorityColors[item.priority || ""] || "border-l-text-tertiary"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/quality-gate/story/${item.id}`}
          className="font-mono text-xs text-iris hover:text-iris-light"
        >
          {item.jiraKey}
        </Link>
        <button className="text-text-tertiary hover:text-text-secondary">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-text-primary mb-3 line-clamp-2">{item.title}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {item.assignee ? (
            <div className="w-6 h-6 rounded-full bg-surface-03 flex items-center justify-center">
              <span className="text-xs text-text-secondary">
                {item.assignee[0]}
              </span>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-surface-03 border border-dashed border-border" />
          )}
          {item.points && (
            <Badge variant="default" size="sm">{item.points} pts</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {item.score !== null && (
            <ScoreRing score={item.score} size="xs" />
          )}
          {item.daysInColumn > 0 && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                item.daysInColumn > 3 ? "text-coral" : "text-text-tertiary"
              )}
            >
              <Clock className="w-3 h-3" />
              {item.daysInColumn}d
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function KanbanColumnComponent({
  column,
  wipLimit = null,
}: {
  column: KanbanColumn;
  wipLimit?: number | null;
}) {
  const isOverWip = wipLimit !== null && column.stories.length > wipLimit;
  const isAtWip = wipLimit !== null && column.stories.length === wipLimit;

  return (
    <div className="flex-shrink-0 w-80">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-text-primary">{column.title}</h3>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              isOverWip && "bg-coral-dim text-coral",
              isAtWip && !isOverWip && "bg-amber-dim text-amber",
              !isAtWip && !isOverWip && "bg-surface-03 text-text-tertiary"
            )}
          >
            {column.stories.length}
            {wipLimit && `/${wipLimit}`}
          </span>
        </div>
      </div>

      {isOverWip && (
        <div className="mb-3 p-2 bg-coral-dim border border-coral/20 rounded-lg flex items-center gap-2 text-xs text-coral">
          <AlertCircle className="w-3 h-3" />
          <LabelWithInfo label="WIP limit exceeded" termKey="wip" />
        </div>
      )}

      <div className="space-y-2 min-h-[200px]">
        {column.stories.map((item) => (
          <KanbanCard key={item.id} item={item} />
        ))}
        {column.stories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
            <Inbox className="w-8 h-8 mb-2" />
            <span className="text-sm">No items</span>
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanSkeleton() {
  return (
    <div className="flex gap-4">
      {[1, 2, 3].map((col) => (
        <div key={col} className="w-80 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((card) => (
              <div key={card} className="bg-surface-02 border border-border rounded-lg p-3">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4 mb-3" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Persona Context Banner
function PersonaContextBanner({ role }: { role: PersonaRole }) {
  const config = PERSONA_CONFIGS[role];

  const kanbanRelevance: Record<PersonaRole, string> = {
    developer: "Track your assigned work and see what's coming next in the backlog.",
    scrum_master: "Monitor flow, identify bottlenecks, and manage WIP limits.",
    product_manager: "View backlog priorities and track feature progress.",
    engineering_manager: "Oversee team workload distribution and identify blockers.",
    rte: "Cross-team work visibility and dependency tracking.",
    program_manager: "Portfolio-level work-in-progress and flow metrics.",
    executive: "High-level view of delivery pipeline and throughput.",
  };

  return (
    <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-amber/10 to-transparent border border-amber/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber/20">
            <Layers className="w-5 h-5 text-amber" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-text-primary">{config.label} Kanban</h3>
              <HelpTooltip
                content={
                  <div>
                    <p className="font-medium mb-1">{config.label}</p>
                    <p className="text-slate-300">{kanbanRelevance[role]}</p>
                  </div>
                }
              />
            </div>
            <p className="text-sm text-text-tertiary">{kanbanRelevance[role]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Kanban Insights Panel
function KanbanInsightsPanel({ role, blockedCount, inProgressCount }: { role: PersonaRole; blockedCount: number; inProgressCount: number }) {
  const insights = getPersonaInsights(role).filter(i =>
    i.title.toLowerCase().includes("flow") || i.title.toLowerCase().includes("wip") || i.title.toLowerCase().includes("blocked")
  );

  const kanbanInsights = [...insights];

  if (blockedCount > 0) {
    kanbanInsights.unshift({
      type: "warning" as const,
      title: `${blockedCount} stale items`,
      description: "Items sitting in columns for more than 5 days need attention",
    });
  }

  if (inProgressCount > 5) {
    kanbanInsights.unshift({
      type: "warning" as const,
      title: "WIP limit exceeded",
      description: `${inProgressCount} items in progress exceeds recommended limit of 5`,
    });
  }

  if (kanbanInsights.length === 0) {
    kanbanInsights.push({
      type: "success" as const,
      title: "Flow is healthy",
      description: "No bottlenecks or stale items detected",
    });
  }

  return (
    <CollapsibleSection
      title="Flow Insights"
      helpContent="AI-detected flow issues and recommendations for improving throughput."
      defaultOpen={true}
      storageKey="kanban-flow-insights"
      badge={
        kanbanInsights.some(i => i.type === "warning") ? (
          <Badge variant="fair" size="sm">
            {kanbanInsights.filter(i => i.type === "warning").length} issues
          </Badge>
        ) : (
          <Badge variant="excellent" size="sm">
            <Sparkles className="w-3 h-3 mr-1" />
            Healthy
          </Badge>
        )
      }
    >
      <div className="space-y-2">
        {kanbanInsights.map((insight, index) => (
          <div
            key={index}
            className={cn(
              "p-3 rounded-lg border",
              insight.type === "warning" && "bg-amber/5 border-amber/20",
              insight.type === "success" && "bg-jade/5 border-jade/20",
              insight.type === "info" && "bg-iris/5 border-iris/20"
            )}
          >
            <div className="flex items-start gap-2">
              {insight.type === "warning" && <AlertCircle className="w-4 h-4 text-amber mt-0.5" />}
              {insight.type === "success" && <TrendingUp className="w-4 h-4 text-jade mt-0.5" />}
              {insight.type === "info" && <Sparkles className="w-4 h-4 text-iris mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary">{insight.title}</div>
                <div className="text-xs text-text-tertiary mt-0.5">{insight.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

export default function KanbanPage() {
  const { userRole } = useAppStore();
  const config = PERSONA_CONFIGS[userRole];
  const { data: columns, isLoading, refetch, isRefetching } = useKanbanBoard();

  const totalStories = columns?.reduce((sum, col) => sum + col.stories.length, 0) || 0;
  const inProgressCount = columns?.find((c) => c.id === "in_progress")?.stories.length || 0;
  const blockedCount = columns
    ?.flatMap((c) => c.stories)
    .filter((s) => s.daysInColumn > 5).length || 0;

  return (
    <div>
      <PageHeader
        title="Kanban Board"
        description={
          <span className="flex items-center gap-2">
            Continuous flow view of your work items
            <HelpTooltip
              content={
                <div className="max-w-xs">
                  <p className="font-medium mb-1">Kanban Board</p>
                  <p className="text-slate-300 text-xs">
                    Visualize work flowing through your process. Monitor WIP limits,
                    identify bottlenecks, and optimize throughput.
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
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Persona Context Banner */}
      <PersonaContextBanner role={userRole} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <KanbanInsightsPanel role={userRole} blockedCount={blockedCount} inProgressCount={inProgressCount} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {isLoading ? (
              <>
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </>
            ) : (
              <>
                <MetricCard
                  label="Total Items"
                  value={totalStories}
                />
                <MetricCard
                  label="In Progress"
                  value={inProgressCount}
                  termKey="wip"
                />
                <MetricCard
                  label="Stale Items"
                  value={blockedCount}
                  trend={blockedCount > 0 ? { value: blockedCount, positive: false } : undefined}
                />
                <MetricCard
                  label="Cycle Time"
                  value="-"
                  termKey="cycleTime"
                />
              </>
            )}
          </div>

          {/* Board */}
          <div className="overflow-x-auto pb-4">
            {isLoading ? (
              <KanbanSkeleton />
            ) : columns && columns.length > 0 ? (
              <div className="flex gap-4 min-w-max">
                {columns.map((column) => (
                  <KanbanColumnComponent
                    key={column.id}
                    column={column}
                    wipLimit={column.id === "in_progress" ? 5 : null}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Inbox className="w-16 h-16 text-text-tertiary mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  No stories found
                </h3>
                <p className="text-sm text-text-secondary text-center max-w-md">
                  Sync with JIRA to see your stories on the kanban board.
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-text-tertiary">Priority:</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-l-2 border-coral bg-surface-03" />
                <span className="text-text-secondary">High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-l-2 border-amber bg-surface-03" />
                <span className="text-text-secondary">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-l-2 border-text-tertiary bg-surface-03" />
                <span className="text-text-secondary">Low</span>
              </div>
              <div className="ml-4 flex items-center gap-2 text-text-tertiary">
                <Clock className="w-4 h-4" />
                <span>Days in column</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
