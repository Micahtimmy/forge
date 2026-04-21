"use client";

import {
  CheckCircle2,
  Clock,
  Circle,
  TrendingUp,
  Target,
  Inbox,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/ui/info-tip";
import { AnimatedCard, AnimatedList, AnimatedListItem } from "@/components/ui/animated";
import { cn } from "@/lib/utils";
import { useIndividualStats, useKanbanBoard } from "@/hooks/use-analytics";

function MyWorkSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-surface-02 rounded-lg">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="flex-1 h-4" />
          <Skeleton className="w-12 h-6" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-surface-02 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-2">
        No work assigned
      </h3>
      <p className="text-sm text-text-secondary text-center max-w-md">
        Stories assigned to you will appear here once JIRA is synced.
      </p>
    </div>
  );
}

export default function MyDashboardPage() {
  const { data: stats, isLoading: statsLoading, refetch, isRefetching } = useIndividualStats();
  const { data: kanban, isLoading: kanbanLoading } = useKanbanBoard();

  const isLoading = statsLoading || kanbanLoading;

  const myTodo = kanban?.find((c) => c.id === "todo")?.stories || [];
  const myInProgress = kanban?.find((c) => c.id === "in_progress")?.stories || [];
  const myDone = kanban?.find((c) => c.id === "done")?.stories.slice(0, 5) || [];

  const hasWork = myTodo.length > 0 || myInProgress.length > 0 || myDone.length > 0;

  return (
    <div>
      <PageHeader
        title="My Work"
        description="Your personal dashboard with assigned stories and progress"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefetching && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  label="Stories Done"
                  value={stats?.storiesCompleted || 0}
                  termKey="storyPoints"
                />
                <MetricCard
                  label="Points Delivered"
                  value={stats?.pointsDelivered || 0}
                  termKey="velocity"
                />
                <MetricCard
                  label="Avg Quality"
                  value={stats?.avgQualityScore ? `${stats.avgQualityScore}%` : "-"}
                  termKey="qualityScore"
                />
                <MetricCard
                  label="Active"
                  value={stats?.activeStories || 0}
                />
              </>
            )}
          </div>

          {/* Current Work */}
          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-iris" />
              My Work
            </h3>

            {isLoading ? (
              <MyWorkSkeleton />
            ) : !hasWork ? (
              <EmptyState />
            ) : (
              <>
                {/* In Progress */}
                {myInProgress.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                      <Clock className="w-4 h-4 text-amber" />
                      In Progress ({myInProgress.length})
                    </div>
                    <AnimatedList className="space-y-2">
                      {myInProgress.map((item) => (
                        <AnimatedListItem key={item.id}>
                          <div className="flex items-center justify-between p-3 bg-surface-02 rounded-lg border-l-2 border-amber">
                            <div className="flex-1 min-w-0">
                              <span className="font-mono text-sm text-text-tertiary mr-2">
                                {item.jiraKey}
                              </span>
                              <span className="text-sm text-text-primary truncate">
                                {item.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {item.points && (
                                <Badge variant="default">{item.points} pts</Badge>
                              )}
                              {item.daysInColumn > 0 && (
                                <span className={cn(
                                  "text-xs",
                                  item.daysInColumn > 3 ? "text-coral" : "text-text-tertiary"
                                )}>
                                  Day {item.daysInColumn}
                                </span>
                              )}
                            </div>
                          </div>
                        </AnimatedListItem>
                      ))}
                    </AnimatedList>
                  </div>
                )}

                {/* To Do */}
                {myTodo.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                      <Circle className="w-4 h-4 text-text-tertiary" />
                      To Do ({myTodo.length})
                    </div>
                    <AnimatedList className="space-y-2">
                      {myTodo.slice(0, 5).map((item) => (
                        <AnimatedListItem key={item.id}>
                          <div className="flex items-center justify-between p-3 bg-surface-02 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <span className="font-mono text-sm text-text-tertiary mr-2">
                                {item.jiraKey}
                              </span>
                              <span className="text-sm text-text-primary truncate">
                                {item.title}
                              </span>
                            </div>
                            {item.points && (
                              <Badge variant="default">{item.points} pts</Badge>
                            )}
                          </div>
                        </AnimatedListItem>
                      ))}
                    </AnimatedList>
                  </div>
                )}

                {/* Done Recently */}
                {myDone.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                      <CheckCircle2 className="w-4 h-4 text-jade" />
                      Recently Done ({myDone.length})
                    </div>
                    <AnimatedList className="space-y-2">
                      {myDone.map((item) => (
                        <AnimatedListItem key={item.id}>
                          <div className="flex items-center justify-between p-3 bg-surface-02 rounded-lg border-l-2 border-jade">
                            <div className="flex-1 min-w-0">
                              <span className="font-mono text-sm text-text-tertiary mr-2">
                                {item.jiraKey}
                              </span>
                              <span className="text-sm text-text-primary truncate">
                                {item.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {item.points && (
                                <Badge variant="default">{item.points} pts</Badge>
                              )}
                              {item.score !== null && (
                                <ScoreRing score={item.score} size="xs" />
                              )}
                            </div>
                          </div>
                        </AnimatedListItem>
                      ))}
                    </AnimatedList>
                  </div>
                )}
              </>
            )}
          </AnimatedCard>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-iris" />
              Summary
            </h3>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-surface-02 rounded-lg">
                  <span className="text-sm text-text-secondary">In Progress</span>
                  <span className="text-lg font-semibold text-amber font-mono">
                    {myInProgress.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-02 rounded-lg">
                  <span className="text-sm text-text-secondary">Backlog</span>
                  <span className="text-lg font-semibold text-text-primary font-mono">
                    {myTodo.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-02 rounded-lg">
                  <span className="text-sm text-text-secondary">Blocked</span>
                  <span className={cn(
                    "text-lg font-semibold font-mono",
                    (stats?.blockedItems || 0) > 0 ? "text-coral" : "text-jade"
                  )}>
                    {stats?.blockedItems || 0}
                  </span>
                </div>
              </div>
            )}
          </AnimatedCard>

          {stats?.avgQualityScore && stats.avgQualityScore > 0 && (
            <AnimatedCard className="p-5">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Quality Score</h3>
              <div className="flex items-center justify-center">
                <ScoreRing score={stats.avgQualityScore} size="xl" />
              </div>
              <p className="text-xs text-text-tertiary text-center mt-3">
                Average quality across your completed stories
              </p>
            </AnimatedCard>
          )}
        </div>
      </div>
    </div>
  );
}
