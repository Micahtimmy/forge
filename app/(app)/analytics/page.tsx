"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Target, Info, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCard } from "@/components/ui/animated";
import { LabelWithInfo, InfoPanel } from "@/components/ui/info-tip";
import { QualityTrendChart } from "@/components/charts/quality-trend-chart";
import { VelocityChart } from "@/components/charts/velocity-chart";
import { BurndownChart } from "@/components/charts/burndown-chart";
import { CapacityChart } from "@/components/charts/capacity-chart";
import { cn } from "@/lib/utils";
import {
  useVelocityData,
  useQualityTrend,
  useTeamCapacity,
  useBurndownData,
} from "@/hooks/use-analytics";

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

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("quality");

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
        description="Insights and metrics across your teams and sprints"
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
  );
}
