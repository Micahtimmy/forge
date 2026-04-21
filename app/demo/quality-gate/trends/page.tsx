"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
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
import { PageHeader } from "@/components/layout/page-header";
import { ChartContainer } from "@/components/ui/chart-container";
import { InfoPanel } from "@/components/ui/info-tip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

const sprintTrendData = [
  { sprint: "Sprint 18", avgScore: 62, excellent: 2, good: 4, fair: 6, poor: 3 },
  { sprint: "Sprint 19", avgScore: 65, excellent: 3, good: 5, fair: 5, poor: 2 },
  { sprint: "Sprint 20", avgScore: 68, excellent: 4, good: 6, fair: 4, poor: 1 },
  { sprint: "Sprint 21", avgScore: 71, excellent: 5, good: 7, fair: 3, poor: 1 },
  { sprint: "Sprint 22", avgScore: 74, excellent: 6, good: 6, fair: 3, poor: 1 },
  { sprint: "Sprint 23", avgScore: 78, excellent: 8, good: 5, fair: 2, poor: 1 },
];

const dimensionTrendData = [
  { sprint: "Sprint 18", completeness: 70, clarity: 65, estimability: 68, traceability: 58, testability: 50 },
  { sprint: "Sprint 19", completeness: 72, clarity: 68, estimability: 70, traceability: 62, testability: 55 },
  { sprint: "Sprint 20", completeness: 75, clarity: 72, estimability: 72, traceability: 65, testability: 58 },
  { sprint: "Sprint 21", completeness: 78, clarity: 75, estimability: 74, traceability: 70, testability: 62 },
  { sprint: "Sprint 22", completeness: 80, clarity: 78, estimability: 76, traceability: 72, testability: 68 },
  { sprint: "Sprint 23", completeness: 83, clarity: 81, estimability: 79, traceability: 75, testability: 72 },
];

const teamComparisonData = [
  { team: "Card Management", avgScore: 82, stories: 28 },
  { team: "BIN Management", avgScore: 75, stories: 18 },
  { team: "Tokenization", avgScore: 88, stories: 15 },
  { team: "Platform", avgScore: 71, stories: 22 },
  { team: "Mobile", avgScore: 68, stories: 24 },
];

const distributionData = [
  { name: "Excellent (85+)", value: 8, color: "var(--color-jade)" },
  { name: "Good (70-84)", value: 10, color: "var(--color-iris)" },
  { name: "Fair (50-69)", value: 5, color: "var(--color-amber)" },
  { name: "Poor (<50)", value: 2, color: "var(--color-coral)" },
];

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

export default function DemoTrendsPage() {
  const [timeRange, setTimeRange] = useState("6-sprints");

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
              <SelectItem value="6-sprints">Last 6 Sprints</SelectItem>
              <SelectItem value="10-sprints">Last 10 Sprints</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="mb-6">
        <InfoPanel termKey="qualityScore" />
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <StatCard
          label="Average Score"
          value={78}
          trend="up"
          trendValue="+16% from Sprint 18"
        />
        <StatCard
          label="Stories Scored"
          value={107}
          trend="up"
          trendValue="+18 this sprint"
        />
        <StatCard
          label="At Risk Stories"
          value={2}
          trend="down"
          trendValue="-6 from start"
        />
        <StatCard
          label="Quality Velocity"
          value="+2.7"
          trend="up"
          trendValue="pts/sprint"
        />
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
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
                        <p className="text-sm text-text-primary">{data.name}</p>
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
                  width={110}
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
                <Bar dataKey="excellent" name="Excellent" stackId="a" fill={COLORS.jade} />
                <Bar dataKey="good" name="Good" stackId="a" fill={COLORS.iris} />
                <Bar dataKey="fair" name="Fair" stackId="a" fill={COLORS.amber} />
                <Bar dataKey="poor" name="Poor" stackId="a" fill={COLORS.coral} />
              </BarChart>
            </ChartContainer>
          </div>
        </ChartCard>
      </motion.div>
    </div>
  );
}
