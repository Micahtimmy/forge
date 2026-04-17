"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ScoreRing } from "@/components/ui/score-ring";
import { Badge, getScoreBadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

interface SprintHealthSnapshotProps {
  sprintName: string;
  healthScore: number;
  totalStories: number;
  distribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  trend?: {
    direction: "up" | "down" | "stable";
    value: number;
  };
  storiesAtRisk: number;
  className?: string;
}

export function SprintHealthSnapshot({
  sprintName,
  healthScore,
  totalStories,
  distribution,
  trend,
  storiesAtRisk,
  className,
}: SprintHealthSnapshotProps) {
  const tier = getScoreBadgeVariant(healthScore);

  return (
    <motion.div
      className={cn(
        "bg-surface-01 border border-border rounded-lg p-6",
        className
      )}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={staggerItem} className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{sprintName}</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {totalStories} stories in backlog
          </p>
        </div>
        {trend && (
          <Badge
            variant={trend.direction === "up" ? "excellent" : trend.direction === "down" ? "poor" : "default"}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : trend.direction === "down" ? (
              <TrendingDown className="w-3 h-3 mr-1" />
            ) : null}
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </Badge>
        )}
      </motion.div>

      {/* Health Score Ring */}
      <motion.div variants={staggerItem} className="flex items-center gap-6 mb-6">
        <ScoreRing score={healthScore} size="xl" />
        <div>
          <div className="text-sm text-text-secondary mb-1">Sprint Health</div>
          <div className={cn(
            "text-lg font-semibold",
            tier === "excellent" && "text-jade",
            tier === "good" && "text-iris",
            tier === "fair" && "text-amber",
            tier === "poor" && "text-coral"
          )}>
            {tier === "excellent" && "Excellent"}
            {tier === "good" && "Good"}
            {tier === "fair" && "Needs Work"}
            {tier === "poor" && "Critical"}
          </div>
          {storiesAtRisk > 0 && (
            <div className="flex items-center gap-1 text-amber text-xs mt-2">
              <AlertTriangle className="w-3 h-3" />
              {storiesAtRisk} stories need attention
            </div>
          )}
        </div>
      </motion.div>

      {/* Distribution */}
      <motion.div variants={staggerItem}>
        <div className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-3">
          Score Distribution
        </div>
        <div className="space-y-2">
          <DistributionBar
            label="Excellent (85-100)"
            count={distribution.excellent}
            total={totalStories}
            color="bg-jade"
          />
          <DistributionBar
            label="Good (70-84)"
            count={distribution.good}
            total={totalStories}
            color="bg-iris"
          />
          <DistributionBar
            label="Fair (50-69)"
            count={distribution.fair}
            total={totalStories}
            color="bg-amber"
          />
          <DistributionBar
            label="Poor (0-49)"
            count={distribution.poor}
            total={totalStories}
            color="bg-coral"
          />
        </div>
      </motion.div>

      {/* Recommendation */}
      {storiesAtRisk > 0 && (
        <motion.div
          variants={staggerItem}
          className="mt-4 p-3 rounded-lg bg-amber-dim border border-amber-border"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber">
                {storiesAtRisk} stories below threshold
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Review and improve these stories before sprint planning
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {storiesAtRisk === 0 && (
        <motion.div
          variants={staggerItem}
          className="mt-4 p-3 rounded-lg bg-jade-dim border border-jade-border"
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-jade flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-jade">
                Sprint ready for planning
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                All stories meet quality threshold
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function DistributionBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-text-secondary truncate">{label}</div>
      <div className="flex-1 h-2 bg-surface-03 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="w-8 text-xs font-mono text-text-tertiary text-right">
        {count}
      </div>
    </div>
  );
}
