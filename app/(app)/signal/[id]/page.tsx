"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Copy,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
  Users,
  Mail,
  MessageSquare,
  Plus,
  MoreHorizontal,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { useToastActions } from "@/components/ui/toast";
import { useSignalUpdate, useDeleteUpdate, useUpdateSignalStatus, useLogDecision, useSendUpdate } from "@/hooks/use-signal";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { audienceLabels, type AudienceType } from "@/types/signal";

interface SignalUpdateData {
  id: string;
  sprintRef: string | null;
  status: "sent" | "draft" | "archived";
  sentAt: string | null;
  createdAt: string;
  author: { name: string; email: string };
  audiences: AudienceType[];
  content: Record<string, string>;
  decisions: Array<{
    id: string;
    title: string;
    description: string;
    outcome: string;
    stakeholders: string[];
    createdAt: string;
  }>;
  deliveryLog: Array<{
    channel: string;
    audience: string;
    recipients: number;
    sentAt: string;
  }>;
}

function LoadingState() {
  return (
    <div>
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="flex items-start justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

function DecisionCard({
  decision,
}: {
  decision: SignalUpdateData["decisions"][0];
}) {
  return (
    <motion.div
      variants={staggerItem}
      className="bg-surface-01 border border-border rounded-lg p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-iris" />
          <h4 className="text-sm font-medium text-text-primary">
            {decision.title}
          </h4>
        </div>
        <span className="text-xs text-text-tertiary">
          {formatDistanceToNow(new Date(decision.createdAt), { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm text-text-secondary mb-3">{decision.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {decision.stakeholders.slice(0, 3).map((s, i) => (
            <Badge key={i} variant="default" size="sm">
              {s}
            </Badge>
          ))}
          {decision.stakeholders.length > 3 && (
            <Badge variant="default" size="sm">
              +{decision.stakeholders.length - 3}
            </Badge>
          )}
        </div>
        <Badge variant="excellent" size="sm">
          {decision.outcome}
        </Badge>
      </div>
    </motion.div>
  );
}

export default function SignalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToastActions();
  const updateId = params.id as string;

  const { data: rawUpdate, isLoading, error } = useSignalUpdate(updateId);
  const deleteUpdate = useDeleteUpdate();
  const updateStatus = useUpdateSignalStatus();
  const logDecision = useLogDecision();
  const sendUpdate = useSendUpdate();

  const [activeTab, setActiveTab] = useState<AudienceType | "decisions">("executive");
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipients, setRecipients] = useState<Array<{ email: string; name?: string; audience: AudienceType }>>([]);
  const [newDecision, setNewDecision] = useState({
    title: "",
    description: "",
    outcome: "",
    stakeholders: "",
  });

  // Transform raw API response to component data format
  const drafts = rawUpdate?.drafts || [];
  const audiences = drafts.length > 0
    ? (drafts.map(d => d.audience) as AudienceType[])
    : ["executive", "team"] as AudienceType[];

  const update: SignalUpdateData | null = rawUpdate ? {
    id: rawUpdate.id,
    sprintRef: rawUpdate.sprintRef,
    status: rawUpdate.status,
    sentAt: rawUpdate.sentAt || null,
    createdAt: rawUpdate.createdAt,
    author: { name: "Author", email: "" },
    audiences,
    content: drafts.reduce((acc: Record<string, string>, draft) => {
      acc[draft.audience] = draft.content;
      return acc;
    }, {}),
    decisions: [],
    deliveryLog: [],
  } : null;

  const handleCopyContent = (audience: AudienceType) => {
    if (!update) return;
    const content = update.content[audience];
    if (content) {
      navigator.clipboard.writeText(content);
      toast.success("Copied!", "Update content copied to clipboard");
    }
  };

  const handleAddDecision = async () => {
    try {
      await logDecision.mutateAsync({
        updateId,
        decision: {
          title: newDecision.title,
          description: newDecision.description,
          outcome: newDecision.outcome,
          stakeholders: newDecision.stakeholders.split(",").map((s) => s.trim()).filter(Boolean),
        },
      });
      toast.success("Decision logged", "Decision has been recorded");
      setIsDecisionModalOpen(false);
      setNewDecision({ title: "", description: "", outcome: "", stakeholders: "" });
    } catch (err) {
      toast.error("Failed to log decision", err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUpdate.mutateAsync(updateId);
      toast.success("Update deleted");
      router.push("/signal");
    } catch (err) {
      toast.error("Failed to delete", err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleAddRecipient = () => {
    if (!recipientEmail || !update) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error("Invalid email", "Please enter a valid email address");
      return;
    }
    if (recipients.some((r) => r.email === recipientEmail)) {
      toast.error("Duplicate", "This email is already added");
      return;
    }
    setRecipients([...recipients, { email: recipientEmail, audience: update.audiences[0] }]);
    setRecipientEmail("");
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r.email !== email));
  };

  const handleSendUpdate = async () => {
    if (!update) return;
    if (recipients.length === 0) {
      setIsSendModalOpen(true);
      return;
    }
    setIsSending(true);
    try {
      const result = await sendUpdate.mutateAsync({
        updateId,
        audiences: update.audiences,
        channels: ["email"],
        recipients,
      });
      const successCount = result.results?.filter((r: { success: boolean }) => r.success).length || 0;
      toast.success("Update sent", `Sent to ${successCount} recipient(s)`);
      setIsSendModalOpen(false);
      setRecipients([]);
    } catch (err) {
      toast.error("Failed to send", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !update) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="w-12 h-12 text-coral mb-4" />
        <h2 className="text-lg font-medium text-text-primary mb-2">Update not found</h2>
        <p className="text-sm text-text-secondary mb-4">
          {error instanceof Error ? error.message : "Unable to load update details"}
        </p>
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go back
        </Button>
      </div>
    );
  }

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
          Back to Signal
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-display font-bold text-text-primary">
                {update.sprintRef || "Sprint"} Update
              </h1>
              <Badge variant={update.status === "sent" ? "excellent" : "fair"}>
                {update.status === "sent" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {update.status === "draft" && <Clock className="w-3 h-3 mr-1" />}
                {update.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <div className="flex items-center gap-1">
                <Avatar size="xs" alt={update.author.name} />
                <span>{update.author.name}</span>
              </div>
              {update.sentAt && (
                <span>
                  Sent {format(new Date(update.sentAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {update.status === "draft" && (
              <Button
                leftIcon={isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                onClick={handleSendUpdate}
                disabled={isSending}
              >
                {isSending ? "Sending..." : "Send Update"}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="px-2">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Update
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-coral">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AudienceType | "decisions")}>
            <TabsListUnderline>
              {update.audiences.map((audience) => (
                <TabsTriggerUnderline key={audience} value={audience}>
                  <Users className="w-4 h-4 mr-1.5" />
                  {audienceLabels[audience].split(" ")[0]}
                </TabsTriggerUnderline>
              ))}
              <TabsTriggerUnderline value="decisions">
                <FileText className="w-4 h-4 mr-1.5" />
                Decisions
                {update.decisions.length > 0 && (
                  <Badge variant="default" size="sm" className="ml-1">
                    {update.decisions.length}
                  </Badge>
                )}
              </TabsTriggerUnderline>
            </TabsListUnderline>

            {update.audiences.map((audience) => (
              <TabsContent key={audience} value={audience} className="mt-4">
                <div className="bg-surface-01 border border-border rounded-lg">
                  <div className="flex items-center justify-between p-3 border-b border-border">
                    <span className="text-sm font-medium text-text-primary">
                      {audienceLabels[audience]}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyContent(audience)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-4">
                    <div className="prose prose-invert prose-sm max-w-none text-text-secondary">
                      <pre className="whitespace-pre-wrap font-body text-sm bg-transparent p-0">
                        {update.content[audience] || "No content generated yet"}
                      </pre>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}

            <TabsContent value="decisions" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-text-primary">
                  Logged Decisions
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsDecisionModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Log Decision
                </Button>
              </div>

              {update.decisions.length === 0 ? (
                <div className="text-center py-12 bg-surface-01 border border-border rounded-lg">
                  <FileText className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-sm text-text-secondary mb-2">
                    No decisions logged yet
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsDecisionModalOpen(true)}
                  >
                    Log First Decision
                  </Button>
                </div>
              ) : (
                <motion.div
                  className="space-y-3"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {update.decisions.map((decision) => (
                    <DecisionCard key={decision.id} decision={decision} />
                  ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Audiences */}
          <div className="bg-surface-01 border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text-primary mb-3">
              Audiences
            </h3>
            <div className="space-y-2">
              {update.audiences.map((audience) => (
                <div
                  key={audience}
                  className="flex items-center gap-2 p-2 rounded bg-surface-02"
                >
                  <Users className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm text-text-primary">
                    {audienceLabels[audience]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Log */}
          {update.status === "sent" && update.deliveryLog.length > 0 && (
            <div className="bg-surface-01 border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-text-primary mb-3">
                Delivery Log
              </h3>
              <div className="space-y-2">
                {update.deliveryLog.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded bg-surface-02"
                  >
                    <div className="flex items-center gap-2">
                      {log.channel === "email" ? (
                        <Mail className="w-4 h-4 text-text-tertiary" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-text-tertiary" />
                      )}
                      <div>
                        <span className="text-sm text-text-primary capitalize">
                          {log.channel}
                        </span>
                        <span className="text-xs text-text-tertiary ml-1">
                          ({log.audience})
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-text-secondary">
                        {log.recipients} recipients
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {formatDistanceToNow(new Date(log.sentAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-surface-01 border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text-primary mb-3">
              Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Created</span>
                <span className="text-text-primary">
                  {format(new Date(update.createdAt), "MMM d, yyyy")}
                </span>
              </div>
              {update.sentAt && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Sent</span>
                  <span className="text-text-primary">
                    {format(new Date(update.sentAt), "MMM d, yyyy")}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Author</span>
                <span className="text-text-primary">{update.author.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Decision Modal */}
      <Modal
        open={isDecisionModalOpen}
        onOpenChange={setIsDecisionModalOpen}
        title="Log Decision"
        description="Record an important decision made during or after this update"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="decision-title">Decision Title</Label>
            <Input
              id="decision-title"
              placeholder="e.g., Postpone feature launch"
              value={newDecision.title}
              onChange={(e) =>
                setNewDecision({ ...newDecision, title: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="decision-description">Description</Label>
            <textarea
              id="decision-description"
              className="input min-h-[80px] resize-none"
              placeholder="Context and reasoning for this decision..."
              value={newDecision.description}
              onChange={(e) =>
                setNewDecision({ ...newDecision, description: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="decision-outcome">Outcome</Label>
            <Input
              id="decision-outcome"
              placeholder="e.g., Approved by leadership"
              value={newDecision.outcome}
              onChange={(e) =>
                setNewDecision({ ...newDecision, outcome: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="decision-stakeholders">
              Stakeholders (comma-separated)
            </Label>
            <Input
              id="decision-stakeholders"
              placeholder="e.g., VP Product, Tech Lead, PM"
              value={newDecision.stakeholders}
              onChange={(e) =>
                setNewDecision({ ...newDecision, stakeholders: e.target.value })
              }
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsDecisionModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddDecision} disabled={!newDecision.title}>
            Log Decision
          </Button>
        </ModalFooter>
      </Modal>

      {/* Send Update Modal */}
      <Modal
        open={isSendModalOpen}
        onOpenChange={setIsSendModalOpen}
        title="Send Update"
        description="Add recipients to send this update via email"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipient-email">Add Recipient</Label>
            <div className="flex gap-2">
              <Input
                id="recipient-email"
                type="email"
                placeholder="email@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRecipient();
                  }
                }}
              />
              <Button variant="secondary" onClick={handleAddRecipient}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {recipients.length > 0 && (
            <div>
              <Label>Recipients ({recipients.length})</Label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {recipients.map((r) => (
                  <div
                    key={r.email}
                    className="flex items-center justify-between p-2 bg-surface-02 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm text-text-primary">{r.email}</span>
                      <Badge variant="default" size="sm">
                        {audienceLabels[r.audience].split(" ")[0]}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRecipient(r.email)}
                      className="p-1 h-auto"
                    >
                      <Trash2 className="w-3 h-3 text-coral" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recipients.length === 0 && (
            <div className="text-center py-6 bg-surface-02 rounded-lg">
              <Mail className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">
                Add email addresses to send this update
              </p>
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsSendModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSendUpdate}
            disabled={recipients.length === 0 || isSending}
            leftIcon={isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          >
            {isSending ? "Sending..." : `Send to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}`}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
