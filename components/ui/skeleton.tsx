"use client";

import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "default",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        variant === "circular" && "rounded-full",
        variant === "text" && "rounded h-4",
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
}

// Pre-built skeleton variants
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className="h-4"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-surface-01 border border-border rounded-lg p-4 space-y-3",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonStoryCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-surface-01 border border-border border-l-[3px] border-l-surface-03 rounded-lg p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width={80} className="h-3" />
          <Skeleton variant="text" width="80%" className="h-5" />
        </div>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Skeleton width={60} height={20} className="rounded-full" />
        <Skeleton width={40} height={20} className="rounded-full" />
        <Skeleton variant="circular" width={24} height={24} />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
