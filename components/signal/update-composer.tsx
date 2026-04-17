"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  Copy,
  Check,
  Mail,
  MessageSquare,
  FileText,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LabeledSlider } from "@/components/ui/slider";
import { Checkbox, CheckboxWithLabel } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  type AudienceType,
  type ToneLevel,
  audienceLabels,
  audienceDescriptions,
  toneLabels,
} from "@/types/signal";

interface UpdateComposerProps {
  context: {
    sprintName: string;
    completedStories?: Array<{ key: string; title: string; points?: number }>;
    inProgressStories?: Array<{ key: string; title: string; progress?: number }>;
    blockers?: Array<{ description: string; impact: string }>;
    velocityTarget?: number;
    velocityActual?: number;
    highlights?: string[];
    risks?: string[];
  };
  onSend?: (audiences: AudienceType[], content: Record<AudienceType, string>) => void;
}

const allAudiences: AudienceType[] = ["executive", "team", "client", "board"];

export function UpdateComposer({ context, onSend }: UpdateComposerProps) {
  const [selectedAudiences, setSelectedAudiences] = useState<AudienceType[]>([
    "executive",
    "team",
  ]);
  const [tone, setTone] = useState<ToneLevel>(3);
  const [additionalContext, setAdditionalContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingAudience, setGeneratingAudience] = useState<AudienceType | null>(null);
  const [drafts, setDrafts] = useState<Record<AudienceType, string>>({
    executive: "",
    team: "",
    client: "",
    board: "",
  });
  const [activeTab, setActiveTab] = useState<AudienceType>("executive");
  const [copiedAudience, setCopiedAudience] = useState<AudienceType | null>(null);

  const toggleAudience = (audience: AudienceType) => {
    setSelectedAudiences((prev) =>
      prev.includes(audience)
        ? prev.filter((a) => a !== audience)
        : [...prev, audience]
    );
  };

  const generateDrafts = async () => {
    if (selectedAudiences.length === 0) return;

    setIsGenerating(true);

    for (const audience of selectedAudiences) {
      setGeneratingAudience(audience);
      setActiveTab(audience);

      try {
        const response = await fetch("/api/ai/generate-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context: {
              ...context,
              additionalContext: additionalContext || undefined,
            },
            audience,
            tone,
          }),
        });

        if (!response.ok) throw new Error("Failed to generate");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let content = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n\n").filter(Boolean);

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.chunk) {
                  content += data.chunk;
                  setDrafts((prev) => ({ ...prev, [audience]: content }));
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to generate ${audience} draft:`, error);
      }
    }

    setIsGenerating(false);
    setGeneratingAudience(null);
  };

  const copyToClipboard = async (audience: AudienceType) => {
    await navigator.clipboard.writeText(drafts[audience]);
    setCopiedAudience(audience);
    setTimeout(() => setCopiedAudience(null), 2000);
  };

  const handleSend = () => {
    if (onSend) {
      onSend(selectedAudiences, drafts);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Context & Settings */}
      <div className="space-y-6">
        {/* Context Summary */}
        <div className="bg-surface-01 border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Sprint Context
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Sprint</span>
              <span className="text-text-primary font-medium">
                {context.sprintName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Completed</span>
              <span className="text-jade font-mono">
                {context.completedStories?.length ?? 0} stories
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">In Progress</span>
              <span className="text-amber font-mono">
                {context.inProgressStories?.length ?? 0} stories
              </span>
            </div>
            {context.blockers && context.blockers.length > 0 && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Blockers</span>
                <span className="text-coral font-mono">
                  {context.blockers.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Audience Selection */}
        <div className="bg-surface-01 border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Select Audiences
          </h3>
          <motion.div
            className="space-y-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {allAudiences.map((audience) => (
              <motion.div key={audience} variants={staggerItem}>
                <CheckboxWithLabel
                  label={audienceLabels[audience]}
                  description={audienceDescriptions[audience]}
                  checked={selectedAudiences.includes(audience)}
                  onCheckedChange={() => toggleAudience(audience)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Tone Slider */}
        <div className="bg-surface-01 border border-border rounded-lg p-4">
          <LabeledSlider
            label="Communication Tone"
            minLabel="Formal"
            maxLabel="Casual"
            value={[tone]}
            onValueChange={(v) => setTone(v[0] as ToneLevel)}
            min={1}
            max={5}
            step={1}
          />
          <div className="text-center mt-2">
            <Badge variant="good">{toneLabels[tone]}</Badge>
          </div>
        </div>

        {/* Additional Context */}
        <div className="bg-surface-01 border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Additional Context
          </h3>
          <Textarea
            placeholder="Add any notes or context the AI should consider..."
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            rows={3}
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateDrafts}
          disabled={selectedAudiences.length === 0 || isGenerating}
          isLoading={isGenerating}
          className="w-full"
        >
          {isGenerating
            ? `Generating ${generatingAudience}...`
            : "Generate Drafts"}
        </Button>
      </div>

      {/* Right Panel - Drafts */}
      <div className="lg:col-span-2">
        <div className="bg-surface-01 border border-border rounded-lg overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AudienceType)}>
            <div className="border-b border-border px-4">
              <TabsList className="bg-transparent border-0 p-0 h-12">
                {selectedAudiences.map((audience) => (
                  <TabsTrigger
                    key={audience}
                    value={audience}
                    className={cn(
                      "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                      "border-b-2 border-transparent data-[state=active]:border-iris rounded-none h-12",
                      generatingAudience === audience && "animate-pulse"
                    )}
                  >
                    {audienceLabels[audience].split(" ")[0]}
                    {generatingAudience === audience && (
                      <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {selectedAudiences.map((audience) => (
              <TabsContent key={audience} value={audience} className="p-0 m-0">
                <div className="p-4">
                  {/* Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-text-tertiary">
                      {drafts[audience]
                        ? `${drafts[audience].split(" ").length} words`
                        : "No draft yet"}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => copyToClipboard(audience)}
                        disabled={!drafts[audience]}
                      >
                        {copiedAudience === audience ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setSelectedAudiences([audience]);
                          generateDrafts();
                        }}
                        disabled={isGenerating}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Regenerate
                      </Button>
                    </div>
                  </div>

                  {/* Draft Content */}
                  <div className="min-h-[300px] bg-surface-02 rounded-lg p-4 border border-border">
                    {drafts[audience] ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-text-primary text-sm leading-relaxed">
                          {drafts[audience]}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-text-tertiary text-sm">
                        {isGenerating && generatingAudience === audience ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating draft...
                          </div>
                        ) : (
                          "Click Generate Drafts to create content"
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Send Actions */}
          {selectedAudiences.some((a) => drafts[a]) && (
            <div className="border-t border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                  <Button variant="secondary" size="sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Slack
                  </Button>
                  <Button variant="secondary" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    Confluence
                  </Button>
                </div>
                <Button onClick={handleSend}>
                  <Send className="w-4 h-4 mr-1" />
                  Send Updates
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
