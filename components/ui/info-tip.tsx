"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ExternalLink, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGlossaryTerm } from "@/lib/glossary";
import { Tooltip } from "@/components/ui/tooltip";

interface InfoTipProps {
  termKey: string;
  className?: string;
  iconSize?: "sm" | "md";
  inline?: boolean;
}

export function InfoTip({ termKey, className, iconSize = "sm", inline = false }: InfoTipProps) {
  const term = getGlossaryTerm(termKey);

  if (!term) return null;

  const sizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
  };

  const tooltipContent = (
    <div className="max-w-xs">
      <p className="font-semibold text-text-primary mb-1">{term.term}</p>
      <p className="text-xs text-text-secondary">{term.short}</p>
      {term.example && (
        <p className="mt-2 text-xs text-text-tertiary flex items-start gap-1">
          <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber" />
          {term.example}
        </p>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <button
        className={cn(
          "text-text-tertiary hover:text-text-secondary transition-colors",
          inline && "inline-flex items-center align-middle ml-1",
          className
        )}
        aria-label={`Learn about ${term.term}`}
      >
        <HelpCircle className={sizes[iconSize]} />
      </button>
    </Tooltip>
  );
}

interface InfoPanelProps {
  termKey: string;
  className?: string;
}

export function InfoPanel({ termKey, className }: InfoPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const term = getGlossaryTerm(termKey);

  if (!term) return null;

  return (
    <div className={cn("bg-surface-02 border border-border rounded-lg", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-iris-dim flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-4 h-4 text-iris" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-text-primary">{term.term}</h4>
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              className="text-text-tertiary"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.span>
          </div>
          <p className="text-sm text-text-secondary mt-1">{term.short}</p>
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <div className="pl-11 border-t border-border pt-4">
                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                    {term.full}
                  </p>
                </div>
                {term.example && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-text-tertiary bg-surface-03 rounded-lg p-3">
                    <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber" />
                    <span>{term.example}</span>
                  </div>
                )}
                {term.learnMoreUrl && (
                  <a
                    href={term.learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-iris hover:text-iris-light"
                  >
                    Learn more
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface LabelWithInfoProps {
  label: string;
  termKey: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "span" | "div";
}

export function LabelWithInfo({
  label,
  termKey,
  className,
  as: Component = "span",
}: LabelWithInfoProps) {
  return (
    <Component className={cn("inline-flex items-center gap-1.5", className)}>
      {label}
      <InfoTip termKey={termKey} />
    </Component>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  termKey?: string;
  trend?: { value: number; positive?: boolean };
  className?: string;
}

export function MetricCard({
  label,
  value,
  termKey,
  trend,
  className,
}: MetricCardProps) {
  return (
    <div className={cn("bg-surface-01 border border-border rounded-lg p-4", className)}>
      <div className="flex items-center gap-1.5 text-sm text-text-secondary mb-1">
        {label}
        {termKey && <InfoTip termKey={termKey} />}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-text-primary font-mono">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-sm font-medium mb-0.5",
              trend.positive !== false && trend.value >= 0 ? "text-jade" : "text-coral"
            )}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
