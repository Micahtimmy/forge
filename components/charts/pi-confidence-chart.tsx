"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

interface ObjectiveData {
  name: string;
  color: string;
  data: number[];
}

interface PIConfidenceChartProps {
  objectives: ObjectiveData[];
  weeks: string[];
  height?: number;
  threshold?: number;
  className?: string;
}

export function PIConfidenceChart({
  objectives,
  weeks,
  height = 300,
  threshold = 70,
  className,
}: PIConfidenceChartProps) {
  const chartData = weeks.map((week, i) => {
    const point: Record<string, string | number> = { week };
    objectives.forEach((obj) => {
      point[obj.name] = obj.data[i] ?? null;
    });
    return point;
  });

  const atRiskObjectives = objectives.filter((obj) => {
    const lastValue = obj.data[obj.data.length - 1];
    return lastValue !== undefined && lastValue < threshold;
  });

  return (
    <div className={cn("w-full", className)}>
      <ChartContainer height={height}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="week"
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
            formatter={(value) => [`${value}%`, "Confidence"]}
          />
          <Legend
            wrapperStyle={{ color: "var(--color-text-secondary)" }}
            formatter={(value) => <span className="text-text-secondary text-sm">{value}</span>}
          />
          <ReferenceLine
            y={threshold}
            stroke="var(--color-coral)"
            strokeDasharray="5 5"
            label={{
              value: "At Risk",
              position: "right",
              fill: "var(--color-coral)",
              fontSize: 11,
            }}
          />
          {objectives.map((obj) => (
            <Line
              key={obj.name}
              type="monotone"
              dataKey={obj.name}
              stroke={obj.color}
              strokeWidth={2}
              dot={{
                fill: "var(--color-surface-01)",
                stroke: obj.color,
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                fill: obj.color,
                stroke: "var(--color-surface-01)",
                strokeWidth: 2,
                r: 6,
              }}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>

      {atRiskObjectives.length > 0 && (
        <div className="mt-4 space-y-2">
          {atRiskObjectives.map((obj) => {
            const current = obj.data[obj.data.length - 1];
            const previous = obj.data[obj.data.length - 2] ?? current;
            const trend = current - previous;

            return (
              <div
                key={obj.name}
                className="flex items-center justify-between p-3 bg-coral-dim border border-coral/20 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-coral" />
                  <span className="text-sm font-medium text-text-primary">
                    {obj.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-coral">{current}%</span>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      trend >= 0 ? "text-jade" : "text-coral"
                    )}
                  >
                    {trend >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{trend >= 0 ? "+" : ""}{trend}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
