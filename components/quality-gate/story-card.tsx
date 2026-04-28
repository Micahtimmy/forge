"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lightbulb,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreRing } from "@/components/ui/score-ring";
import { Badge, getScoreBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { springExpand } from "@/lib/motion/variants";
import type { StoryWithScore, ScoreDimension, AISuggestion } from "@/types/story";

interface StoryCardProps {
  story: StoryWithScore;
  onViewDetails?: () => void;
  delay?: number;
}

function getDimensionsFromScore(story: StoryWithScore): ScoreDimension[] {
  const score = story.score;
  if (!score) {
    return [
      { name: "Completeness", key: "completeness", score: 0, maxScore: 25 },
      { name: "Clarity", key: "clarity", score: 0, maxScore: 25 },
      { name: "Estimability", key: "estimability", score: 0, maxScore: 20 },
      { name: "Traceability", key: "traceability", score: 0, maxScore: 15 },
      { name: "Testability", key: "testability", score: 0, maxScore: 15 },
    ];
  }

  const dimensions: ScoreDimension[] = [];

  if (score.completeness !== null && score.completeness !== undefined) {
    const comp = score.completeness as { score?: number; max?: number } | null;
    if (comp && typeof comp === "object") {
      dimensions.push({ name: "Completeness", key: "completeness", score: comp.score ?? 0, maxScore: comp.max ?? 25 });
    }
  } else {
    dimensions.push({ name: "Completeness", key: "completeness", score: Math.round((score.totalScore / 100) * 25), maxScore: 25 });
  }

  if (score.clarity !== null && score.clarity !== undefined) {
    const clar = score.clarity as { score?: number; max?: number } | null;
    if (clar && typeof clar === "object") {
      dimensions.push({ name: "Clarity", key: "clarity", score: clar.score ?? 0, maxScore: clar.max ?? 25 });
    }
  } else {
    dimensions.push({ name: "Clarity", key: "clarity", score: Math.round((score.totalScore / 100) * 25), maxScore: 25 });
  }

  if (score.estimability !== null && score.estimability !== undefined) {
    const est = score.estimability as { score?: number; max?: number } | null;
    if (est && typeof est === "object") {
      dimensions.push({ name: "Estimability", key: "estimability", score: est.score ?? 0, maxScore: est.max ?? 20 });
    }
  } else {
    dimensions.push({ name: "Estimability", key: "estimability", score: Math.round((score.totalScore / 100) * 20), maxScore: 20 });
  }

  if (score.traceability !== null && score.traceability !== undefined) {
    const trace = score.traceability as { score?: number; max?: number } | null;
    if (trace && typeof trace === "object") {
      dimensions.push({ name: "Traceability", key: "traceability", score: trace.score ?? 0, maxScore: trace.max ?? 15 });
    }
  } else {
    dimensions.push({ name: "Traceability", key: "traceability", score: Math.round((score.totalScore / 100) * 15), maxScore: 15 });
  }

  if (score.testability !== null && score.testability !== undefined) {
    const test = score.testability as { score?: number; max?: number } | null;
    if (test && typeof test === "object") {
      dimensions.push({ name: "Testability", key: "testability", score: test.score ?? 0, maxScore: test.max ?? 15 });
    }
  } else {
    dimensions.push({ name: "Testability", key: "testability", score: Math.round((score.totalScore / 100) * 15), maxScore: 15 });
  }

  return dimensions;
}

function getSuggestionsFromScore(story: StoryWithScore): AISuggestion[] {
  const score = story.score;
  if (!score || !score.aiSuggestions) {
    if (score && score.totalScore < 70) {
      return [{
        type: "acceptance_criteria",
        current: "No acceptance criteria defined",
        improved: "Add clear, testable acceptance criteria with specific conditions and expected outcomes",
      }];
    }
    return [];
  }

  const suggestions = score.aiSuggestions as AISuggestion[] | null;
  return suggestions || [];
}

function DimensionBar({ dimension }: { dimension: ScoreDimension }) {
  const percentage = (dimension.score / dimension.maxScore) * 100;
  const variant = getScoreBadgeVariant(percentage);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">{dimension.name}</span>
        <span className="font-mono text-text-tertiary">
          {dimension.score}/{dimension.maxScore}
        </span>
      </div>
      <div className="h-1.5 bg-surface-03 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            variant === "excellent" && "bg-jade",
            variant === "good" && "bg-iris",
            variant === "fair" && "bg-amber",
            variant === "poor" && "bg-coral"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: AISuggestion }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion.improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // TODO: Implement Apply to JIRA functionality
  // This should call an API endpoint that updates the JIRA issue with the improved text
  // The endpoint needs to be created at /api/jira/apply-suggestion
  // It should accept: storyId, suggestionType, improvedText
  // and use the JIRA API to update the appropriate field
  const handleApplyToJira = () => {
    // Not yet implemented - will be handled by /api/jira/apply-suggestion
    void suggestion;
  };

  return (
    <div className="p-3 bg-surface-02 rounded-lg border border-border space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <Lightbulb className="w-3.5 h-3.5 text-amber" />
        <span className="font-medium text-text-primary capitalize">
          {suggestion.type.replace("_", " ")}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-text-tertiary line-through">
          {suggestion.current}
        </p>
        <p className="text-sm text-text-primary">{suggestion.improved}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="xs" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </Button>
        <Button variant="ghost" size="xs" onClick={handleApplyToJira}>
          Apply to JIRA
        </Button>
      </div>
    </div>
  );
}

export function StoryCard({ story, onViewDetails, delay = 0 }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const score = story.score?.totalScore ?? 0;
  const tier = getScoreBadgeVariant(score);

  const dimensions = getDimensionsFromScore(story);
  const suggestions = getSuggestionsFromScore(story);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: delay / 1000 }}
      className={cn(
        "bg-surface-01 border rounded-lg overflow-hidden",
        "border-l-[3px] transition-all",
        tier === "excellent" && "border-l-jade border-border",
        tier === "good" && "border-l-iris border-border",
        tier === "fair" && "border-l-amber border-border",
        tier === "poor" && "border-l-coral border-border",
        expanded && "border-border-strong"
      )}
    >
      {/* Main Content */}
      <div
        className="p-4 cursor-pointer hover:bg-surface-02 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          {/* Score Ring */}
          <ScoreRing score={score} size="md" delay={delay} />

          {/* Story Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-text-tertiary">
                {story.jiraKey}
              </span>
              {story.status && (
                <Badge variant="default" size="sm">
                  {story.status}
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-medium text-text-primary truncate">
              {story.title}
            </h3>
            <div className="flex items-center gap-3 mt-2">
              {story.epicKey && (
                <Tooltip content={`Epic: ${story.epicKey}`}>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-iris-dim text-iris">
                    {story.epicKey}
                  </span>
                </Tooltip>
              )}
              {story.storyPoints && (
                <span className="text-xs font-mono text-text-tertiary">
                  {story.storyPoints} pts
                </span>
              )}
              {story.assigneeId && (
                <Avatar size="xs" alt="Assignee" />
              )}
              {story.labels?.map((label) => (
                <span
                  key={label}
                  className="text-xs px-1.5 py-0.5 rounded bg-surface-03 text-text-secondary"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Expand Toggle */}
          <button className="p-1 text-text-tertiary hover:text-text-primary transition-colors">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            variants={springExpand}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
              {/* Score Breakdown */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-3">
                  Score Breakdown
                </h4>
                <div className="space-y-2">
                  {dimensions.map((dim) => (
                    <DimensionBar key={dim.key} dimension={dim} />
                  ))}
                </div>
              </div>

              {/* AI Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-3">
                    AI Suggestions
                  </h4>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, i) => (
                      <SuggestionCard key={i} suggestion={suggestion} />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={onViewDetails}>
                  View Full Analysis
                </Button>
                {story.jiraKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // JIRA browse URL format: https://<domain>.atlassian.net/browse/<KEY>
                      // Since we do not store the JIRA domain on the story, we use a relative path
                      // that the JIRA integration should resolve, or open a configured base URL
                      // For now, attempt to open using a common pattern - the actual domain
                      // should come from workspace settings in production
                      const jiraUrl = `https://jira.atlassian.com/browse/${story.jiraKey}`;
                      window.open(jiraUrl, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open in JIRA
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
