"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  Send,
  Map,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { ScoreRing } from "@/components/ui/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  DEMO_STORIES,
  DEMO_UPDATES,
  DEMO_PIS,
  DEMO_TEAM,
  calculateSprintHealth,
  getScoreDistribution,
  getStoriesAtRisk,
} from "@/lib/demo/mock-data";
import { formatDistanceToNow } from "date-fns";

const sprintHealth = calculateSprintHealth(DEMO_STORIES);
const distribution = getScoreDistribution(DEMO_STORIES);
const storiesAtRisk = getStoriesAtRisk(DEMO_STORIES);
const activePIs = DEMO_PIS.filter((pi) => pi.status === "active");

function StatCard({
  icon,
  label,
  value,
  trend,
  href,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  trend?: { direction: "up" | "down"; value: number };
  href?: string;
  className?: string;
}) {
  const content = (
    <div
      className={cn(
        "block p-4 rounded-lg border border-border bg-surface-01",
        href && "hover:bg-surface-02 hover:border-border-strong cursor-pointer",
        "transition-all",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-md bg-surface-03">{icon}</div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.direction === "up" ? "text-jade" : "text-coral"
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold font-mono text-text-primary">
          {value}
        </div>
        <div className="text-sm text-text-secondary mt-0.5">{label}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <motion.div variants={staggerItem}>
        <Link href={href}>{content}</Link>
      </motion.div>
    );
  }

  return <motion.div variants={staggerItem}>{content}</motion.div>;
}

function StoryRow({ story }: { story: (typeof DEMO_STORIES)[0] }) {
  const score = story.score?.totalScore ?? 0;

  return (
    <Link href={`/demo/quality-gate/story/${story.id}`}>
      <div
        className={cn(
          "flex items-center gap-4 p-3 rounded-lg border bg-surface-01",
          "hover:bg-surface-02 hover:border-border-strong cursor-pointer transition-colors",
          score >= 70
            ? "border-border"
            : score >= 50
            ? "border-l-2 border-l-amber border-border"
            : "border-l-2 border-l-coral border-border"
        )}
      >
        <ScoreRing score={score} size="sm" />
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
        <ArrowRight className="w-4 h-4 text-text-tertiary" />
      </div>
    </Link>
  );
}

function UpdateRow({ update }: { update: (typeof DEMO_UPDATES)[0] }) {
  return (
    <Link href={`/demo/signal/${update.id}`}>
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border bg-surface-01",
          "hover:bg-surface-02 hover:border-border-strong cursor-pointer transition-colors"
        )}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            update.status === "sent" ? "bg-jade-dim" : "bg-amber-dim"
          )}
        >
          {update.status === "sent" ? (
            <CheckCircle2 className="w-4 h-4 text-jade" />
          ) : (
            <Clock className="w-4 h-4 text-amber" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">
            {update.title}
          </div>
          <div className="text-xs text-text-tertiary">
            {update.sentAt
              ? `Sent ${formatDistanceToNow(new Date(update.sentAt), { addSuffix: true })}`
              : `Draft - ${formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}`}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DemoDashboard() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Welcome back, Demo User
        </h1>
        <p className="text-text-secondary mt-1">
          Here&apos;s what&apos;s happening in your workspace today.
        </p>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <StatCard
          icon={<ShieldCheck className="w-5 h-5 text-iris" />}
          label="Sprint Health Score"
          value={
            <div className="flex items-center gap-2">
              <ScoreRing score={sprintHealth} size="sm" showLabel={false} />
              <span>{sprintHealth}</span>
            </div>
          }
          trend={{ direction: "up", value: 8 }}
          href="/demo/quality-gate"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-amber" />}
          label="Stories at Risk"
          value={storiesAtRisk.length}
          href="/demo/quality-gate"
        />
        <StatCard
          icon={<Send className="w-5 h-5 text-jade" />}
          label="Updates This Sprint"
          value={DEMO_UPDATES.filter((u) => u.status === "sent").length}
          href="/demo/signal"
        />
        <StatCard
          icon={<Map className="w-5 h-5 text-sky" />}
          label="Active PIs"
          value={activePIs.length}
          href="/demo/horizon"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stories needing attention */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stories at Risk */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Stories Needing Attention
              </h2>
              <Link href="/demo/quality-gate">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <motion.div
              className="space-y-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {storiesAtRisk.slice(0, 5).map((story) => (
                <motion.div key={story.id} variants={staggerItem}>
                  <StoryRow story={story} />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Score Distribution */}
          <div className="bg-surface-01 border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text-primary mb-4">
              Sprint Score Distribution
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-full h-2 rounded-full bg-jade/20 mb-2">
                  <div
                    className="h-full rounded-full bg-jade"
                    style={{ width: `${(distribution.excellent / DEMO_STORIES.length) * 100}%` }}
                  />
                </div>
                <div className="text-lg font-bold text-jade">{distribution.excellent}</div>
                <div className="text-xs text-text-tertiary">Excellent</div>
              </div>
              <div className="text-center">
                <div className="w-full h-2 rounded-full bg-iris/20 mb-2">
                  <div
                    className="h-full rounded-full bg-iris"
                    style={{ width: `${(distribution.good / DEMO_STORIES.length) * 100}%` }}
                  />
                </div>
                <div className="text-lg font-bold text-iris">{distribution.good}</div>
                <div className="text-xs text-text-tertiary">Good</div>
              </div>
              <div className="text-center">
                <div className="w-full h-2 rounded-full bg-amber/20 mb-2">
                  <div
                    className="h-full rounded-full bg-amber"
                    style={{ width: `${(distribution.fair / DEMO_STORIES.length) * 100}%` }}
                  />
                </div>
                <div className="text-lg font-bold text-amber">{distribution.fair}</div>
                <div className="text-xs text-text-tertiary">Fair</div>
              </div>
              <div className="text-center">
                <div className="w-full h-2 rounded-full bg-coral/20 mb-2">
                  <div
                    className="h-full rounded-full bg-coral"
                    style={{ width: `${(distribution.poor / DEMO_STORIES.length) * 100}%` }}
                  />
                </div>
                <div className="text-lg font-bold text-coral">{distribution.poor}</div>
                <div className="text-xs text-text-tertiary">Poor</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Recent Updates */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link href="/demo/quality-gate">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-01 hover:bg-surface-02 hover:border-border-strong cursor-pointer transition-colors">
                  <div className="p-2 rounded-md bg-iris-dim">
                    <Zap className="w-4 h-4 text-iris" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">Score Sprint</div>
                    <div className="text-xs text-text-tertiary">Run AI analysis</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-tertiary" />
                </div>
              </Link>
              <Link href="/demo/signal/new">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-01 hover:bg-surface-02 hover:border-border-strong cursor-pointer transition-colors">
                  <div className="p-2 rounded-md bg-jade-dim">
                    <Send className="w-4 h-4 text-jade" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">Create Update</div>
                    <div className="text-xs text-text-tertiary">Draft a stakeholder update</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-tertiary" />
                </div>
              </Link>
              <Link href="/demo/horizon">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-01 hover:bg-surface-02 hover:border-border-strong cursor-pointer transition-colors">
                  <div className="p-2 rounded-md bg-sky-dim">
                    <Map className="w-4 h-4 text-sky" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">PI Planning</div>
                    <div className="text-xs text-text-tertiary">View active program increment</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-tertiary" />
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Updates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Recent Updates
              </h2>
              <Link href="/demo/signal">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            <div className="space-y-2">
              {DEMO_UPDATES.slice(0, 3).map((update) => (
                <UpdateRow key={update.id} update={update} />
              ))}
            </div>
          </div>

          {/* Team */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Team</h2>
              <Link href="/demo/settings/team">
                <Button variant="ghost" size="sm">Manage</Button>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {DEMO_TEAM.slice(0, 4).map((member) => (
                  <div
                    key={member.id}
                    className="w-8 h-8 rounded-full bg-surface-03 border-2 border-surface-01 flex items-center justify-center"
                    title={member.name}
                  >
                    <span className="text-xs font-medium text-text-secondary">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                ))}
              </div>
              {DEMO_TEAM.length > 4 && (
                <span className="text-sm text-text-tertiary">
                  +{DEMO_TEAM.length - 4} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
