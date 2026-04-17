"use client";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps["variant"];
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-text-tertiary">{icon}</div>
      )}
      <h3 className="text-[15px] font-medium text-text-secondary mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-[13px] text-text-tertiary max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant || "ghost"}
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Pre-built empty states for common use cases
export function EmptyStoriesState({ onSync }: { onSync?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 48 48"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect x="8" y="8" width="32" height="32" rx="4" />
          <path d="M16 18h16M16 24h12M16 30h8" />
        </svg>
      }
      title="No stories in this sprint"
      description="Connect JIRA and run a sync to see your backlog"
      action={onSync ? { label: "Sync Now", onClick: onSync } : undefined}
    />
  );
}

export function EmptySignalState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 48 48"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M8 36l8-8 6 6 10-10 8 8" />
          <circle cx="38" cy="10" r="4" />
        </svg>
      }
      title="No updates sent yet"
      description="Draft your first stakeholder update"
      action={onCreate ? { label: "New Update", onClick: onCreate } : undefined}
    />
  );
}

export function EmptyPIState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 48 48"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect x="8" y="12" width="12" height="24" rx="2" />
          <rect x="24" y="8" width="12" height="28" rx="2" />
          <path d="M40 16v20" strokeLinecap="round" />
        </svg>
      }
      title="No Program Increments yet"
      description="Create your first PI to start planning"
      action={onCreate ? { label: "Create PI", onClick: onCreate } : undefined}
    />
  );
}

export function EmptySearchState() {
  return (
    <EmptyState
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 48 48"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <circle cx="20" cy="20" r="12" />
          <path d="M28 28l12 12" strokeLinecap="round" />
        </svg>
      }
      title="No results found"
      description="Try adjusting your search or filters"
    />
  );
}
