"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { cn } from "@/lib/utils";

interface TeamRadarDataPoint {
  metric: string;
  fullMark: number;
  [teamName: string]: string | number;
}

interface TeamRadarChartProps {
  data: TeamRadarDataPoint[];
  teams: { name: string; color: string }[];
  height?: number;
  className?: string;
}

export function TeamRadarChart({
  data,
  teams,
  height = 350,
  className,
}: TeamRadarChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ChartContainer height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "var(--color-text-tertiary)", fontSize: 10 }}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-surface-02)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              color: "var(--color-text-primary)",
            }}
          />
          <Legend
            wrapperStyle={{ color: "var(--color-text-secondary)" }}
            formatter={(value) => <span className="text-text-secondary text-sm">{value}</span>}
          />
          {teams.map((team) => (
            <Radar
              key={team.name}
              name={team.name}
              dataKey={team.name}
              stroke={team.color}
              fill={team.color}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ChartContainer>
    </div>
  );
}
