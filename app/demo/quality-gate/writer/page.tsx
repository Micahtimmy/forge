"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wand2,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Tag,
  Hash,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea, Input } from "@/components/ui/input";
import { useToastActions } from "@/components/ui/toast";
import { AnimatedCard } from "@/components/ui/animated";
import { InfoPanel } from "@/components/ui/info-tip";
import { cn } from "@/lib/utils";

const DEMO_GENERATED_STORIES: Record<string, {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  labels: string[];
  notes: string;
}> = {
  "payment": {
    title: "Implement Verve Card Payment Flow",
    description: `As a customer, I want to pay using my Verve card so that I can complete purchases using my preferred local card scheme.

## Context
Verve is Nigeria's domestic card scheme and a significant portion of our users prefer it over international cards. Supporting Verve payments will increase conversion rates for Nigerian users.

## Scope
- In scope: Card validation, authorization flow, success/error handling
- Out of scope: Card saving for future use, recurring payments`,
    acceptanceCriteria: [
      "Given valid Verve card details (16-digit PAN starting with 506), when user submits payment, then transaction is authorized within 3 seconds",
      "Given insufficient funds on Verve card, when user submits payment, then clear error message 'Insufficient funds' is displayed with option to retry",
      "Given expired Verve card, when user submits payment, then user is prompted to use a different card with message 'Card has expired'",
      "Given network timeout during authorization, when transaction fails, then user sees 'Connection issue' message with automatic retry option",
    ],
    storyPoints: 5,
    labels: ["payments", "verve", "mvp", "high-priority"],
    notes: "Consider implementing idempotency keys to handle retry scenarios safely. Coordinate with the fraud detection team for Verve-specific rules.",
  },
  "dark": {
    title: "Add Theme Toggle for Dark/Light Mode",
    description: `As a user, I want to switch between dark and light themes so that I can use the application comfortably in different lighting conditions.

## Context
Many users prefer dark mode for reduced eye strain, especially during evening hours. This feature should respect system preferences by default but allow manual override.

## Scope
- In scope: Toggle component, theme persistence, system preference detection
- Out of scope: Custom color themes, scheduled auto-switching`,
    acceptanceCriteria: [
      "Given a user on any page, when they click the theme toggle, then the entire UI switches between dark and light mode within 200ms",
      "Given a user has selected a theme preference, when they close and reopen the app, then their preference is preserved",
      "Given a new user with system preference set to dark mode, when they first visit the app, then dark mode is applied automatically",
      "Given theme is toggled, when viewing any page, then all text remains readable with WCAG AA contrast compliance",
    ],
    storyPoints: 3,
    labels: ["ui", "accessibility", "user-preference"],
    notes: "Use CSS custom properties for smooth transitions. Store preference in localStorage with a fallback to system preference.",
  },
  "default": {
    title: "User Authentication Enhancement",
    description: `As a user, I want a seamless authentication experience so that I can securely access my account with minimal friction.

## Context
Improving the login flow will reduce drop-off rates and enhance security posture.

## Scope
- In scope: Core authentication flow improvements
- Out of scope: Social login integrations`,
    acceptanceCriteria: [
      "Given valid credentials, when user submits login form, then they are authenticated within 2 seconds",
      "Given invalid credentials, when user submits login form, then a clear error message is displayed",
      "Given successful authentication, when session is created, then user is redirected to their intended destination",
    ],
    storyPoints: 5,
    labels: ["auth", "security", "user-experience"],
    notes: "Consider rate limiting to prevent brute force attacks.",
  },
};

function getGeneratedStory(input: string) {
  const lower = input.toLowerCase();
  if (lower.includes("pay") || lower.includes("verve") || lower.includes("card")) {
    return DEMO_GENERATED_STORIES["payment"];
  }
  if (lower.includes("dark") || lower.includes("light") || lower.includes("theme") || lower.includes("mode")) {
    return DEMO_GENERATED_STORIES["dark"];
  }
  return DEMO_GENERATED_STORIES["default"];
}

function CopyButton({
  text,
  field,
  copiedField,
  onCopy,
}: {
  text: string;
  field: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  return (
    <button
      onClick={() => onCopy(text, field)}
      className="p-1 text-text-tertiary hover:text-text-secondary transition-colors"
    >
      {copiedField === field ? (
        <Check className="w-4 h-4 text-jade" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

export default function DemoStoryWriterPage() {
  const toast = useToastActions();
  const [briefDescription, setBriefDescription] = useState("");
  const [epicName, setEpicName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<typeof DEMO_GENERATED_STORIES["payment"] | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!briefDescription.trim() || briefDescription.length < 10) {
      toast.warning("Description too short", "Please provide at least 10 characters");
      return;
    }

    setIsGenerating(true);
    setGeneratedStory(null);

    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));

    const story = getGeneratedStory(briefDescription);
    setGeneratedStory(story);
    setIsGenerating(false);

    toast.success("Story generated", "Review and refine before adding to your backlog");
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatAcceptanceCriteria = (): string => {
    if (!generatedStory) return "";
    return generatedStory.acceptanceCriteria
      .map((ac, i) => `${i + 1}. ${ac}`)
      .join("\n");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Story Writer"
        description="Transform brief ideas into well-structured, ready-to-refine user stories"
      />

      <div className="space-y-6">
        <InfoPanel termKey="acceptanceCriteria" />

        <AnimatedCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-iris-dim flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-iris" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Story Writer AI</h3>
              <p className="text-sm text-text-secondary">
                Transform brief descriptions into well-formed stories
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Describe what you want to build
              </label>
              <Textarea
                value={briefDescription}
                onChange={(e) => setBriefDescription(e.target.value)}
                placeholder="e.g., User can pay with Verve card, Add dark mode toggle, Implement password reset flow..."
                rows={3}
                className="resize-none"
              />
              <p className="mt-1 text-xs text-text-tertiary">
                {briefDescription.length}/500 characters
              </p>
            </div>

            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Advanced options
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Epic name (optional)
                    </label>
                    <Input
                      value={epicName}
                      onChange={(e) => setEpicName(e.target.value)}
                      placeholder="e.g., Payment Gateway"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Target user (optional)
                    </label>
                    <Input
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g., Mobile app user"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || briefDescription.length < 10}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 mr-2"
                  >
                    <Wand2 className="w-4 h-4" />
                  </motion.div>
                  Generating story...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Story
                </>
              )}
            </Button>
          </div>
        </AnimatedCard>

        {generatedStory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AnimatedCard className="p-5 border-iris/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5 text-iris" />
                  Generated Story
                </h4>
                <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                  <RefreshCw className={cn("w-4 h-4 mr-1", isGenerating && "animate-spin")} />
                  Regenerate
                </Button>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Title</span>
                  <CopyButton text={generatedStory.title} field="title" copiedField={copiedField} onCopy={copyToClipboard} />
                </div>
                <p className="text-lg font-medium text-text-primary">{generatedStory.title}</p>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Description</span>
                  <CopyButton text={generatedStory.description} field="description" copiedField={copiedField} onCopy={copyToClipboard} />
                </div>
                <div className="p-3 bg-surface-02 rounded-lg">
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{generatedStory.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                    Acceptance Criteria
                  </span>
                  <CopyButton text={formatAcceptanceCriteria()} field="ac" copiedField={copiedField} onCopy={copyToClipboard} />
                </div>
                <div className="p-3 bg-surface-02 rounded-lg space-y-2">
                  {generatedStory.acceptanceCriteria.map((ac, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs text-text-tertiary font-mono mt-0.5">{i + 1}.</span>
                      <p className="text-sm text-text-primary">{ac}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm text-text-secondary">Story Points:</span>
                  <Badge variant="default" className="font-mono">{generatedStory.storyPoints}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-text-tertiary" />
                  <div className="flex gap-1">
                    {generatedStory.labels.map((label) => (
                      <Badge key={label} variant="default" size="sm">{label}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {generatedStory.notes && (
                <div className="p-3 bg-amber-dim border border-amber/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-text-primary">{generatedStory.notes}</p>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `${generatedStory.title}\n\n${generatedStory.description}\n\nAcceptance Criteria:\n${formatAcceptanceCriteria()}`,
                      "all"
                    )
                  }
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy All
                </Button>
                <Button size="sm" disabled>
                  Push to JIRA (Coming Soon)
                </Button>
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
