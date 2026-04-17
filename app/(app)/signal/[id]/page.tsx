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
  ExternalLink,
  FileText,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { PageHeaderCompact } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { useToastActions } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { audienceLabels, type AudienceType } from "@/types/signal";

// Mock data
const mockUpdate = {
  id: "1",
  sprintRef: "Sprint 22",
  status: "sent" as "sent" | "draft" | "archived",
  sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  author: { name: "Jane Doe", email: "jane@company.com" },
  audiences: ["executive", "team"] as AudienceType[],
  content: {
    executive: `## Sprint 22 Update - Executive Summary

**Sprint Status:** On Track
**Velocity:** 21/21 points (100%)

### Key Accomplishments
- OAuth2 authentication completed ahead of schedule
- Dashboard UI received positive stakeholder feedback
- API rate limiting implementation deployed

### Risks & Blockers
- Payment provider sandbox access pending (medium risk)
- Mobile team capacity reduced due to illness

### Next Sprint Focus
- Complete payment gateway integration
- Begin notification system implementation

---
*Questions? Reply to this update or reach out to the team.*`,
    team: `## Sprint 22 Wrap-Up

Hey team! Great work this sprint. Here's the summary:

### Completed
- **PROJ-118** User authentication with OAuth2 (5 pts)
- **PROJ-119** Dashboard layout and navigation (3 pts)
- **PROJ-120** API rate limiting (2 pts)

### In Progress
- **PROJ-121** Payment gateway (60% done, rolling over)
- **PROJ-122** Email notifications (30% done)

### Shoutouts
Big thanks to Alex for jumping in to help with the OAuth flow when we hit that CORS issue!

### Reminders
- Retro is tomorrow at 2pm
- Demo day is Friday - please test your features

Let me know if you have any questions!`,
  },
  decisions: [
    {
      id: "d1",
      title: "Postpone mobile launch to next PI",
      description: "Due to capacity constraints and payment integration timeline, agreed to push mobile launch by 2 weeks",
      outcome: "Approved by product leadership",
      stakeholders: ["VP Product", "Mobile Lead", "PM"],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "d2",
      title: "Switch to Stripe for payment processing",
      description: "Original provider (PayPal) had integration issues. Stripe offers better API and documentation.",
      outcome: "Technical decision approved",
      stakeholders: ["Tech Lead", "Finance", "PM"],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  deliveryLog: [
    { channel: "email", audience: "executive", recipients: 3, sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { channel: "email", audience: "team", recipients: 12, sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { channel: "slack", audience: "team", recipients: 1, sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  ],
};

function DecisionCard({
  decision,
}: {
  decision: (typeof mockUpdate.decisions)[0];
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

  const [activeTab, setActiveTab] = useState<AudienceType | "decisions">(
    mockUpdate.audiences[0]
  );
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [newDecision, setNewDecision] = useState({
    title: "",
    description: "",
    outcome: "",
    stakeholders: "",
  });

  const handleCopyContent = (audience: AudienceType) => {
    const content = mockUpdate.content[audience as keyof typeof mockUpdate.content];
    if (content) {
      navigator.clipboard.writeText(content);
      toast.success("Copied!", "Update content copied to clipboard");
    }
  };

  const handleAddDecision = () => {
    // In real app, this would save to DB
    console.log("Adding decision:", newDecision);
    toast.success("Decision logged", "Decision has been recorded");
    setIsDecisionModalOpen(false);
    setNewDecision({ title: "", description: "", outcome: "", stakeholders: "" });
  };

  const handleDelete = () => {
    // In real app, this would delete from DB
    toast.success("Update deleted");
    router.push("/signal");
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
          Back to Signal
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-display font-bold text-text-primary">
                {mockUpdate.sprintRef} Update
              </h1>
              <Badge variant={mockUpdate.status === "sent" ? "excellent" : "fair"}>
                {mockUpdate.status === "sent" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {mockUpdate.status === "draft" && <Clock className="w-3 h-3 mr-1" />}
                {mockUpdate.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <div className="flex items-center gap-1">
                <Avatar size="xs" alt={mockUpdate.author.name} />
                <span>{mockUpdate.author.name}</span>
              </div>
              {mockUpdate.sentAt && (
                <span>
                  Sent {format(new Date(mockUpdate.sentAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mockUpdate.status === "draft" && (
              <Button
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send Update
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
              {mockUpdate.audiences.map((audience) => (
                <TabsTriggerUnderline key={audience} value={audience}>
                  <Users className="w-4 h-4 mr-1.5" />
                  {audienceLabels[audience].split(" ")[0]}
                </TabsTriggerUnderline>
              ))}
              <TabsTriggerUnderline value="decisions">
                <FileText className="w-4 h-4 mr-1.5" />
                Decisions
                {mockUpdate.decisions.length > 0 && (
                  <Badge variant="default" size="sm" className="ml-1">
                    {mockUpdate.decisions.length}
                  </Badge>
                )}
              </TabsTriggerUnderline>
            </TabsListUnderline>

            {mockUpdate.audiences.map((audience) => (
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
                        {mockUpdate.content[audience as keyof typeof mockUpdate.content]}
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

              {mockUpdate.decisions.length === 0 ? (
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
                  {mockUpdate.decisions.map((decision) => (
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
              {mockUpdate.audiences.map((audience) => (
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
          {mockUpdate.status === "sent" && (
            <div className="bg-surface-01 border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-text-primary mb-3">
                Delivery Log
              </h3>
              <div className="space-y-2">
                {mockUpdate.deliveryLog.map((log, i) => (
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
                  {format(new Date(mockUpdate.createdAt), "MMM d, yyyy")}
                </span>
              </div>
              {mockUpdate.sentAt && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Sent</span>
                  <span className="text-text-primary">
                    {format(new Date(mockUpdate.sentAt), "MMM d, yyyy")}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Author</span>
                <span className="text-text-primary">{mockUpdate.author.name}</span>
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
    </div>
  );
}
