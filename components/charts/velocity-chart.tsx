"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface VelocityDataPoint {
  sprint: string;
  committed: number;
  completed: number;
}

interface VelocityChartProps {
  data: VelocityDataPoint[];
  height?: number;
  showAverage?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function VelocityChart({
  data,
  height = 300,
  showAverage = true,
  isLoading,
  className,
}: VelocityChartProps) {
  if (isLoading) {
    return <ChartSkeleton className={className} />;
  }
  const averageCompleted =
    data.reduce((sum, d) => sum + d.completed, 0) / data.length;

  return (
    <div className={cn("w-full", className)}>
      <ChartContainer height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
          />
          <Legend
            wrapperStyle={{ color: "var(--color-text-secondary)" }}
            formatter={(value) => <span className="text-text-secondary text-sm">{value}</span>}
          />
          {showAverage && (
            <ReferenceLine
              y={averageCompleted}
              stroke="var(--color-text-tertiary)"
              strokeDasharray="5 5"
              label={{
                value: `Avg: ${Math.round(averageCompleted)}`,
                position: "right",
                fill: "var(--color-text-tertiary)",
                fontSize: 11,
              }}
            />
          )}
          <Bar
            dataKey="committed"
            name="Committed"
            fill="var(--color-surface-04)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="completed"
            name="Completed"
            fill="var(--color-iris)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
