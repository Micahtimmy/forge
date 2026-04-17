"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeatureCardData } from "@/types/pi";

export const FeatureCardNode = memo(function FeatureCardNode({
  data,
  selected,
}: NodeProps & { data: FeatureCardData }) {
  const getRiskColor = (level: FeatureCardData["riskLevel"]) => {
    switch (level) {
      case "high":
        return "border-l-coral";
      case "medium":
        return "border-l-amber";
      case "low":
        return "border-l-sky";
      default:
        return "border-l-transparent";
    }
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-surface-03 !border-border hover:!bg-iris"
      />
      <div
        className={cn(
          "w-[180px] bg-surface-01 border border-border rounded-md p-3",
          "border-l-[3px] transition-all cursor-move",
          getRiskColor(data.riskLevel),
          selected && "ring-2 ring-iris border-iris"
        )}
      >
        {/* Header */}
        {data.jiraKey && (
          <div className="text-[10px] font-mono text-text-tertiary mb-1">
            {data.jiraKey}
          </div>
        )}

        {/* Title */}
        <div className="text-sm font-medium text-text-primary line-clamp-2 mb-2">
          {data.title}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-text-secondary">
            {data.points} pts
          </span>
          {data.riskLevel && data.riskLevel !== "none" && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                data.riskLevel === "high" && "text-coral",
                data.riskLevel === "medium" && "text-amber",
                data.riskLevel === "low" && "text-sky"
              )}
            >
              <AlertTriangle className="w-3 h-3" />
              {data.riskLevel}
            </span>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-surface-03 !border-border hover:!bg-iris"
      />
    </>
  );
});
