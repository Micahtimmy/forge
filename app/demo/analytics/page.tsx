"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Target, AlertTriangle, Info, Brain, Building2, Zap } from "lucide-react";
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
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  DEMO_QUALITY_TREND,
  DEMO_VELOCITY,
  DEMO_BURNDOWN,
  DEMO_TEAM_RADAR,
  DEMO_CAPACITY,
  DEMO_PI_CONFIDENCE,
  DEMO_EXECUTIVE_SUMMARY,
  DEMO_WORKSPACE_COMPARISON,
  DEMO_VELOCITY_FORECAST,
  DEMO_RISK_AGGREGATION,
  DEMO_CAPACITY_INTELLIGENCE,
  DEMO_SPRINT_PREDICTION,
} from "@/lib/demo/mock-data";

type TabId = "executive" | "ml" | "quality" | "velocity" | "team" | "pi";

const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: "executive", label: "Executive View", icon: <Building2 className="w-4 h-4" />, badge: "New" },
  { id: "ml", label: "ML Predictions", icon: <Brain className="w-4 h-4" />, badge: "AI" },
  { id: "quality", label: "Quality Intelligence", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "velocity", label: "Velocity & Burndown", icon: <Target className="w-4 h-4" /> },
  { id: "team", label: "Team Performance", icon: <Users className="w-4 h-4" /> },
  { id: "pi", label: "PI Tracking", icon: <AlertTriangle className="w-4 h-4" /> },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("executive");

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
      <div className="flex flex-wrap gap-1 p-1 bg-surface-02 rounded-lg w-fit mb-6">
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
            {tab.badge && (
              <span className={cn(
                "px-1.5 py-0.5 rounded text-xs font-medium",
                tab.badge === "AI" ? "bg-iris/20 text-iris" : "bg-jade/20 text-jade"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Executive View Tab */}
      {activeTab === "executive" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Executive Summary Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={staggerItem}>
              <AnimatedCard className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">Total Workspaces</span>
                  <Building2 className="w-4 h-4 text-iris" />
                </div>
                <div className="text-3xl font-semibold font-mono text-text-primary">
                  {DEMO_EXECUTIVE_SUMMARY.totalWorkspaces}
                </div>
              </AnimatedCard>
            </motion.div>
            <motion.div variants={staggerItem}>
              <AnimatedCard className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">Total Sprints</span>
                  <Target className="w-4 h-4 text-jade" />
                </div>
                <div className="text-3xl font-semibold font-mono text-jade">
                  {DEMO_EXECUTIVE_SUMMARY.totalSprints}
                </div>
              </AnimatedCard>
            </motion.div>
            <motion.div variants={staggerItem}>
              <AnimatedCard className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">Avg Quality Score</span>
                  <TrendingUp className="w-4 h-4 text-iris" />
                </div>
                <div className="text-3xl font-semibold font-mono text-iris">
                  {DEMO_EXECUTIVE_SUMMARY.averageQualityScore}
                </div>
              </AnimatedCard>
            </motion.div>
            <motion.div variants={staggerItem}>
              <AnimatedCard className={cn("p-5", DEMO_EXECUTIVE_SUMMARY.atRiskSprints > 0 && "border-coral/30")}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">At-Risk Sprints</span>
                  <AlertTriangle className={cn("w-4 h-4", DEMO_EXECUTIVE_SUMMARY.atRiskSprints > 0 ? "text-coral" : "text-jade")} />
                </div>
                <div className={cn(
                  "text-3xl font-semibold font-mono",
                  DEMO_EXECUTIVE_SUMMARY.atRiskSprints > 0 ? "text-coral" : "text-jade"
                )}>
                  {DEMO_EXECUTIVE_SUMMARY.atRiskSprints}
                </div>
              </AnimatedCard>
            </motion.div>
          </motion.div>

          {/* Workspace Comparison */}
          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Workspace Performance Comparison
            </h3>
            <div className="space-y-4">
              {DEMO_WORKSPACE_COMPARISON.map((workspace) => (
                <div key={workspace.workspaceId} className="p-4 bg-surface-02 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-iris/20 flex items-center justify-center">
                        <span className="text-sm font-semibold text-iris">
                          {workspace.workspaceName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{workspace.workspaceName}</p>
                        <p className="text-sm text-text-tertiary">{workspace.metrics.storyCount} stories this sprint</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-text-tertiary">Quality</p>
                        <p className={cn(
                          "font-mono font-semibold",
                          workspace.metrics.avgQualityScore >= 70 ? "text-jade" : workspace.metrics.avgQualityScore >= 50 ? "text-amber" : "text-coral"
                        )}>
                          {workspace.metrics.avgQualityScore}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-tertiary">Velocity</p>
                        <p className="font-mono font-semibold text-text-primary">{workspace.metrics.velocity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-tertiary">Success Rate</p>
                        <Badge variant={workspace.metrics.sprintSuccessRate >= 85 ? "good" : workspace.metrics.sprintSuccessRate >= 70 ? "fair" : "poor"}>
                          {workspace.metrics.sprintSuccessRate}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-text-tertiary">Quality Trend</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "font-mono font-semibold",
                          workspace.metrics.qualityTrend > 0 ? "text-jade" : workspace.metrics.qualityTrend < 0 ? "text-coral" : "text-text-primary"
                        )}>
                          {workspace.metrics.qualityTrend > 0 ? '+' : ''}{workspace.metrics.qualityTrend}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-text-tertiary">Team Size</p>
                      <p className="font-semibold text-text-primary">
                        {workspace.metrics.teamSize} members
                      </p>
                    </div>
                    <div>
                      <p className="text-text-tertiary">Ranking</p>
                      <p className="text-text-primary">#{workspace.ranking.overall} overall</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedCard>

          {/* Risk Aggregation */}
          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-coral" />
              Cross-Workspace Risk Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-coral/10 border border-coral/20 rounded-lg">
                <p className="text-xs text-coral uppercase font-medium">Critical</p>
                <p className="text-2xl font-semibold font-mono text-coral mt-1">
                  {DEMO_RISK_AGGREGATION.bySeverity.critical}
                </p>
              </div>
              <div className="p-4 bg-coral/5 border border-coral/10 rounded-lg">
                <p className="text-xs text-coral-light uppercase font-medium">High</p>
                <p className="text-2xl font-semibold font-mono text-coral-light mt-1">
                  {DEMO_RISK_AGGREGATION.bySeverity.high}
                </p>
              </div>
              <div className="p-4 bg-amber/10 border border-amber/20 rounded-lg">
                <p className="text-xs text-amber uppercase font-medium">Medium</p>
                <p className="text-2xl font-semibold font-mono text-amber mt-1">
                  {DEMO_RISK_AGGREGATION.bySeverity.medium}
                </p>
              </div>
              <div className="p-4 bg-jade/10 border border-jade/20 rounded-lg">
                <p className="text-xs text-jade uppercase font-medium">Low</p>
                <p className="text-2xl font-semibold font-mono text-jade mt-1">
                  {DEMO_RISK_AGGREGATION.bySeverity.low}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-text-secondary mb-3">Risk Types</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(DEMO_RISK_AGGREGATION.byType).map(([type, count]) => (
                  <span key={type} className="px-3 py-1.5 bg-surface-02 rounded-lg text-sm">
                    <span className="text-text-secondary capitalize">{type.replace('_', ' ')}: </span>
                    <span className="font-mono text-text-primary">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </AnimatedCard>
        </motion.div>
      )}

      {/* ML Predictions Tab */}
      {activeTab === "ml" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* ML Header */}
          <div className="flex items-center gap-3 p-4 bg-iris/10 border border-iris/20 rounded-lg">
            <Brain className="w-6 h-6 text-iris" />
            <div>
              <p className="font-medium text-text-primary">Machine Learning Predictions</p>
              <p className="text-sm text-text-secondary">
                AI-powered forecasts based on historical patterns and current sprint data
              </p>
            </div>
          </div>

          {/* Sprint Prediction */}
          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-iris" />
              Sprint Failure Risk Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-secondary">Likely Completion</p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className={cn(
                      "text-4xl font-semibold font-mono",
                      DEMO_SPRINT_PREDICTION.projectedCompletion.likely >= 80 ? "text-jade" :
                      DEMO_SPRINT_PREDICTION.projectedCompletion.likely >= 60 ? "text-amber" : "text-coral"
                    )}>
                      {DEMO_SPRINT_PREDICTION.projectedCompletion.likely}%
                    </span>
                    <span className="text-text-tertiary mb-1">of committed work</span>
                  </div>
                </div>
                <div className="h-3 bg-surface-03 rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      DEMO_SPRINT_PREDICTION.projectedCompletion.likely >= 80 ? "bg-jade" :
                      DEMO_SPRINT_PREDICTION.projectedCompletion.likely >= 60 ? "bg-amber" : "bg-coral"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${DEMO_SPRINT_PREDICTION.projectedCompletion.likely}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-iris/10 text-iris text-xs font-medium rounded">
                    {Math.round(DEMO_SPRINT_PREDICTION.confidence * 100)}% confidence
                  </span>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    (DEMO_SPRINT_PREDICTION.riskLevel as string) === "high" ? "bg-coral/20 text-coral" :
                    (DEMO_SPRINT_PREDICTION.riskLevel as string) === "medium" ? "bg-amber/20 text-amber" : "bg-jade/20 text-jade"
                  )}>
                    {DEMO_SPRINT_PREDICTION.riskLevel} risk
                  </span>
                </div>
                <div className="text-xs text-text-tertiary">
                  Range: {DEMO_SPRINT_PREDICTION.projectedCompletion.pessimistic}% - {DEMO_SPRINT_PREDICTION.projectedCompletion.optimistic}%
                </div>
              </div>

              <div className="col-span-2">
                <p className="text-sm text-text-secondary mb-3">Contributing Factors</p>
                <div className="space-y-2">
                  {DEMO_SPRINT_PREDICTION.factors.map((factor, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        factor.weight < 0 ? "bg-jade" : "bg-coral"
                      )} />
                      <span className="flex-1 text-sm text-text-primary">{factor.factor}</span>
                      <span className={cn(
                        "text-sm font-mono",
                        factor.weight < 0 ? "text-jade" : "text-coral"
                      )}>
                        {factor.contribution > 0 ? '+' : ''}{factor.contribution}%
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-iris/5 border border-iris/20 rounded-lg">
                  <p className="text-sm text-iris font-medium">Recommendation</p>
                  <p className="text-sm text-text-secondary mt-1">{DEMO_SPRINT_PREDICTION.recommendation}</p>
                </div>
              </div>
            </div>
          </AnimatedCard>

          {/* Velocity Forecast */}
          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-jade" />
              Velocity Forecast
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DEMO_VELOCITY_FORECAST.periods.slice(-4).map((period) => (
                <div key={period.period} className="p-4 bg-surface-02 rounded-lg">
                  <p className="text-sm text-text-secondary">{period.period}</p>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-2xl font-semibold font-mono text-text-primary">
                      {period.predicted}
                    </span>
                    <span className="text-text-tertiary mb-0.5">pts</span>
                  </div>
                  {period.actual !== undefined && (
                    <div className="mt-1 text-xs text-text-tertiary">
                      Actual: <span className="text-text-primary font-mono">{period.actual}</span>
                    </div>
                  )}
                  <div className="mt-1 text-xs text-text-tertiary">
                    Range: {period.confidenceInterval.low} - {period.confidenceInterval.high}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Info className="w-4 h-4" />
                Trend: <span className="font-medium text-text-primary">{DEMO_VELOCITY_FORECAST.trend}</span>
              </span>
              <span className="flex items-center gap-1">
                Confidence: <span className="font-mono text-iris">{Math.round(DEMO_VELOCITY_FORECAST.confidence * 100)}%</span>
              </span>
            </div>
          </AnimatedCard>

          {/* Capacity Intelligence */}
          <AnimatedCard className="p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber" />
              Team Capacity Intelligence
              <span className="px-2 py-0.5 text-xs font-medium bg-iris/10 text-iris rounded">
                Health Score: {DEMO_CAPACITY_INTELLIGENCE.teamHealth.overallScore}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-text-secondary mb-3">Team Members</p>
                <div className="space-y-3">
                  {DEMO_CAPACITY_INTELLIGENCE.members.map((member) => (
                    <div key={member.userId} className="flex items-center gap-3 p-3 bg-surface-02 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-surface-03 flex items-center justify-center text-sm font-medium">
                        {member.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text-primary">{member.name}</span>
                          <span className={cn(
                            "text-sm font-mono",
                            member.allocation > 100 ? "text-coral" :
                            member.allocation > 85 ? "text-amber" : "text-jade"
                          )}>
                            {member.allocation}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 bg-surface-03 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              member.allocation > 100 ? "bg-coral" :
                              member.allocation > 85 ? "bg-amber" : "bg-jade"
                            )}
                            style={{ width: `${Math.min(member.allocation, 100)}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {member.burnoutRisk !== "low" && (
                            <Badge variant={member.burnoutRisk === "high" ? "poor" : "fair"} size="sm">
                              {member.burnoutRisk} burnout risk
                            </Badge>
                          )}
                          {member.recommendation && (
                            <span className="text-xs text-iris truncate max-w-[200px]">
                              {member.recommendation}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-text-secondary mb-3">Team Alerts</p>
                <div className="space-y-3">
                  {DEMO_CAPACITY_INTELLIGENCE.teamAlerts.map((alert) => (
                    <div key={alert.id} className={cn(
                      "p-3 rounded-lg border",
                      alert.severity === "high" ? "bg-coral/5 border-coral/20" :
                      alert.severity === "medium" ? "bg-amber/5 border-amber/20" :
                      "bg-surface-02 border-border"
                    )}>
                      <div className="flex items-start gap-2">
                        <Zap className={cn(
                          "w-4 h-4 mt-0.5",
                          alert.severity === "high" ? "text-coral" :
                          alert.severity === "medium" ? "text-amber" : "text-iris"
                        )} />
                        <div>
                          <p className="text-sm text-text-primary">{alert.title}</p>
                          <p className="text-xs text-text-tertiary mt-1">{alert.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant={alert.severity === "high" ? "poor" : alert.severity === "medium" ? "fair" : "default"} size="sm">
                              {alert.severity}
                            </Badge>
                            <span className="text-xs text-iris">
                              {alert.suggestedAction}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedCard>
        </motion.div>
      )}

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
