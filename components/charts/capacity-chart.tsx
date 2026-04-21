"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface TeamMemberCapacity {
  name: string;
  allocated: number;
  capacity: number;
  avatar?: string;
}

interface CapacityChartProps {
  data: TeamMemberCapacity[];
  className?: string;
}

export function CapacityChart({ data, className }: CapacityChartProps) {
  const getUtilizationColor = (percentage: number) => {
    if (percentage > 100) return "bg-coral";
    if (percentage >= 80) return "bg-amber";
    return "bg-iris";
  };

  const getUtilizationStatus = (percentage: number) => {
    if (percentage > 100) return "Overallocated";
    if (percentage >= 80) return "High";
    if (percentage >= 50) return "Moderate";
    return "Available";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {data.map((member, index) => {
        const percentage = Math.round((member.allocated / member.capacity) * 100);
        const isOver = percentage > 100;
        const displayPercentage = Math.min(percentage, 150);

        return (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-03 flex items-center justify-center">
                  <span className="text-xs font-medium text-text-secondary">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    {member.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <span>
                      {member.allocated}/{member.capacity} pts
                    </span>
                    <span className={cn(isOver && "text-coral")}>
                      ({percentage}%)
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isOver && (
                  <AlertTriangle className="w-4 h-4 text-coral" />
                )}
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    percentage > 100 && "bg-coral-dim text-coral",
                    percentage >= 80 && percentage <= 100 && "bg-amber-dim text-amber",
                    percentage < 80 && "bg-iris-dim text-iris"
                  )}
                >
                  {getUtilizationStatus(percentage)}
                </span>
              </div>
            </div>
            <div className="h-2 bg-surface-03 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(displayPercentage, 100)}%` }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={cn("h-full rounded-full", getUtilizationColor(percentage))}
              />
              {isOver && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${displayPercentage - 100}%` }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                  className="h-full -mt-2 ml-auto bg-coral/50 rounded-r-full"
                  style={{ marginLeft: "100%" }}
                />
              )}
            </div>
          </motion.div>
        );
      })}
      <div className="flex items-center justify-between pt-4 border-t border-border text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-iris" />
            <span className="text-text-tertiary">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber" />
            <span className="text-text-tertiary">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-coral" />
            <span className="text-text-tertiary">Over</span>
          </div>
        </div>
        <span className="text-text-secondary">
          Team:{" "}
          <span className="font-mono">
            {data.reduce((sum, m) => sum + m.allocated, 0)}/
            {data.reduce((sum, m) => sum + m.capacity, 0)} pts
          </span>
        </span>
      </div>
    </div>
  );
}
