"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from "@/components/ui/tabs";
import { useToastActions } from "@/components/ui/toast";
import { useStory } from "@/hooks/use-stories";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

function DimensionCard({
  name,
  score,
  max,
  reasoning,
}: {
  name: string;
  score: number;
  max: number;
  reasoning: string | null;
}) {
  const percentage = (score / max) * 100;
  const tier = percentage >= 85 ? "excellent" : percentage >= 70 ? "good" : percentage >= 50 ? "fair" : "poor";

  return (
    <motion.div
      variants={staggerItem}
      className="bg-surface-01 border border-border rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text-primary capitalize">
          {name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-text-secondary">
            {score}/{max}
          </span>
          <Badge variant={tier} size="sm">
            {Math.round(percentage)}%
          </Badge>
        </div>
      </div>
      <div className="h-2 bg-surface-03 rounded-full overflow-hidden mb-3">
        <motion.div
          className={cn(
            "h-full rounded-full",
            tier === "excellent" && "bg-jade",
            tier === "good" && "bg-iris",
            tier === "fair" && "bg-amber",
            tier === "poor" && "bg-coral"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">
        {reasoning || "No reasoning available"}
      </p>
    </motion.div>
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

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion.improved);
    setCopied(true);
    toast.success("Copied!", "Suggestion copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      variants={staggerItem}
      className="bg-surface-01 border border-border rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-md bg-iris-dim">
          <Lightbulb className="w-4 h-4 text-iris" />
        </div>
        <span className="text-sm font-medium text-text-primary">
          Suggestion #{index + 1}
        </span>
        <Badge variant="default" size="sm" className="capitalize">
          {suggestion.type.replace("_", " ")}
        </Badge>
      </div>

      {suggestion.current && (
        <div className="mb-3">
          <span className="text-xs text-text-tertiary block mb-1">Current</span>
          <div className="p-2 bg-surface-02 rounded border-l-2 border-coral text-sm text-text-secondary">
            {suggestion.current}
          </div>
        </div>
      )}

      <div>
        <span className="text-xs text-text-tertiary block mb-1">Suggested</span>
        <div className="p-2 bg-surface-02 rounded border-l-2 border-jade text-sm text-text-primary relative group">
          {suggestion.improved}
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1 rounded hover:bg-surface-03 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-jade" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-text-tertiary" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="flex items-start gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-96 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToastActions();
  const [isRescoring, setIsRescoring] = useState(false);
  const [activeTab, setActiveTab] = useState("breakdown");

  const storyId = params.id as string;
  const { data: story, isLoading, error, refetch } = useStory(storyId);

  const handleRescore = async () => {
    if (!story) return;

    setIsRescoring(true);
    try {
      const response = await fetch(`/api/stories/${storyId}/score`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to score story");
      }

      toast.success("Story rescored", "Quality score has been updated");
      refetch();
    } catch (err) {
      toast.error(
        "Scoring failed",
        err instanceof Error ? err.message : "Unable to score story"
      );
    } finally {
      setIsRescoring(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !story) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="w-12 h-12 text-coral mb-4" />
        <h2 className="text-lg font-medium text-text-primary mb-2">
          Story not found
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {error instanceof Error ? error.message : "Unable to load story details"}
        </p>
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go back
        </Button>
      </div>
    );
  }

  const totalScore = story.score?.totalScore || 0;
  const suggestions = story.score?.suggestions || [];
  const dimensions = story.score
    ? {
        completeness: story.score.completeness,
        clarity: story.score.clarity,
        estimability: story.score.estimability,
        traceability: story.score.traceability,
        testability: story.score.testability,
      }
    : null;

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Quality Gate
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <ScoreRing score={totalScore} size="lg" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono text-text-tertiary">
                  {story.jiraKey}
                </span>
                <Badge variant={totalScore >= 70 ? "excellent" : "fair"}>
                  {totalScore >= 85
                    ? "Excellent"
                    : totalScore >= 70
                    ? "Good"
                    : totalScore >= 50
                    ? "Needs Work"
                    : "Poor"}
                </Badge>
                <Badge variant="default">{story.status}</Badge>
              </div>
              <h1 className="text-xl font-display font-bold text-text-primary mb-2">
                {story.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                {story.epicName && <span>{story.epicName}</span>}
                {story.sprintName && <span>{story.sprintName}</span>}
                {story.storyPoints && <span>{story.storyPoints} points</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRescore}
              disabled={isRescoring}
              leftIcon={
                isRescoring ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )
              }
            >
              {isRescoring ? "Scoring..." : "Rescore"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                window.open(
                  `https://company.atlassian.net/browse/${story.jiraKey}`,
                  "_blank"
                )
              }
              leftIcon={<ExternalLink className="w-4 h-4" />}
            >
              Open in JIRA
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface-01 border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text-primary mb-2">
              Description
            </h3>
            <div className="text-sm text-text-secondary whitespace-pre-wrap">
              {story.description || (
                <span className="text-text-tertiary italic">No description</span>
              )}
            </div>
          </div>

          <div className="bg-surface-01 border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text-primary mb-2">
              Acceptance Criteria
            </h3>
            <div className="text-sm text-text-secondary whitespace-pre-wrap">
              {story.acceptanceCriteria || (
                <span className="text-coral flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  No acceptance criteria defined
                </span>
              )}
            </div>
          </div>

          {story.labels && story.labels.length > 0 && (
            <div className="flex items-center gap-2">
              {story.labels.map((label) => (
                <Badge key={label} variant="default">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          {!story.score ? (
            <div className="bg-surface-01 border border-border rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-amber mx-auto mb-3" />
              <h3 className="text-sm font-medium text-text-primary mb-2">
                Not scored yet
              </h3>
              <p className="text-xs text-text-secondary mb-4">
                This story hasn&apos;t been analyzed by the AI scoring engine.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRescore}
                isLoading={isRescoring}
              >
                Score Now
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsListUnderline>
                <TabsTriggerUnderline value="breakdown">
                  Breakdown
                </TabsTriggerUnderline>
                <TabsTriggerUnderline value="suggestions">
                  Suggestions
                  {suggestions.length > 0 && (
                    <Badge variant="iris" size="sm" className="ml-1">
                      {suggestions.length}
                    </Badge>
                  )}
                </TabsTriggerUnderline>
              </TabsListUnderline>

              <TabsContent value="breakdown" className="mt-4">
                {dimensions && (
                  <motion.div
                    className="space-y-3"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {Object.entries(dimensions).map(([key, dim]) =>
                      dim ? (
                        <DimensionCard
                          key={key}
                          name={key}
                          score={dim.score}
                          max={dim.max}
                          reasoning={dim.reasoning}
                        />
                      ) : null
                    )}
                  </motion.div>
                )}

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-text-tertiary">
                    Last scored {formatTime(story.score.scoredAt)}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="suggestions" className="mt-4">
                {suggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-jade mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">
                      No suggestions - this story meets quality standards
                    </p>
                  </div>
                ) : (
                  <motion.div
                    className="space-y-3"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {suggestions.map((suggestion, i) => (
                      <SuggestionCard
                        key={i}
                        suggestion={suggestion}
                        index={i}
                      />
                    ))}
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
