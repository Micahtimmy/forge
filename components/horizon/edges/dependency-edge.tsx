"use client";

import { memo } from "react";
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { getDependencyColor } from "@/types/pi";

interface DependencyEdgeData {
  status: "open" | "resolved" | "at_risk" | "blocked";
}

export const DependencyEdge = memo(function DependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps & { data?: DependencyEdgeData }) {
  const status = data?.status ?? "open";
  const color = getDependencyColor(status);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        className={cn(
          "react-flow__edge-path",
          "transition-all",
          selected && "!stroke-[3px]"
        )}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={selected ? 3 : 2}
        strokeDasharray={status === "at_risk" ? "5,5" : undefined}
      />
      {/* Arrowhead */}
      <marker
        id={`arrow-${id}`}
        markerWidth="12"
        markerHeight="12"
        refX="10"
        refY="6"
        orient="auto"
      >
        <path d="M2,2 L10,6 L2,10" fill="none" stroke={color} strokeWidth="1.5" />
      </marker>

      {/* Status label */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide",
              status === "resolved" && "bg-jade-dim text-jade",
              status === "at_risk" && "bg-amber-dim text-amber",
              status === "blocked" && "bg-coral-dim text-coral",
              status === "open" && "bg-sky-dim text-sky"
            )}
          >
            {status.replace("_", " ")}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
