"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCapacityUtilization, type TeamRowData } from "@/types/pi";

export const TeamRowNode = memo(function TeamRowNode({
  data,
  selected,
}: NodeProps & { data: TeamRowData }) {
  const utilization = getCapacityUtilization(data.committed, data.totalCapacity);

  return (
    <div
      className={cn(
        "w-[140px] h-[100px] bg-surface-01 border border-border rounded-md p-3",
        "flex flex-col justify-between cursor-default",
        selected && "ring-2 ring-iris"
      )}
    >
      {/* Team Name */}
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-text-tertiary" />
        <span className="text-sm font-medium text-text-primary truncate">
          {data.teamName}
        </span>
      </div>

      {/* Capacity Bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-text-secondary">Capacity</span>
          <span
            className={cn(
              "font-mono",
              utilization.status === "healthy" && "text-jade",
              utilization.status === "warning" && "text-amber",
              utilization.status === "danger" && "text-coral"
            )}
          >
            {data.committed}/{data.totalCapacity}
          </span>
        </div>
        <div className="h-1.5 bg-surface-03 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              utilization.status === "healthy" && "bg-jade",
              utilization.status === "warning" && "bg-amber",
              utilization.status === "danger" && "bg-coral"
            )}
            style={{ width: `${Math.min(utilization.percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
});
