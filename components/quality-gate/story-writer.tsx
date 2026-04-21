"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Loader2,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea, Input } from "@/components/ui/input";
import { useToastActions } from "@/components/ui/toast";
import { AnimatedCard } from "@/components/ui/animated";
import { cn } from "@/lib/utils";

interface GeneratedStory {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  labels: string[];
  notes: string;
  generatedAt: string;
}

interface StoryWriterProps {
  projectContext?: string;
  onStoryGenerated?: (story: GeneratedStory) => void;
  className?: string;
}

export function StoryWriter({ projectContext, onStoryGenerated, className }: StoryWriterProps) {
  const toast = useToastActions();
  const [briefDescription, setBriefDescription] = useState("");
  const [epicName, setEpicName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!briefDescription.trim() || briefDescription.length < 10) {
      toast.warning("Description too short", "Please provide at least 10 characters");
      return;
    }

    setIsGenerating(true);
    setGeneratedStory(null);

    try {
      const response = await fetch("/api/ai/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefDescription: briefDescription.trim(),
          projectContext,
          epicName: epicName.trim() || undefined,
          targetAudience: targetAudience.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate story");
      }

      const story = await response.json();
      setGeneratedStory(story);
      onStoryGenerated?.(story);

      toast.success("Story generated", "Review and refine before adding to your backlog");
    } catch {
      toast.error("Generation failed", "Please try again");
    } finally {
      setIsGenerating(false);
    }
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

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className="p-1 text-text-tertiary hover:text-text-secondary transition-colors"
      title="Copy to clipboard"
    >
      {copiedField === field ? (
        <Check className="w-4 h-4 text-jade" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Input Section */}
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

          {/* Advanced Options */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Advanced options
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || briefDescription.length < 10}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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

      {/* Generated Story Output */}
      <AnimatePresence>
        {generatedStory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AnimatedCard className="p-5 border-iris/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5 text-iris" />
                  Generated Story
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw className={cn("w-4 h-4 mr-1", isGenerating && "animate-spin")} />
                  Regenerate
                </Button>
              </div>

              {/* Title */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                    Title
                  </span>
                  <CopyButton text={generatedStory.title} field="title" />
                </div>
                <p className="text-lg font-medium text-text-primary">
                  {generatedStory.title}
                </p>
              </div>

              {/* Description */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                    Description
                  </span>
                  <CopyButton text={generatedStory.description} field="description" />
                </div>
                <div className="p-3 bg-surface-02 rounded-lg">
                  <p className="text-sm text-text-primary whitespace-pre-wrap">
                    {generatedStory.description}
                  </p>
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                    Acceptance Criteria
                  </span>
                  <CopyButton text={formatAcceptanceCriteria()} field="ac" />
                </div>
                <div className="p-3 bg-surface-02 rounded-lg space-y-2">
                  {generatedStory.acceptanceCriteria.map((ac, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs text-text-tertiary font-mono mt-0.5">
                        {i + 1}.
                      </span>
                      <p className="text-sm text-text-primary">{ac}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Story Points & Labels */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm text-text-secondary">Story Points:</span>
                  <Badge variant="default" className="font-mono">
                    {generatedStory.storyPoints}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-text-tertiary" />
                  <div className="flex gap-1">
                    {generatedStory.labels.map((label) => (
                      <Badge key={label} variant="default" size="sm">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {generatedStory.notes && (
                <div className="p-3 bg-amber-dim border border-amber/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-text-primary">{generatedStory.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
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
      </AnimatePresence>
    </div>
  );
}
