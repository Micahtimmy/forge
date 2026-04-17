"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Send,
  Map,
  AlertTriangle,
  Clock,
  ArrowRight,
  Zap,
  Inbox,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ScoreRing } from "@/components/ui/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { useDashboard } from "@/hooks/use-dashboard";

function StatCard({
  icon,
  label,
  value,
  trend,
  href,
  className,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  trend?: { value: string; positive: boolean };
  href: string;
  className?: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="p-4 rounded-lg border border-border bg-surface-01">
        <div className="flex items-start justify-between">
          <Skeleton className="w-9 h-9 rounded-md" />
        </div>
        <div className="mt-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-24 mt-2" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={staggerItem}>
      <Link
        href={href}
        className={cn(
          "block p-4 rounded-lg border border-border bg-surface-01",
          "hover:bg-surface-02 hover:border-border-strong transition-all",
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-md bg-surface-03">{icon}</div>
          {trend && (
            <Badge variant={trend.positive ? "excellent" : "poor"}>
              {trend.value}
            </Badge>
          )}
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-text-primary">
            {value}
          </div>
          <div className="text-sm text-text-secondary mt-0.5">{label}</div>
        </div>
      </Link>
    </motion.div>
  );
}

function QuickAction({
  icon,
  label,
  description,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <motion.div variants={staggerItem}>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg border border-border bg-surface-01",
          "hover:bg-surface-02 hover:border-border-strong transition-all group"
        )}
      >
        <div className="p-2.5 rounded-md bg-iris-dim text-iris">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary">{label}</div>
          <div className="text-xs text-text-secondary mt-0.5">{description}</div>
        </div>
        <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-iris group-hover:translate-x-1 transition-all" />
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-16 h-16 rounded-full bg-surface-02 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-2">
        No data yet
      </h3>
      <p className="text-sm text-text-secondary text-center max-w-md mb-6">
        Connect your JIRA workspace to start seeing sprint health, story scores,
        and AI-powered insights.
      </p>
      <Link href="/settings/jira">
        <Button>
          Connect JIRA
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </motion.div>
  );
}

function StoryListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-lg border border-border bg-surface-01"
        >
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error, refetch, isRefetching } = useDashboard();

  const hasData = data && (data.recentStories.length > 0 || data.sprintHealth > 0);

  return (
    <div>
      <PageHeader
        title="Welcome back"
        description="Here's what's happening with your program today."
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

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-coral-dim border border-coral-border text-coral text-sm">
          Failed to load dashboard data. Please try again.
        </div>
      )}

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <StatCard
          icon={<ShieldCheck className="w-5 h-5 text-iris" />}
          label="Sprint Health"
          isLoading={isLoading}
          value={
            <div className="flex items-center gap-2">
              <ScoreRing score={data?.sprintHealth || 0} size="sm" showLabel={false} />
              <span>{data?.sprintHealth || 0}</span>
            </div>
          }
          href="/quality-gate"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-amber" />}
          label="Stories at Risk"
          value={data?.storiesAtRisk || 0}
          isLoading={isLoading}
          href="/quality-gate"
        />
        <StatCard
          icon={<Send className="w-5 h-5 text-jade" />}
          label="Updates This Week"
          value={data?.recentUpdatesCount || 0}
          isLoading={isLoading}
          href="/signal"
        />
        <StatCard
          icon={<Map className="w-5 h-5 text-sky" />}
          label="Active PIs"
          value={data?.activePIsCount || 0}
          isLoading={isLoading}
          href="/horizon"
        />
      </motion.div>

      {!isLoading && !hasData ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stories needing attention */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                Stories Needing Attention
              </h2>
              <Link
                href="/quality-gate"
                className="text-sm text-iris hover:text-iris-light"
              >
                View all
              </Link>
            </div>

            {isLoading ? (
              <StoryListSkeleton />
            ) : data?.recentStories && data.recentStories.length > 0 ? (
              <motion.div
                className="space-y-2"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {data.recentStories.map((story) => (
                  <motion.div
                    key={story.id}
                    variants={staggerItem}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border bg-surface-01",
                      story.score === null
                        ? "border-border"
                        : story.score >= 70
                        ? "border-border"
                        : story.score >= 50
                        ? "border-l-2 border-l-amber border-border"
                        : "border-l-2 border-l-coral border-border"
                    )}
                  >
                    <ScoreRing score={story.score || 0} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-text-tertiary">
                          {story.jiraKey}
                        </span>
                        <Badge variant="default" size="sm">
                          {story.status}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium text-text-primary truncate">
                        {story.title}
                      </div>
                    </div>
                    <Link href={`/quality-gate/story/${story.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-8 text-text-secondary text-sm">
                No stories to display. Sync with JIRA to see your backlog.
              </div>
            )}
          </div>

          {/* Right Column - Quick Actions & Deadlines */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Quick Actions
              </h2>
              <motion.div
                className="space-y-2"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <QuickAction
                  icon={<Zap className="w-5 h-5" />}
                  label="Score Sprint Backlog"
                  description="Run AI analysis on current sprint"
                  href="/quality-gate"
                />
                <QuickAction
                  icon={<Send className="w-5 h-5" />}
                  label="Create Update"
                  description="Draft a stakeholder update"
                  href="/signal/new"
                />
                <QuickAction
                  icon={<Map className="w-5 h-5" />}
                  label="Plan Next PI"
                  description="Start PI planning session"
                  href="/horizon"
                />
              </motion.div>
            </div>

            {/* Upcoming Deadlines */}
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Upcoming
              </h2>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : data?.upcomingDeadlines && data.upcomingDeadlines.length > 0 ? (
                <div className="space-y-2">
                  {data.upcomingDeadlines.map((deadline, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-surface-01 border border-border"
                    >
                      <Clock className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm text-text-primary flex-1">
                        {deadline.label}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {deadline.date}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-text-secondary text-sm">
                  No upcoming deadlines
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
