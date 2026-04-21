"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Target, AlertTriangle, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedCard } from "@/components/ui/animated";
import { LabelWithInfo, InfoPanel } from "@/components/ui/info-tip";
import { QualityTrendChart } from "@/components/charts/quality-trend-chart";
import { VelocityChart } from "@/components/charts/velocity-chart";
import { BurndownChart } from "@/components/charts/burndown-chart";
import { TeamRadarChart } from "@/components/charts/team-radar-chart";
import { CapacityChart } from "@/components/charts/capacity-chart";
import { PIConfidenceChart } from "@/components/charts/pi-confidence-chart";
import { cn } from "@/lib/utils";
import {
  DEMO_QUALITY_TREND,
  DEMO_VELOCITY,
  DEMO_BURNDOWN,
  DEMO_TEAM_RADAR,
  DEMO_CAPACITY,
  DEMO_PI_CONFIDENCE,
} from "@/lib/demo/mock-data";

type TabId = "quality" | "velocity" | "team" | "pi";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "quality", label: "Quality Intelligence", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "velocity", label: "Velocity & Burndown", icon: <Target className="w-4 h-4" /> },
  { id: "team", label: "Team Performance", icon: <Users className="w-4 h-4" /> },
  { id: "pi", label: "PI Tracking", icon: <AlertTriangle className="w-4 h-4" /> },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("quality");

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Insights and metrics across your teams and sprints"
        actions={
          <Button variant="secondary" size="sm">
            Export Report
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-02 rounded-lg w-fit mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-surface-04 text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quality Intelligence Tab */}
      {activeTab === "quality" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <InfoPanel termKey="qualityScore" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatedCard className="p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                <LabelWithInfo label="Quality Score Trend" termKey="qualityScore" />
              </h3>
              <QualityTrendChart data={DEMO_QUALITY_TREND} height={280} />
            </AnimatedCard>

            <AnimatedCard className="p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Score Distribution by Sprint
              </h3>
              <div className="space-y-4">
                {DEMO_QUALITY_TREND.slice(-5).map((sprint, i) => {
                  const getColor = (score: number) => {
                    if (score >= 85) return "bg-jade";
                    if (score >= 70) return "bg-iris";
                    if (score >= 50) return "bg-amber";
                    return "bg-coral";
                  };
                  return (
                    <div key={sprint.sprint} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">{sprint.sprint}</span>
                        <span className="font-mono text-text-primary">{sprint.score}%</span>
                      </div>
                      <div className="h-2 bg-surface-03 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${sprint.score}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          className={cn("h-full rounded-full", getColor(sprint.score))}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-jade" />
                  <span className="text-text-tertiary">Excellent (85+)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-iris" />
                  <span className="text-text-tertiary">Good (70-84)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-amber" />
                  <span className="text-text-tertiary">Fair (50-69)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-coral" />
                  <span className="text-text-tertiary">Poor (&lt;50)</span>
                </div>
              </div>
            </AnimatedCard>
          </div>

          {/* Quality Insights */}
          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-iris" />
              Quality Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-jade-dim border border-jade/20 rounded-lg">
                <div className="text-2xl font-semibold text-jade font-mono">+47%</div>
                <div className="text-sm text-text-secondary mt-1">
                  Quality improvement over 8 sprints
                </div>
              </div>
              <div className="p-4 bg-iris-dim border border-iris/20 rounded-lg">
                <div className="text-2xl font-semibold text-iris font-mono">72%</div>
                <div className="text-sm text-text-secondary mt-1">
                  Stories now meet quality threshold
                </div>
              </div>
              <div className="p-4 bg-amber-dim border border-amber/20 rounded-lg">
                <div className="text-2xl font-semibold text-amber font-mono">15%</div>
                <div className="text-sm text-text-secondary mt-1">
                  Acceptance criteria still need work
                </div>
              </div>
            </div>
          </AnimatedCard>
        </motion.div>
      )}

      {/* Velocity Tab */}
      {activeTab === "velocity" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatedCard className="p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                <LabelWithInfo label="Sprint Velocity" termKey="velocity" />
              </h3>
              <VelocityChart data={DEMO_VELOCITY} height={280} />
            </AnimatedCard>

            <AnimatedCard className="p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                <LabelWithInfo label="Sprint Burndown" termKey="burndown" />
              </h3>
              <BurndownChart data={DEMO_BURNDOWN} height={280} totalPoints={32} />
            </AnimatedCard>
          </div>

          <InfoPanel termKey="velocity" />
        </motion.div>
      )}

      {/* Team Tab */}
      {activeTab === "team" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatedCard className="p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Team Comparison
              </h3>
              <TeamRadarChart
                data={DEMO_TEAM_RADAR}
                teams={[
                  { name: "Platform", color: "var(--color-iris)" },
                  { name: "Integrations", color: "var(--color-jade)" },
                  { name: "Analytics", color: "var(--color-amber)" },
                ]}
                height={320}
              />
            </AnimatedCard>

            <AnimatedCard className="p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                <LabelWithInfo label="Team Capacity" termKey="storyPoints" />
              </h3>
              <CapacityChart data={DEMO_CAPACITY} />
            </AnimatedCard>
          </div>

          <InfoPanel termKey="wip" />
        </motion.div>
      )}

      {/* PI Tab */}
      {activeTab === "pi" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <InfoPanel termKey="piConfidence" />

          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              <LabelWithInfo label="PI Objective Confidence" termKey="piConfidence" />
            </h3>
            <PIConfidenceChart
              objectives={DEMO_PI_CONFIDENCE.objectives}
              weeks={DEMO_PI_CONFIDENCE.weeks}
              height={320}
            />
          </AnimatedCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEMO_PI_CONFIDENCE.objectives.map((obj) => {
              const current = obj.data[obj.data.length - 1];
              const isAtRisk = current < 70;
              return (
                <AnimatedCard
                  key={obj.name}
                  className={cn(
                    "p-4",
                    isAtRisk && "border-coral/30 bg-coral-dim"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">{obj.name}</span>
                    {isAtRisk && (
                      <Badge variant="poor">At Risk</Badge>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <span
                      className="text-3xl font-semibold font-mono"
                      style={{ color: obj.color }}
                    >
                      {current}%
                    </span>
                    <span className="text-sm text-text-tertiary mb-1">confidence</span>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
