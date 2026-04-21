"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Circle,
  TrendingUp,
  Award,
  Lightbulb,
  Target,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { LabelWithInfo, MetricCard } from "@/components/ui/info-tip";
import { AnimatedCard, AnimatedList, AnimatedListItem } from "@/components/ui/animated";
import { cn } from "@/lib/utils";
import { DEMO_INDIVIDUAL_STATS } from "@/lib/demo/mock-data";

function ContributionChart() {
  const data = DEMO_INDIVIDUAL_STATS.sprintHistory;
  const maxPoints = Math.max(...data.map((d) => d.points));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 text-xs text-text-tertiary text-center">
        {data.map((d) => (
          <div key={d.sprint}>{d.sprint}</div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {data.map((d, i) => (
          <motion.div
            key={d.sprint}
            initial={{ height: 0 }}
            animate={{ height: `${(d.points / maxPoints) * 100}%` }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="w-full bg-surface-03 rounded-t-sm relative" style={{ height: 80 }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.points / maxPoints) * 100}%` }}
                transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                className="absolute bottom-0 left-0 right-0 bg-iris rounded-t-sm"
              />
            </div>
            <div className="mt-2 text-sm font-mono text-text-primary">{d.points}</div>
            <div className="text-xs text-text-tertiary">pts</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function MyDashboardPage() {
  const stats = DEMO_INDIVIDUAL_STATS;

  return (
    <div>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-iris flex items-center justify-center">
              <span className="text-white font-bold">
                {stats.name.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>
            <div>
              <span className="text-text-primary">{stats.name}</span>
              <div className="text-sm text-text-secondary">{stats.role} - {stats.team}</div>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Work */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Stories"
              value={stats.currentPI.storiesCompleted}
              termKey="storyPoints"
              trend={{ value: 12 }}
            />
            <MetricCard
              label="Points"
              value={stats.currentPI.pointsDelivered}
              termKey="velocity"
              trend={{ value: 8 }}
            />
            <MetricCard
              label="Avg Quality"
              value={`${stats.currentPI.avgQuality}%`}
              termKey="qualityScore"
              trend={{ value: 5 }}
            />
            <MetricCard
              label="PR Reviews"
              value={stats.currentPI.prReviews}
              trend={{ value: 15 }}
            />
          </div>

          {/* Current Work */}
          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-iris" />
              My Work
            </h3>

            {/* In Progress */}
            {stats.currentWork.inProgress.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <Clock className="w-4 h-4 text-amber" />
                  In Progress
                </div>
                <AnimatedList className="space-y-2">
                  {stats.currentWork.inProgress.map((item) => (
                    <AnimatedListItem key={item.key}>
                      <div className="flex items-center justify-between p-3 bg-surface-02 rounded-lg border-l-2 border-amber">
                        <div>
                          <span className="font-mono text-sm text-text-tertiary mr-2">
                            {item.key}
                          </span>
                          <span className="text-sm text-text-primary">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="default">{item.points} pts</Badge>
                          <span className="text-xs text-text-tertiary">Day {item.daysIn}</span>
                        </div>
                      </div>
                    </AnimatedListItem>
                  ))}
                </AnimatedList>
              </div>
            )}

            {/* To Do */}
            {stats.currentWork.toDo.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <Circle className="w-4 h-4 text-text-tertiary" />
                  To Do
                </div>
                <AnimatedList className="space-y-2">
                  {stats.currentWork.toDo.map((item) => (
                    <AnimatedListItem key={item.key}>
                      <div className="flex items-center justify-between p-3 bg-surface-02 rounded-lg">
                        <div>
                          <span className="font-mono text-sm text-text-tertiary mr-2">
                            {item.key}
                          </span>
                          <span className="text-sm text-text-primary">{item.title}</span>
                        </div>
                        <Badge variant="default">{item.points} pts</Badge>
                      </div>
                    </AnimatedListItem>
                  ))}
                </AnimatedList>
              </div>
            )}

            {/* Done This Sprint */}
            {stats.currentWork.doneThisSprint.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <CheckCircle2 className="w-4 h-4 text-jade" />
                  Done This Sprint
                </div>
                <AnimatedList className="space-y-2">
                  {stats.currentWork.doneThisSprint.map((item) => (
                    <AnimatedListItem key={item.key}>
                      <div className="flex items-center justify-between p-3 bg-surface-02 rounded-lg border-l-2 border-jade">
                        <div>
                          <span className="font-mono text-sm text-text-tertiary mr-2">
                            {item.key}
                          </span>
                          <span className="text-sm text-text-primary">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="default">{item.points} pts</Badge>
                          <ScoreRing score={item.score} size="xs" />
                        </div>
                      </div>
                    </AnimatedListItem>
                  ))}
                </AnimatedList>
              </div>
            )}
          </AnimatedCard>

          {/* Contribution Chart */}
          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-iris" />
              <LabelWithInfo label="My Contributions" termKey="velocity" />
            </h3>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {stats.sprintHistory.map((s) => (
                <div key={s.sprint} className="text-center">
                  <div className="text-xs text-text-tertiary mb-1">Quality</div>
                  <div className={cn(
                    "text-sm font-mono",
                    s.quality >= 85 ? "text-jade" :
                    s.quality >= 70 ? "text-iris" : "text-amber"
                  )}>
                    {s.quality}%
                  </div>
                </div>
              ))}
            </div>
            <ContributionChart />
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-semibold text-text-primary font-mono">
                    {stats.sprintHistory.reduce((sum, s) => sum + s.points, 0)}
                  </div>
                  <div className="text-xs text-text-tertiary">Total Points</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-text-primary font-mono">
                    {Math.round(stats.sprintHistory.reduce((sum, s) => sum + s.quality, 0) / stats.sprintHistory.length)}%
                  </div>
                  <div className="text-xs text-text-tertiary">Avg Quality</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-text-primary font-mono">
                    {stats.sprintHistory.reduce((sum, s) => sum + s.reviews, 0)}
                  </div>
                  <div className="text-xs text-text-tertiary">PR Reviews</div>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Right Column - Insights */}
        <div className="space-y-6">
          {/* PI Ranking */}
          <AnimatedCard className="p-5">
            <h3 className="text-sm font-medium text-text-secondary mb-3">PI 2026.2 Ranking</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Award className="w-16 h-16 text-amber" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-text-primary mt-2">
                    #{stats.currentPI.rank}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-text-secondary text-center">
              in ART by points delivered
            </p>
          </AnimatedCard>

          {/* Strengths */}
          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-jade" />
              Strengths
            </h3>
            <AnimatedList className="space-y-3">
              {stats.strengths.map((strength, i) => (
                <AnimatedListItem key={i}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-jade mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-text-secondary">{strength}</span>
                  </div>
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </AnimatedCard>

          {/* AI Insights */}
          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber" />
              AI Insights
            </h3>
            <AnimatedList className="space-y-3">
              {stats.aiInsights.map((insight, i) => (
                <AnimatedListItem key={i}>
                  <div className="flex items-start gap-2 p-3 bg-amber-dim rounded-lg border border-amber/20">
                    <Lightbulb className="w-4 h-4 text-amber mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-text-primary">{insight}</span>
                  </div>
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </AnimatedCard>

          {/* Growth Areas */}
          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-iris" />
              Growth Areas
            </h3>
            <AnimatedList className="space-y-3">
              {stats.growthAreas.map((area, i) => (
                <AnimatedListItem key={i}>
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-iris mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-text-secondary">{area}</span>
                  </div>
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
}
