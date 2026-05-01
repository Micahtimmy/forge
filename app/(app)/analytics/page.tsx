"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Target,
  Info,
  RefreshCw,
  BarChart3,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCard } from "@/components/ui/animated";
import { LabelWithInfo, InfoPanel } from "@/components/ui/info-tip";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { QualityTrendChart } from "@/components/charts/quality-trend-chart";
import { VelocityChart } from "@/components/charts/velocity-chart";
import { BurndownChart } from "@/components/charts/burndown-chart";
import { CapacityChart } from "@/components/charts/capacity-chart";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import {
  useVelocityData,
  useQualityTrend,
  useTeamCapacity,
  useBurndownData,
} from "@/hooks/use-analytics";
import {
  PERSONA_CONFIGS,
  getPersonaInsights,
  HELP_CONTENT,
  type PersonaRole,
} from "@/lib/demo/persona-data";

type TabId = "quality" | "velocity" | "team";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "quality", label: "Quality Intelligence", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "velocity", label: "Velocity & Burndown", icon: <Target className="w-4 h-4" /> },
  { id: "team", label: "Team Performance", icon: <Users className="w-4 h-4" /> },
];

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div style={{ height }} className="flex items-center justify-center bg-surface-02 rounded-lg">
      <div className="text-center">
        <Skeleton className="w-32 h-4 mx-auto mb-2" />
        <Skeleton className="w-48 h-3 mx-auto" />
      </div>
    </div>
  );
}

// Persona Context Banner
function PersonaContextBanner({ role }: { role: PersonaRole }) {
  const config = PERSONA_CONFIGS[role];

  const analyticsRelevance: Record<PersonaRole, string> = {
    developer: "Track your individual contribution metrics and story quality scores.",
    scrum_master: "Monitor team velocity, sprint health, and identify coaching opportunities.",
    product_manager: "Analyze backlog quality trends and delivery predictability.",
    engineering_manager: "Oversee team performance, capacity utilization, and identify bottlenecks.",
    rte: "Track cross-team velocity, dependency impacts, and PI-level health metrics.",
    program_manager: "Portfolio-level analytics across multiple teams and value streams.",
    executive: "Strategic metrics: delivery predictability, quality trends, and resource efficiency.",
  };

  return (
    <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-jade/10 to-transparent border border-jade/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-jade/20">
            <BarChart3 className="w-5 h-5 text-jade" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-text-primary">{config.label} Analytics</h3>
              <HelpTooltip
                content={
                  <div>
                    <p className="font-medium mb-1">{config.label}</p>
                    <p className="text-slate-300">{analyticsRelevance[role]}</p>
                  </div>
                }
              />
            </div>
            <p className="text-sm text-text-tertiary">{analyticsRelevance[role]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics Insights Panel
function AnalyticsInsightsPanel({ role }: { role: PersonaRole }) {
  const insights = getPersonaInsights(role).filter(i =>
    i.actionHref?.includes("analytics") || i.title.toLowerCase().includes("trend") || i.title.toLowerCase().includes("velocity")
  );

  const analyticsInsights = [...insights];

  if (analyticsInsights.length === 0) {
    analyticsInsights.push({
      type: "info" as const,
      title: "Metrics loading",
      description: "Connect JIRA to see velocity and quality trends",
    });
  }

  return (
    <CollapsibleSection
      title="AI Insights"
      helpContent="AI-generated insights based on your analytics data and patterns."
      defaultOpen={true}
      storageKey="analytics-ai-insights"
      badge={
        <Badge variant="default" size="sm" className="bg-jade/20 text-jade">
          <Sparkles className="w-3 h-3 mr-1" />
          {analyticsInsights.length}
        </Badge>
      }
    >
      <div className="space-y-2">
        {analyticsInsights.map((insight, index) => (
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
              {insight.type === "info" && <Sparkles className="w-4 h-4 text-iris mt-0.5" />}
              {insight.type === "action" && <Target className="w-4 h-4 text-text-secondary mt-0.5" />}
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

// Metrics Guide Panel
function MetricsGuidePanel() {
  const metrics = [
    {
      label: "Velocity",
      description: HELP_CONTENT.velocity,
      color: "text-jade",
      bg: "bg-jade/10",
    },
    {
      label: "Burndown",
      description: HELP_CONTENT.burndown,
      color: "text-iris",
      bg: "bg-iris/10",
    },
    {
      label: "Capacity",
      description: HELP_CONTENT.capacityUtilization,
      color: "text-amber",
      bg: "bg-amber/10",
    },
    {
      label: "Cycle Time",
      description: HELP_CONTENT.cycleTime,
      color: "text-sky",
      bg: "bg-sky/10",
    },
  ];

  return (
    <CollapsibleSection
      title="Metrics Guide"
      helpContent="Quick reference for understanding the analytics metrics."
      defaultOpen={false}
      storageKey="analytics-metrics-guide"
    >
      <div className="space-y-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="p-2 rounded-lg bg-surface-02 border border-border"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("w-2 h-2 rounded-full", metric.bg.replace("/10", ""))} />
              <span className="text-sm font-medium text-text-primary">{metric.label}</span>
            </div>
            <p className="text-xs text-text-tertiary">{metric.description}</p>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("quality");
  const { userRole } = useAppStore();
  const config = PERSONA_CONFIGS[userRole];

  const { data: velocityData, isLoading: velocityLoading, refetch: refetchVelocity } = useVelocityData();
  const { data: qualityData, isLoading: qualityLoading, refetch: refetchQuality } = useQualityTrend();
  const { data: capacityData, isLoading: capacityLoading, refetch: refetchCapacity } = useTeamCapacity();
  const { data: burndownData, isLoading: burndownLoading, refetch: refetchBurndown } = useBurndownData();

  const refetchAll = () => {
    refetchVelocity();
    refetchQuality();
    refetchCapacity();
    refetchBurndown();
  };

  const hasQualityData = qualityData && qualityData.length > 0;
  const hasVelocityData = velocityData && velocityData.length > 0;
  const hasCapacityData = capacityData && capacityData.length > 0;
  const hasBurndownData = burndownData && burndownData.data.length > 0;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description={
          <span className="flex items-center gap-2">
            Insights and metrics across your teams and sprints
            <HelpTooltip
              content={
                <div className="max-w-xs">
                  <p className="font-medium mb-1">Analytics Module</p>
                  <p className="text-slate-300 text-xs">
                    Track velocity, quality trends, team capacity, and burndown charts.
                    Data is personalized for your role as {config.label.toLowerCase()}.
                  </p>
                </div>
              }
            />
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={refetchAll}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="secondary" size="sm">
              Export Report
            </Button>
          </div>
        }
      />

      {/* Persona Context Banner */}
      <PersonaContextBanner role={userRole} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <AnalyticsInsightsPanel role={userRole} />
          <MetricsGuidePanel />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
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
              {qualityLoading ? (
                <ChartSkeleton height={280} />
              ) : hasQualityData ? (
                <QualityTrendChart data={qualityData} height={280} />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-text-secondary text-sm">
                  No quality data available. Score some stories to see trends.
                </div>
              )}
            </AnimatedCard>

            <AnimatedCard className="p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                Score Distribution by Sprint
              </h3>
              {qualityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : hasQualityData ? (
                <div className="space-y-4">
                  {qualityData.slice(-5).map((sprint, i) => {
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
              ) : (
                <div className="h-[200px] flex items-center justify-center text-text-secondary text-sm">
                  No sprint data available yet.
                </div>
              )}
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

          {hasQualityData && (
            <AnimatedCard className="p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-iris" />
                Quality Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-iris-dim border border-iris/20 rounded-lg">
                  <div className="text-2xl font-semibold text-iris font-mono">
                    {qualityData[qualityData.length - 1]?.score || 0}%
                  </div>
                  <div className="text-sm text-text-secondary mt-1">
                    Current quality score
                  </div>
                </div>
                <div className="p-4 bg-surface-02 border border-border rounded-lg">
                  <div className="text-2xl font-semibold text-text-primary font-mono">
                    {qualityData.length}
                  </div>
                  <div className="text-sm text-text-secondary mt-1">
                    Sprints tracked
                  </div>
                </div>
                <div className="p-4 bg-surface-02 border border-border rounded-lg">
                  <div className={cn(
                    "text-2xl font-semibold font-mono",
                    qualityData.length >= 2
                      ? qualityData[qualityData.length - 1].score >= qualityData[qualityData.length - 2].score
                        ? "text-jade"
                        : "text-coral"
                      : "text-text-primary"
                  )}>
                    {qualityData.length >= 2
                      ? `${qualityData[qualityData.length - 1].score >= qualityData[qualityData.length - 2].score ? "+" : ""}${qualityData[qualityData.length - 1].score - qualityData[qualityData.length - 2].score}%`
                      : "-"}
                  </div>
                  <div className="text-sm text-text-secondary mt-1">
                    Change from last sprint
                  </div>
                </div>
              </div>
            </AnimatedCard>
          )}
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
              {velocityLoading ? (
                <ChartSkeleton height={280} />
              ) : hasVelocityData ? (
                <VelocityChart data={velocityData} height={280} />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-text-secondary text-sm">
                  No velocity data available. Complete some sprints to see trends.
                </div>
              )}
            </AnimatedCard>

            <AnimatedCard className="p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                <LabelWithInfo label="Sprint Burndown" termKey="burndown" />
              </h3>
              {burndownLoading ? (
                <ChartSkeleton height={280} />
              ) : hasBurndownData ? (
                <BurndownChart
                  data={burndownData.data}
                  height={280}
                  totalPoints={burndownData.totalPoints}
                />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-text-secondary text-sm">
                  No burndown data available for current sprint.
                </div>
              )}
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
              <AnimatedCard className="p-5">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  <LabelWithInfo label="Team Capacity" termKey="storyPoints" />
                </h3>
                {capacityLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="flex-1 h-6" />
                        <Skeleton className="w-12 h-4" />
                      </div>
                    ))}
                  </div>
                ) : hasCapacityData ? (
                  <CapacityChart data={capacityData} />
                ) : (
                  <div className="py-12 text-center text-text-secondary text-sm">
                    No capacity data available. Assign stories to team members to see utilization.
                  </div>
                )}
              </AnimatedCard>

              <InfoPanel termKey="wip" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
