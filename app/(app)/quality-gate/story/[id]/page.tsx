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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from "@/components/ui/tabs";
import { useToastActions } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

// Mock data - replace with real data fetching
const mockStory = {
  id: "1",
  jiraKey: "PROJ-123",
  title: "Implement user authentication flow with OAuth2",
  description: `As a user, I want to sign in with Google so that I can access my account securely without remembering another password.

**Technical Notes:**
- Use NextAuth.js for OAuth implementation
- Support Google OAuth provider initially
- Store session tokens securely in HTTP-only cookies`,
  acceptanceCriteria: `- User can click "Sign in with Google" button
- User is redirected to Google OAuth consent screen
- After consent, user is redirected back and logged in
- Session persists across browser refreshes`,
  storyPoints: 5,
  status: "In Progress",
  assignee: { name: "John Doe", avatar: null },
  epic: { key: "AUTH", name: "Authentication & Authorization" },
  sprint: { id: "sprint-22", name: "Sprint 22" },
  labels: ["security", "auth", "mvp"],
  jiraUrl: "https://company.atlassian.net/browse/PROJ-123",
  score: {
    totalScore: 85,
    scoredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    dimensions: {
      completeness: { score: 22, max: 25, reasoning: "Story has title, description, and acceptance criteria. Missing explicit definition of done." },
      clarity: { score: 20, max: 25, reasoning: "Clear user story format with technical notes. Language is specific and actionable." },
      estimability: { score: 18, max: 20, reasoning: "5 story points assigned. Scope is well-defined and achievable within a sprint." },
      traceability: { score: 14, max: 15, reasoning: "Linked to AUTH epic, has appropriate labels, assigned to sprint." },
      testability: { score: 11, max: 15, reasoning: "Acceptance criteria are testable but could be more specific about error cases." },
    },
    suggestions: [
      {
        type: "acceptance_criteria",
        current: "Session persists across browser refreshes",
        improved: "Given a logged-in user, when they close and reopen the browser within 24 hours, then they remain logged in without re-authenticating",
      },
      {
        type: "acceptance_criteria",
        current: "",
        improved: "Given a user denies OAuth consent, when redirected back to the app, then they see a clear error message and option to retry",
      },
    ],
  },
};

function DimensionCard({
  name,
  score,
  max,
  reasoning,
}: {
  name: string;
  score: number;
  max: number;
  reasoning: string;
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
      <p className="text-xs text-text-secondary leading-relaxed">{reasoning}</p>
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

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToastActions();
  const [isRescoring, setIsRescoring] = useState(false);
  const [activeTab, setActiveTab] = useState("breakdown");

  // TODO: Use storyId to fetch real story data from API instead of mock data
  const storyId = params.id as string;
  // Placeholder to mark storyId as used until real data fetching is implemented
  void storyId;

  const handleRescore = async () => {
    setIsRescoring(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRescoring(false);
    toast.success("Story rescored", "Quality score has been updated");
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

  return (
    <div>
      {/* Header */}
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
            <ScoreRing score={mockStory.score.totalScore} size="lg" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono text-text-tertiary">
                  {mockStory.jiraKey}
                </span>
                <Badge variant={mockStory.score.totalScore >= 70 ? "excellent" : "fair"}>
                  {mockStory.score.totalScore >= 85
                    ? "Excellent"
                    : mockStory.score.totalScore >= 70
                    ? "Good"
                    : mockStory.score.totalScore >= 50
                    ? "Needs Work"
                    : "Poor"}
                </Badge>
                <Badge variant="default">{mockStory.status}</Badge>
              </div>
              <h1 className="text-xl font-display font-bold text-text-primary mb-2">
                {mockStory.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span>{mockStory.epic.name}</span>
                <span>{mockStory.sprint.name}</span>
                <span>{mockStory.storyPoints} points</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRescore}
              isLoading={isRescoring}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Rescore
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(mockStory.jiraUrl, "_blank")}
              leftIcon={<ExternalLink className="w-4 h-4" />}
            >
              Open in JIRA
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Story Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <div className="bg-surface-01 border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text-primary mb-2">
              Description
            </h3>
            <div className="text-sm text-text-secondary whitespace-pre-wrap">
              {mockStory.description}
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div className="bg-surface-01 border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text-primary mb-2">
              Acceptance Criteria
            </h3>
            <div className="text-sm text-text-secondary whitespace-pre-wrap">
              {mockStory.acceptanceCriteria || (
                <span className="text-coral flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  No acceptance criteria defined
                </span>
              )}
            </div>
          </div>

          {/* Labels */}
          <div className="flex items-center gap-2">
            {mockStory.labels.map((label) => (
              <Badge key={label} variant="default">
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Right: Score Analysis */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsListUnderline>
              <TabsTriggerUnderline value="breakdown">
                Breakdown
              </TabsTriggerUnderline>
              <TabsTriggerUnderline value="suggestions">
                Suggestions
                {mockStory.score.suggestions.length > 0 && (
                  <Badge variant="iris" size="sm" className="ml-1">
                    {mockStory.score.suggestions.length}
                  </Badge>
                )}
              </TabsTriggerUnderline>
            </TabsListUnderline>

            <TabsContent value="breakdown" className="mt-4">
              <motion.div
                className="space-y-3"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {Object.entries(mockStory.score.dimensions).map(([key, dim]) => (
                  <DimensionCard
                    key={key}
                    name={key}
                    score={dim.score}
                    max={dim.max}
                    reasoning={dim.reasoning}
                  />
                ))}
              </motion.div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-text-tertiary">
                  Last scored {formatTime(mockStory.score.scoredAt)}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="mt-4">
              {mockStory.score.suggestions.length === 0 ? (
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
                  {mockStory.score.suggestions.map((suggestion, i) => (
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
        </div>
      </div>
    </div>
  );
}
