"use client";

import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "excellent" | "good" | "fair" | "poor" | "default" | "outline" | "iris" | "info";
  size?: "sm" | "md";
}

const variantStyles = {
  excellent: "bg-jade-dim text-jade border-jade-border",
  good: "bg-iris-dim text-iris-light border-iris-border",
  fair: "bg-amber-dim text-amber border-amber-border",
  poor: "bg-coral-dim text-coral border-coral-border",
  default: "bg-surface-03 text-text-secondary border-border",
  outline: "bg-transparent text-text-secondary border-border",
  iris: "bg-iris-dim text-iris border-iris-border",
  info: "bg-sky-dim text-sky border-sky-border",
};

const sizeStyles = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-[11px]",
};

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Helper to get badge variant from score
export function getScoreBadgeVariant(
  score: number
): "excellent" | "good" | "fair" | "poor" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

// Score badge with automatic variant
export function ScoreBadge({
  score,
  className,
  ...props
}: { score: number } & Omit<BadgeProps, "variant">) {
  const variant = getScoreBadgeVariant(score);
  return (
    <Badge variant={variant} className={className} {...props}>
      {score}
    </Badge>
  );
}
