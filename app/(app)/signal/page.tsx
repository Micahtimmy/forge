"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Clock,
  CheckCircle2,
  Archive,
  MoreHorizontal,
  AlertCircle,
  Sparkles,
  Users,
  Briefcase,
  Building2,
  Crown,
  FileText,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { HelpTooltip, HelpInline } from "@/components/ui/help-tooltip";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from "@/components/ui/tabs";
import { EmptySignalState } from "@/components/ui/empty-state";
import { useToastActions } from "@/components/ui/toast";
import { useSignalUpdates, useDeleteUpdate } from "@/hooks/use-signal";
import { useJiraStatus } from "@/hooks/use-jira";
import { useAppStore } from "@/stores/app-store";
import { JiraConnectionPrompt } from "@/components/shared/jira-connection-prompt";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { formatDistanceToNow } from "date-fns";
import {
  PERSONA_CONFIGS,
  getPersonaInsights,
  HELP_CONTENT,
  type PersonaRole,
} from "@/lib/demo/persona-data";

type UpdateStatus = "draft" | "sent" | "archived";

interface SignalUpdateItem {
  id: string;
  sprintRef: string | null;
  status: UpdateStatus;
  sentAt: string | null;
  createdAt: string;
  authorName?: string;
  draftCount?: number;
}

const audienceIcons: Record<string, typeof Users> = {
  team: Users,
  executive: Briefcase,
  client: Building2,
  board: Crown,
};

function PersonaContextBanner({ role }: { role: PersonaRole }) {
  const config = PERSONA_CONFIGS[role];
  const relevantAudiences = config.dataFocus.signals;

  const audienceLabels: Record<string, string> = {
    team: "Team",
    executive: "Executive",
    client: "Client",
    board: "Board",
  };

  return (
    <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-iris/10 to-transparent border border-iris/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-iris/20">
            <FileText className="w-5 h-5 text-iris" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-text-primary">{config.label} View</h3>
              <HelpTooltip
                content={
                  <div>
                    <p className="font-medium mb-1">{config.label}</p>
                    <p className="text-slate-300">{config.description}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Typical audiences: {relevantAudiences.map(a => audienceLabels[a]).join(", ")}
                    </p>
                  </div>
                }
              />
            </div>
            <p className="text-sm text-text-tertiary">
              Creating updates for {relevantAudiences.map(a => audienceLabels[a].toLowerCase()).join(", ")} audiences
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {relevantAudiences.map((audience) => {
            const Icon = audienceIcons[audience] || Users;
            return (
              <div
                key={audience}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-02 text-xs text-text-secondary"
              >
                <Icon className="w-3.5 h-3.5" />
                {audienceLabels[audience]}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SignalQuickStats({ updates }: { updates: SignalUpdateItem[] }) {
  const sent = updates.filter(u => u.status === "sent").length;
  const drafts = updates.filter(u => u.status === "draft").length;

  return (
    <CollapsibleSection
      title="Signal Overview"
      helpContent={
        <div>
          <p className="font-medium mb-1">Signal Module</p>
          <p className="text-slate-300 text-xs">
            AI-powered stakeholder communication. Generate contextual updates from your sprint data,
            customize for different audiences, and track delivery.
          </p>
        </div>
      }
      defaultOpen={true}
      storageKey="signal-overview"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-jade/10 border border-jade/20">
            <div className="text-2xl font-bold text-jade">{sent}</div>
            <div className="text-xs text-text-tertiary">Sent</div>
          </div>
          <div className="p-3 rounded-lg bg-amber/10 border border-amber/20">
            <div className="text-2xl font-bold text-amber">{drafts}</div>
            <div className="text-xs text-text-tertiary">Drafts</div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

function SignalInsightsPanel({ role }: { role: PersonaRole }) {
  const insights = getPersonaInsights(role).filter(i =>
    i.actionHref?.includes("signal") || i.title.toLowerCase().includes("update")
  );

  const signalInsights = [...insights];

  if (signalInsights.length === 0) {
    signalInsights.push({
      type: "info" as const,
      title: "Ready to communicate",
      description: "Create a new update to share progress with stakeholders",
    });
  }

  return (
    <CollapsibleSection
      title="AI Suggestions"
      helpContent="AI-generated suggestions for your stakeholder communication based on sprint data and patterns."
      defaultOpen={true}
      storageKey="signal-ai-suggestions"
      badge={
        <Badge variant="default" size="sm" className="bg-iris/20 text-iris">
          <Sparkles className="w-3 h-3 mr-1" />
          {signalInsights.length}
        </Badge>
      }
    >
      <div className="space-y-2">
        {signalInsights.map((insight, index) => (
          <div
            key={index}
            className={cn(
              "p-3 rounded-lg border",
              insight.type === "warning" && "bg-amber/5 border-amber/20",
              insight.type === "success" && "bg-jade/5 border-jade/20",
              insight.type === "info" && "bg-iris/5 border-iris/20",
              insight.type === "action" && "bg-surface-02 border-border"
            )}
          >
            <div className="flex items-start gap-2">
              {insight.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber mt-0.5" />}
              {insight.type === "success" && <TrendingUp className="w-4 h-4 text-jade mt-0.5" />}
              {insight.type === "info" && <Sparkles className="w-4 h-4 text-iris mt-0.5" />}
              {insight.type === "action" && <FileText className="w-4 h-4 text-text-secondary mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary">{insight.title}</div>
                <div className="text-xs text-text-tertiary mt-0.5">{insight.description}</div>
                {insight.action && insight.actionHref && (
                  <Link href={insight.actionHref}>
                    <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">
                      {insight.action}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function AudienceGuidePanel() {
  const audiences = [
    {
      type: "team",
      icon: Users,
      label: "Team",
      description: HELP_CONTENT.audienceTypes.team,
      color: "text-iris",
      bg: "bg-iris/10",
    },
    {
      type: "executive",
      icon: Briefcase,
      label: "Executive",
      description: HELP_CONTENT.audienceTypes.executive,
      color: "text-jade",
      bg: "bg-jade/10",
    },
    {
      type: "client",
      icon: Building2,
      label: "Client",
      description: HELP_CONTENT.audienceTypes.client,
      color: "text-amber",
      bg: "bg-amber/10",
    },
    {
      type: "board",
      icon: Crown,
      label: "Board",
      description: HELP_CONTENT.audienceTypes.board,
      color: "text-coral",
      bg: "bg-coral/10",
    },
  ];

  return (
    <CollapsibleSection
      title="Audience Guide"
      helpContent="Different audiences need different levels of detail and focus. Use this guide to choose the right audience for your update."
      defaultOpen={false}
      storageKey="signal-audience-guide"
    >
      <div className="space-y-2">
        {audiences.map((audience) => {
          const Icon = audience.icon;
          return (
            <div
              key={audience.type}
              className="p-2 rounded-lg bg-surface-02 border border-border"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("p-1 rounded", audience.bg)}>
                  <Icon className={cn("w-3.5 h-3.5", audience.color)} />
                </div>
                <span className="text-sm font-medium text-text-primary">{audience.label}</span>
              </div>
              <p className="text-xs text-text-tertiary">{audience.description}</p>
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-surface-01">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function UpdateRow({
  update,
  onClick,
  onDelete,
}: {
  update: SignalUpdateItem;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border bg-surface-01",
        "border-border hover:border-border-strong hover:bg-surface-02 cursor-pointer",
        "transition-colors"
      )}
      onClick={onClick}
    >
      {/* Status Icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          update.status === "sent" && "bg-jade-dim",
          update.status === "draft" && "bg-amber-dim",
          update.status === "archived" && "bg-surface-03"
        )}
      >
        {update.status === "sent" && <CheckCircle2 className="w-5 h-5 text-jade" />}
        {update.status === "draft" && <Clock className="w-5 h-5 text-amber" />}
        {update.status === "archived" && <Archive className="w-5 h-5 text-text-tertiary" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-text-primary">
            {update.sprintRef || "Stakeholder Update"}
          </span>
          <Badge
            variant={update.status === "sent" ? "excellent" : update.status === "draft" ? "fair" : "default"}
            size="sm"
          >
            {update.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          {update.draftCount && update.draftCount > 0 && (
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {update.draftCount} draft{update.draftCount > 1 ? "s" : ""}
            </span>
          )}
          <span>
            {update.sentAt
              ? `Sent ${formatDistanceToNow(new Date(update.sentAt), { addSuffix: true })}`
              : `Created ${formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}`}
          </span>
        </div>
      </div>

      {/* Author */}
      <div className="text-right flex-shrink-0 hidden sm:block">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Avatar size="xs" alt={update.authorName || "User"} />
          <span>{update.authorName || "You"}</span>
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded hover:bg-surface-03 text-text-tertiary hover:text-text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>View Details</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-coral" onClick={(e) => { e.stopPropagation(); onDelete(); }}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

export default function SignalPage() {
  const router = useRouter();
  const toast = useToastActions();
  const { userRole } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "draft">("all");

  const { data: jiraStatus } = useJiraStatus();
  const isJiraConnected = jiraStatus?.connected ?? false;

  const { data: updatesData, isLoading, error } = useSignalUpdates({
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const deleteUpdate = useDeleteUpdate();

  const updates: SignalUpdateItem[] = (updatesData?.updates || []).map((u) => ({
    id: u.id,
    sprintRef: u.sprintRef,
    status: u.status as UpdateStatus,
    sentAt: u.sentAt || null,
    createdAt: u.createdAt,
  }));

  const filteredUpdates = updates.filter((update) => {
    if (
      searchQuery &&
      !(update.sprintRef || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const handleDelete = async (updateId: string) => {
    try {
      await deleteUpdate.mutateAsync(updateId);
      toast.success("Update deleted");
    } catch (err) {
      toast.error("Failed to delete", err instanceof Error ? err.message : "Unknown error");
    }
  };

  const allUpdatesCount = updates.length;
  const sentCount = updates.filter((u) => u.status === "sent").length;
  const draftCount = updates.filter((u) => u.status === "draft").length;

  return (
    <div>
      <PageHeader
        title="Signal"
        description={
          <span className="flex items-center gap-2">
            AI-powered stakeholder updates and communication
            <HelpTooltip
              content={
                <div className="max-w-xs">
                  <p className="font-medium mb-1">Signal Module</p>
                  <p className="text-slate-300 text-xs">
                    Generate contextual updates from your sprint data using AI. Customize tone and
                    detail level for different audiences: team, executives, clients, or board members.
                  </p>
                </div>
              }
            />
          </span>
        }
        actions={
          <Button onClick={() => router.push("/signal/new")}>
            <Plus className="w-4 h-4 mr-1" />
            New Update
          </Button>
        }
      />

      {!isJiraConnected && <JiraConnectionPrompt variant="banner" />}

      {/* Persona Context Banner */}
      <PersonaContextBanner role={userRole} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <SignalQuickStats updates={updates} />
          <SignalInsightsPanel role={userRole} />
          <AudienceGuidePanel />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 max-w-xs">
              <Input
                placeholder="Search updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <TabsListUnderline>
              <TabsTriggerUnderline value="all">
                All Updates
                <Badge variant="default" size="sm" className="ml-2">
                  {allUpdatesCount}
                </Badge>
              </TabsTriggerUnderline>
              <TabsTriggerUnderline value="sent">
                Sent
                <Badge variant="excellent" size="sm" className="ml-2">
                  {sentCount}
                </Badge>
              </TabsTriggerUnderline>
              <TabsTriggerUnderline value="draft">
                Drafts
                <Badge variant="fair" size="sm" className="ml-2">
                  {draftCount}
                </Badge>
              </TabsTriggerUnderline>
            </TabsListUnderline>

            <div className="text-xs text-text-tertiary mt-3 mb-2">
              Showing {filteredUpdates.length} updates
              <span className="mx-1">•</span>
              <span className="text-text-secondary">{PERSONA_CONFIGS[userRole].label} view</span>
            </div>

            <TabsContent value={statusFilter} className="mt-2">
              {isLoading ? (
                <LoadingState />
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-12 h-12 text-coral mb-4" />
                  <p className="text-text-secondary">Failed to load updates</p>
                </div>
              ) : filteredUpdates.length === 0 ? (
                <EmptySignalState onCreate={() => router.push("/signal/new")} />
              ) : (
                <motion.div
                  className="space-y-2"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredUpdates.map((update) => (
                    <UpdateRow
                      key={update.id}
                      update={update}
                      onClick={() => router.push(`/signal/${update.id}`)}
                      onDelete={() => handleDelete(update.id)}
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
