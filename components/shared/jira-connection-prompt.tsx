"use client";

import { motion } from "framer-motion";
import { Link2, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JiraConnectionPromptProps {
  variant?: "banner" | "card" | "inline";
  className?: string;
}

export function JiraConnectionPrompt({
  variant = "banner",
  className,
}: JiraConnectionPromptProps) {
  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "mb-6 p-4 rounded-lg border border-amber/30 bg-amber/5",
          "flex items-center justify-between gap-4",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber/10">
            <AlertCircle className="w-5 h-5 text-amber" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              Connect JIRA to see your data
            </p>
            <p className="text-xs text-text-secondary">
              Sync your sprints, stories, and backlog to unlock AI-powered insights.
            </p>
          </div>
        </div>
        <Link href="/settings/jira">
          <Button size="sm">
            Connect JIRA
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </motion.div>
    );
  }

  if (variant === "card") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4",
          "rounded-lg border border-dashed border-border bg-surface-01",
          className
        )}
      >
        <div className="w-16 h-16 rounded-full bg-surface-02 flex items-center justify-center mb-4">
          <Link2 className="w-8 h-8 text-text-tertiary" />
        </div>
        <h3 className="text-lg font-medium text-text-primary mb-2">
          No data yet
        </h3>
        <p className="text-sm text-text-secondary text-center max-w-md mb-6">
          Connect your JIRA workspace to start seeing sprint health, story scores,
          and AI-powered insights on this page.
        </p>
        <Link href="/settings/jira">
          <Button>
            Connect JIRA
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </motion.div>
    );
  }

  // inline variant
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-sm text-text-secondary",
        className
      )}
    >
      <AlertCircle className="w-4 h-4 text-amber" />
      <span>
        <Link href="/settings/jira" className="text-iris hover:underline">
          Connect JIRA
        </Link>{" "}
        to see your data
      </span>
    </div>
  );
}
