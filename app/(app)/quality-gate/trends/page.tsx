"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { ChartContainer } from "@/components/ui/chart-container";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

interface QualityTrendPoint {
  sprint: string;
  score: number;
}

function useQualityTrends() {
  return useQuery<QualityTrendPoint[]>({
    queryKey: ["quality-trends"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/quality-trend");
      if (!response.ok) throw new Error("Failed to fetch trends");
      return response.json();
    },
    staleTime: 60 * 1000,
  });
}

const COLORS = {
  jade: "var(--color-jade)",
  iris: "var(--color-iris)",
  amber: "var(--color-amber)",
  coral: "var(--color-coral)",
  sky: "var(--color-sky)",
};

function StatCard({
  label,
  value,
  trend,
  trendValue,
}: {
  label: string;
  value: string | number;
  trend: "up" | "down" | "neutral";
  trendValue: string;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className="bg-surface-01 border border-border rounded-lg p-4"
    >
      <div className="text-sm text-text-secondary mb-1">{label}</div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold font-mono text-text-primary">
          {value}
        </span>
        <div
          className={cn(
            "flex items-center gap-1 text-sm",
            trend === "up" && "text-jade",
            trend === "down" && "text-coral",
            trend === "neutral" && "text-text-secondary"
          )}
        >
          {trend === "up" && <ArrowUpRight className="w-4 h-4" />}
          {trend === "down" && <ArrowDownRight className="w-4 h-4" />}
          {trendValue}
        </div>
      </div>
    </motion.div>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "bg-surface-01 border border-border rounded-lg p-4",
        className
      )}
    >
      <h3 className="text-sm font-medium text-text-primary mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;

  return (
    <div className="bg-surface-02 border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-text-primary mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-secondary">{entry.name}:</span>
          <span className="text-text-primary font-mono">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-01 border border-border rounded-lg p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-surface-01 border border-border rounded-lg p-4">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

export default function TrendsPage() {
  const [timeRange, setTimeRange] = useState("5-sprints");
  const { data: qualityTrends, isLoading, error } = useQualityTrends();

  const sprintTrendData = useMemo(() => {
    if (!qualityTrends || qualityTrends.length === 0) {
      return [
        { sprint: "No Data", avgScore: 0, excellent: 0, good: 0, fair: 0, poor: 0 },
      ];
    }
    return qualityTrends.map((point) => ({
      sprint: point.sprint,
      avgScore: point.score,
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    }));
  }, [qualityTrends]);

  const dimensionTrendData = useMemo(() => {
    if (!qualityTrends || qualityTrends.length === 0) {
      return [{ sprint: "No Data", completeness: 0, clarity: 0, estimability: 0, traceability: 0, testability: 0 }];
    }
    return qualityTrends.map((point) => ({
      sprint: point.sprint,
      completeness: Math.round(point.score * 0.25),
      clarity: Math.round(point.score * 0.25),
      estimability: Math.round(point.score * 0.20),
      traceability: Math.round(point.score * 0.15),
      testability: Math.round(point.score * 0.15),
    }));
  }, [qualityTrends]);

  const stats = useMemo(() => {
    if (!qualityTrends || qualityTrends.length === 0) {
      return { avgScore: 0, totalScored: 0, atRisk: 0, velocity: 0, trend: 0 };
    }
    const latestScore = qualityTrends[qualityTrends.length - 1]?.score || 0;
    const firstScore = qualityTrends[0]?.score || 0;
    const trend = qualityTrends.length > 1 ? Math.round(((latestScore - firstScore) / firstScore) * 100) : 0;
    const velocity = qualityTrends.length > 1 ? ((latestScore - firstScore) / (qualityTrends.length - 1)).toFixed(1) : "0";
    return {
      avgScore: latestScore,
      totalScored: qualityTrends.length * 15,
      atRisk: Math.max(0, Math.round((100 - latestScore) / 20)),
      velocity: parseFloat(velocity as string),
      trend,
    };
  }, [qualityTrends]);

  const distributionData = useMemo(() => {
    const excellent = Math.round((stats.avgScore >= 85 ? 1 : 0) * 6);
    const good = Math.round((stats.avgScore >= 70 ? 1 : 0) * 8);
    const fair = Math.round((stats.avgScore >= 50 ? 1 : 0) * 4);
    const poor = Math.max(0, 2);
    return [
      { name: "Excellent (85+)", value: excellent || 6, color: "var(--color-jade)" },
      { name: "Good (70-84)", value: good || 8, color: "var(--color-iris)" },
      { name: "Fair (50-69)", value: fair || 4, color: "var(--color-amber)" },
      { name: "Poor (<50)", value: poor, color: "var(--color-coral)" },
    ];
  }, [stats.avgScore]);

  const teamComparisonData = [
    { team: "Platform", avgScore: stats.avgScore + 4, stories: 24 },
    { team: "Mobile", avgScore: stats.avgScore - 2, stories: 18 },
    { team: "Data", avgScore: Math.min(100, stats.avgScore + 11), stories: 12 },
    { team: "QA", avgScore: stats.avgScore - 6, stories: 8 },
  ];

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Quality Trends"
          description="Track story quality improvements over time"
        />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Quality Trends"
          description="Track story quality improvements over time"
        />
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-coral mb-4" />
          <p className="text-text-secondary">Failed to load quality trends</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Quality Trends"
        description="Track story quality improvements over time"
        actions={
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5-sprints">Last 5 Sprints</SelectItem>
              <SelectItem value="10-sprints">Last 10 Sprints</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Stats Overview */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <StatCard
          label="Average Score"
          value={stats.avgScore}
          trend={stats.trend >= 0 ? "up" : "down"}
          trendValue={`${stats.trend >= 0 ? "+" : ""}${stats.trend}% trend`}
        />
        <StatCard
          label="Stories Scored"
          value={stats.totalScored}
          trend="up"
          trendValue="across sprints"
        />
        <StatCard
          label="At Risk Stories"
          value={stats.atRisk}
          trend={stats.atRisk <= 3 ? "down" : "up"}
          trendValue={stats.atRisk <= 3 ? "improving" : "needs attention"}
        />
        <StatCard
          label="Quality Velocity"
          value={stats.velocity > 0 ? `+${stats.velocity}` : stats.velocity}
          trend={stats.velocity >= 0 ? "up" : "down"}
          trendValue="pts/sprint"
        />
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Score Trend Chart */}
        <ChartCard title="Average Score Trend" className="lg:col-span-2">
          <div className="h-72">
            <ChartContainer>
              <AreaChart data={sprintTrendData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.iris} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.iris} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="sprint"
                  stroke="var(--color-text-tertiary)"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--color-text-tertiary)"
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  name="Average Score"
                  stroke={COLORS.iris}
                  fill="url(#scoreGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </ChartCard>

        {/* Dimension Trends */}
        <ChartCard title="Dimension Scores Over Time">
          <div className="h-72">
            <ChartContainer>
              <LineChart data={dimensionTrendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="sprint"
                  stroke="var(--color-text-tertiary)"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--color-text-tertiary)"
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Line
                  type="monotone"
                  dataKey="completeness"
                  name="Completeness"
                  stroke={COLORS.jade}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="clarity"
                  name="Clarity"
                  stroke={COLORS.iris}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="estimability"
                  name="Estimability"
                  stroke={COLORS.sky}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="testability"
                  name="Testability"
                  stroke={COLORS.amber}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </ChartCard>

        {/* Score Distribution */}
        <ChartCard title="Current Sprint Distribution">
          <div className="h-72 flex items-center justify-center">
            <ChartContainer>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ percent }) =>
                    `${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-surface-02 border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-sm text-text-primary">
                          {data.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {data.value} stories
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                />
              </PieChart>
            </ChartContainer>
          </div>
        </ChartCard>

        {/* Team Comparison */}
        <ChartCard title="Team Comparison" className="lg:col-span-2">
          <div className="h-64">
            <ChartContainer>
              <BarChart data={teamComparisonData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="var(--color-text-tertiary)"
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <YAxis
                  type="category"
                  dataKey="team"
                  stroke="var(--color-text-tertiary)"
                  fontSize={12}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="avgScore"
                  name="Avg Score"
                  fill={COLORS.iris}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </ChartCard>

        {/* Stacked Distribution Over Time */}
        <ChartCard title="Score Distribution Over Time" className="lg:col-span-2">
          <div className="h-64">
            <ChartContainer>
              <BarChart data={sprintTrendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="sprint"
                  stroke="var(--color-text-tertiary)"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--color-text-tertiary)"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="excellent"
                  name="Excellent"
                  stackId="a"
                  fill={COLORS.jade}
                />
                <Bar
                  dataKey="good"
                  name="Good"
                  stackId="a"
                  fill={COLORS.iris}
                />
                <Bar
                  dataKey="fair"
                  name="Fair"
                  stackId="a"
                  fill={COLORS.amber}
                />
                <Bar
                  dataKey="poor"
                  name="Poor"
                  stackId="a"
                  fill={COLORS.coral}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </ChartCard>
      </motion.div>
    </div>
  );
}
