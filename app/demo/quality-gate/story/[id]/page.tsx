"use client";

import { use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Lightbulb,
  Copy,
  Check,
  User,
  Calendar,
  Tag,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { useToastActions } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { DEMO_STORIES, DEMO_RUBRIC } from "@/lib/demo/mock-data";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

function DimensionBar({
  name,
  score,
  maxScore,
  description,
}: {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}) {
  const percentage = (score / maxScore) * 100;
  const getColor = () => {
    if (percentage >= 85) return "bg-jade";
    if (percentage >= 70) return "bg-iris";
    if (percentage >= 50) return "bg-amber";
    return "bg-coral";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-text-primary">{name}</span>
          <p className="text-xs text-text-tertiary">{description}</p>
        </div>
        <span className="text-sm font-mono text-text-secondary">
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-2 bg-surface-03 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn("h-full rounded-full", getColor())}
        />
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  index,
}: {
  suggestion: { type: string; current: string; improved: string };
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const toast = useToastActions();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(suggestion.improved);
    setCopied(true);
    toast.success("Copied", "Suggestion copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const typeLabels: Record<string, string> = {
    acceptance_criteria: "Acceptance Criteria",
    description: "Description",
    title: "Title",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-surface-01 border border-border rounded-lg p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber" />
          <span className="text-sm font-medium text-text-primary">
            {typeLabels[suggestion.type] || suggestion.type}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          leftIcon={copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {suggestion.current && (
        <div className="mb-3">
          <div className="text-xs text-text-tertiary mb-1">Current:</div>
          <div className="text-sm text-text-secondary bg-surface-02 rounded p-2 border-l-2 border-coral">
            {suggestion.current || <em className="text-text-tertiary">Empty</em>}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs text-text-tertiary mb-1">Suggested improvement:</div>
        <div className="text-sm text-text-primary bg-jade-dim rounded p-2 border-l-2 border-jade">
          {suggestion.improved}
        </div>
      </div>
    </motion.div>
  );
}

export default function DemoStoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const story = DEMO_STORIES.find((s) => s.id === id);

  if (!story) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Story not found</p>
        <Link href="/demo/quality-gate">
          <Button variant="secondary" className="mt-4">
            Back to Quality Gate
          </Button>
        </Link>
      </div>
    );
  }

  const score = story.score;
  const rubric = DEMO_RUBRIC;

  return (
    <div>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Link href="/demo/quality-gate">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="font-mono text-text-tertiary">{story.jiraKey}</span>
            <span className="text-text-primary">{story.title}</span>
          </div>
        }
        actions={
          <Button variant="secondary" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
            Open in JIRA
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Story Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Story Info */}
          <div className="bg-surface-01 border border-border rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="default">{story.status}</Badge>
              {story.epicKey && (
                <Badge variant="default" className="bg-iris-dim text-iris border-iris/20">
                  {story.epicKey}
                </Badge>
              )}
              {story.storyPoints && (
                <Badge variant="default">{story.storyPoints} points</Badge>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Description</h3>
                <p className="text-sm text-text-primary">
                  {story.description || <em className="text-text-tertiary">No description provided</em>}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Acceptance Criteria</h3>
                <p className="text-sm text-text-primary">
                  {story.acceptanceCriteria || (
                    <em className="text-text-tertiary">No acceptance criteria provided</em>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-text-tertiary" />
                  <span className="text-text-secondary">
                    {story.assigneeId ? "Assigned" : "Unassigned"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-text-tertiary" />
                  <span className="text-text-secondary">
                    Updated {formatDistanceToNow(new Date(story.jiraUpdatedAt as string), { addSuffix: true })}
                  </span>
                </div>
                {story.labels && story.labels.length > 0 && (
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <Tag className="w-4 h-4 text-text-tertiary" />
                    <div className="flex gap-1">
                      {story.labels.map((label) => (
                        <Badge key={label} variant="default" size="sm">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          {score?.aiSuggestions && score.aiSuggestions.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber" />
                AI Suggestions
              </h2>
              <div className="space-y-3">
                {score.aiSuggestions.map((suggestion, index) => (
                  <SuggestionCard key={index} suggestion={suggestion} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Score Breakdown */}
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-surface-01 border border-border rounded-lg p-5">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Quality Score</h3>
            <div className="flex justify-center mb-4">
              <ScoreRing score={score?.totalScore ?? 0} size="xl" />
            </div>
            <div className="text-center text-sm text-text-tertiary">
              Scored {score?.scoredAt ? formatDistanceToNow(new Date(score.scoredAt as string), { addSuffix: true }) : "recently"}
            </div>
          </div>

          {/* Dimension Breakdown */}
          <div className="bg-surface-01 border border-border rounded-lg p-5">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Score Breakdown</h3>
            <div className="space-y-4">
              {rubric.dimensions.map((dimension) => {
                const dimensionScore = score?.[dimension.id as keyof typeof score] as number ?? 0;
                return (
                  <DimensionBar
                    key={dimension.id}
                    name={dimension.name}
                    score={dimensionScore}
                    maxScore={dimension.maxScore}
                    description={dimension.description}
                  />
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-surface-01 border border-border rounded-lg p-5">
            <h3 className="text-sm font-medium text-text-secondary mb-4">Actions</h3>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full">
                Re-score Story
              </Button>
              <Button variant="ghost" className="w-full">
                View Score History
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
