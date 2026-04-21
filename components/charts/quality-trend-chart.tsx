"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { cn } from "@/lib/utils";

interface QualityTrendDataPoint {
  sprint: string;
  score: number;
  target?: number;
}

interface QualityTrendChartProps {
  data: QualityTrendDataPoint[];
  height?: number;
  showTarget?: boolean;
  targetValue?: number;
  className?: string;
}

export function QualityTrendChart({
  data,
  height = 300,
  showTarget = true,
  targetValue = 70,
  className,
}: QualityTrendChartProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return "var(--color-jade)";
    if (score >= 70) return "var(--color-iris)";
    if (score >= 50) return "var(--color-amber)";
    return "var(--color-coral)";
  };

  const latestScore = data[data.length - 1]?.score ?? 0;
  const firstScore = data[0]?.score ?? 0;
  const improvement = latestScore - firstScore;

  return (
    <div className={cn("w-full", className)}>
      <ChartContainer height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="sprint"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-text-tertiary)", fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-text-tertiary)", fontSize: 12 }}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-surface-02)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              color: "var(--color-text-primary)",
            }}
            labelStyle={{ color: "var(--color-text-secondary)" }}
            formatter={(value) => [`${value}%`, "Quality Score"]}
          />
          {showTarget && (
            <ReferenceLine
              y={targetValue}
              stroke="var(--color-text-tertiary)"
              strokeDasharray="5 5"
              label={{
                value: "Target",
                position: "right",
                fill: "var(--color-text-tertiary)",
                fontSize: 11,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--color-iris)"
            strokeWidth={2}
            dot={{
              fill: "var(--color-surface-01)",
              stroke: "var(--color-iris)",
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              fill: "var(--color-iris)",
              stroke: "var(--color-surface-01)",
              strokeWidth: 2,
              r: 6,
            }}
          />
        </LineChart>
      </ChartContainer>
      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-text-tertiary">Latest:</span>
          <span
            className="font-mono font-semibold"
            style={{ color: getScoreColor(latestScore) }}
          >
            {latestScore}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-tertiary">Change:</span>
          <span
            className={cn(
              "font-mono font-semibold",
              improvement >= 0 ? "text-jade" : "text-coral"
            )}
          >
            {improvement >= 0 ? "+" : ""}
            {improvement}%
          </span>
        </div>
      </div>
    </div>
  );
}
