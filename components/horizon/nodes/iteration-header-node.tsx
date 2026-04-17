"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { IterationHeaderData } from "@/types/pi";

export const IterationHeaderNode = memo(function IterationHeaderNode({
  data,
  selected,
}: NodeProps & { data: IterationHeaderData }) {
  return (
    <div
      className={cn(
        "w-[180px] bg-surface-02 border border-border rounded-md p-3",
        "text-center cursor-default",
        selected && "ring-2 ring-iris"
      )}
    >
      <div className="text-sm font-semibold text-text-primary">
        Iteration {data.iterationNumber}
      </div>
      <div className="text-xs text-text-tertiary mt-1">
        {format(new Date(data.startDate), "MMM d")} -{" "}
        {format(new Date(data.endDate), "MMM d")}
      </div>
    </div>
  );
});
