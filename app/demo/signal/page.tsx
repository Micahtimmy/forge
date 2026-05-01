"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Search,
  Clock,
  CheckCircle2,
  Archive,
  MoreHorizontal,
  Users,
  Briefcase,
  Building2,
  Crown,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { formatDistanceToNow } from "date-fns";
import { audienceLabels } from "@/types/signal";
import {
  PERSONA_UPDATES,
  PERSONA_CONFIGS,
  filterUpdatesForPersona,
  getPersonaInsights,
  HELP_CONTENT,
  type PersonaRole,
} from "@/lib/demo/persona-data";
import { useDemoStore } from "@/stores/demo-store";

const audienceIcons: Record<string, typeof Users> = {
  team: Users,
  executive: Briefcase,
  client: Building2,
  board: Crown,
};

function UpdateRow({ update }: { update: (typeof PERSONA_UPDATES)[0] }) {
  return (
    <Link href={`/demo/signal/${update.id}`}>
      <motion.div
        variants={staggerItem}
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg border bg-surface-01",
          "border-border hover:border-border-strong hover:bg-surface-02 cursor-pointer",
          "transition-colors"
        )}
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
            <span className="font-medium text-text-primary">{update.title}</span>
            <Badge
              variant={update.status === "sent" ? "excellent" : update.status === "draft" ? "fair" : "default"}
              size="sm"
            >
              {update.status}
            </Badge>
            {(update as any).targetRole && (
              <Badge variant="default" size="sm" className="bg-iris/10 text-iris border-iris/20">
                {PERSONA_CONFIGS[(update as any).targetRole as PersonaRole]?.label || "General"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {update.audiences.map((audience) => {
              const Icon = audienceIcons[audience] || Users;
              return (
                <span
                  key={audience}
                  className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-surface-03 text-text-secondary"
                >
                  <Icon className="w-3 h-3" />
                  {audienceLabels[audience].split(" ")[0]}
                </span>
              );
            })}
            <span className="text-xs text-text-tertiary">
              {update.sprintRef}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Avatar size="xs" alt={update.authorName} />
            <span>{update.authorName}</span>
          </div>
          <div className="text-xs text-text-tertiary mt-1">
            {update.sentAt
              ? `Sent ${formatDistanceToNow(new Date(update.sentAt), { addSuffix: true })}`
              : `Created ${formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}`}
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
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-coral">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </Link>
  );
}

function PersonaContextBanner({ role }: { role: PersonaRole }) {
  const config = PERSONA_CONFIGS[role];
  const relevantAudiences = config.dataFocus.signals;

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
                      Showing updates for: {relevantAudiences.map(a => audienceLabels[a]).join(", ")}
                    </p>
                  </div>
                }
              />
            </div>
            <p className="text-sm text-text-tertiary">
              Showing updates relevant to {relevantAudiences.map(a => audienceLabels[a].split(" ")[0].toLowerCase()).join(", ")} audiences
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
                {audienceLabels[audience].split(" ")[0]}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SignalQuickStats({ updates, role }: { updates: typeof PERSONA_UPDATES; role: PersonaRole }) {
  const sent = updates.filter(u => u.status === "sent").length;
  const drafts = updates.filter(u => u.status === "draft").length;

  // Calculate audience distribution
  const audienceCount: Record<string, number> = {};
  updates.forEach(u => {
    u.audiences.forEach(a => {
      audienceCount[a] = (audienceCount[a] || 0) + 1;
    });
  });

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

        <div className="pt-3 border-t border-border">
          <div className="text-xs text-text-tertiary mb-2">
            <HelpInline label="By Audience" content={HELP_CONTENT.audienceTypes.team} />
          </div>
          <div className="space-y-1.5">
            {Object.entries(audienceCount).map(([audience, count]) => {
              const Icon = audienceIcons[audience] || Users;
              return (
                <div key={audience} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Icon className="w-4 h-4" />
                    {audienceLabels[audience as keyof typeof audienceLabels] || audience}
                  </div>
                  <span className="font-mono text-text-primary">{count}</span>
                </div>
              );
            })}
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

  // Add signal-specific insights
  const signalInsights = [
    ...insights,
    {
      type: "info" as const,
      title: "AI draft ready",
      description: "Q2 board update draft is waiting for your review",
      action: "Review draft",
      actionHref: "/demo/signal/update-3",
    },
  ];

  if (role === "scrum_master" || role === "product_manager") {
    signalInsights.push({
      type: "action" as const,
      title: "Sprint ending soon",
      description: "Consider sending a sprint update to stakeholders",
      action: "Create update",
      actionHref: "/demo/signal/new",
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

export default function DemoSignalPage() {
  const { selectedRole } = useDemoStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "draft">("all");

  // Filter updates based on persona
  const personaFilteredUpdates = useMemo(() => {
    return filterUpdatesForPersona(PERSONA_UPDATES, selectedRole);
  }, [selectedRole]);

  // Apply search and status filters
  const filteredUpdates = useMemo(() => {
    return personaFilteredUpdates.filter((update) => {
      if (statusFilter !== "all" && update.status !== statusFilter) return false;
      if (searchQuery && !update.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [personaFilteredUpdates, statusFilter, searchQuery]);

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
          <Link href="/demo/signal/new">
            <Button>
              <Plus className="w-4 h-4 mr-1" />
              New Update
            </Button>
          </Link>
        }
      />

      {/* Persona Context Banner */}
      <PersonaContextBanner role={selectedRole} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <SignalQuickStats updates={filteredUpdates} role={selectedRole} />
          <SignalInsightsPanel role={selectedRole} />
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
                  {personaFilteredUpdates.length}
                </Badge>
              </TabsTriggerUnderline>
              <TabsTriggerUnderline value="sent">
                Sent
                <Badge variant="excellent" size="sm" className="ml-2">
                  {personaFilteredUpdates.filter((u) => u.status === "sent").length}
                </Badge>
              </TabsTriggerUnderline>
              <TabsTriggerUnderline value="draft">
                Drafts
                <Badge variant="fair" size="sm" className="ml-2">
                  {personaFilteredUpdates.filter((u) => u.status === "draft").length}
                </Badge>
              </TabsTriggerUnderline>
            </TabsListUnderline>

            <div className="text-xs text-text-tertiary mt-3 mb-2">
              Showing {filteredUpdates.length} updates
              <span className="mx-1">•</span>
              <span className="text-text-secondary">{PERSONA_CONFIGS[selectedRole].label} view</span>
            </div>

            <TabsContent value={statusFilter} className="mt-2">
              {filteredUpdates.length === 0 ? (
                <div className="text-center py-12 bg-surface-01 border border-border rounded-lg">
                  <FileText className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
                  <p className="text-text-primary font-medium mb-1">No updates match your filters</p>
                  <p className="text-sm text-text-tertiary mb-4">
                    Try adjusting your search or create a new update
                  </p>
                  <Link href="/demo/signal/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-1" />
                      Create Update
                    </Button>
                  </Link>
                </div>
              ) : (
                <motion.div
                  className="space-y-2"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredUpdates.map((update) => (
                    <UpdateRow key={update.id} update={update} />
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
