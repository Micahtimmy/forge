"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

interface ChartContainerProps {
  children: ReactNode;
  height?: number | `${number}%`;
  width?: number | `${number}%`;
  className?: string;
}

/**
 * Wrapper for Recharts that prevents SSR rendering issues.
 * Recharts throws warnings during static generation because ResponsiveContainer
 * needs actual DOM dimensions. This component only renders the chart after mount.
 */
const DEFAULT_SIZE = "100%" as const;

// Use useSyncExternalStore to detect client-side mount without useState/useEffect
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ChartContainer({
  children,
  height = DEFAULT_SIZE,
  width = DEFAULT_SIZE,
  className,
}: ChartContainerProps) {
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isMounted) {
    return (
      <div
        className={className}
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          width: typeof width === "number" ? `${width}px` : width,
        }}
      />
    );
  }

  return (
    <ResponsiveContainer width={width} height={height} minWidth={0} minHeight={0}>
      {children}
    </ResponsiveContainer>
  );
}
