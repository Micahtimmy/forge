"use client";

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { cn } from "@/lib/utils";

interface BurndownDataPoint {
  day: string;
  ideal: number;
  actual: number | null;
  forecast?: number | null;
}

interface BurndownChartProps {
  data: BurndownDataPoint[];
  height?: number;
  totalPoints: number;
  className?: string;
}

export function BurndownChart({
  data,
  height = 300,
  totalPoints,
  className,
}: BurndownChartProps) {
  const lastActual = data.filter((d) => d.actual !== null).pop();
  const projectedCompletion = lastActual
    ? lastActual.actual! <= 0
      ? 100
      : Math.round(((totalPoints - lastActual.actual!) / totalPoints) * 100)
    : 0;

  return (
    <div className={cn("w-full", className)}>
      <ChartContainer height={height}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-iris)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-iris)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-amber)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--color-amber)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-text-tertiary)", fontSize: 12 }}
          />
          <YAxis
            domain={[0, totalPoints]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--color-text-tertiary)", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-surface-02)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              color: "var(--color-text-primary)",
            }}
            labelStyle={{ color: "var(--color-text-secondary)" }}
            formatter={(value, name) => [
              value !== null ? `${value} pts` : "N/A",
              name as string,
            ]}
          />
          <Legend
            wrapperStyle={{ color: "var(--color-text-secondary)" }}
            formatter={(value) => <span className="text-text-secondary text-sm">{value}</span>}
          />
          <Line
            type="linear"
            dataKey="ideal"
            name="Ideal"
            stroke="var(--color-text-tertiary)"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="var(--color-iris)"
            strokeWidth={2}
            fill="url(#actualGradient)"
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
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke="var(--color-amber)"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#forecastGradient)"
            dot={false}
            connectNulls
          />
        </AreaChart>
      </ChartContainer>
      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-text-tertiary">Progress:</span>
          <span className="font-mono font-semibold text-iris">
            {projectedCompletion}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-tertiary">Remaining:</span>
          <span className="font-mono font-semibold text-text-primary">
            {lastActual?.actual ?? totalPoints} pts
          </span>
        </div>
      </div>
    </div>
  );
}
