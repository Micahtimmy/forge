"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Users,
  GitBranch,
  AlertTriangle,
  ChevronRight,
  MoreHorizontal,
  Play,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  TrendingUp,
  Layers,
  Network,
  FileText,
  BarChart3,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { HelpTooltip, HelpInline } from "@/components/ui/help-tooltip";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { EmptyPIState } from "@/components/ui/empty-state";
import { useToastActions } from "@/components/ui/toast";
import { usePIs, useCreatePI, type PIListItem } from "@/hooks/use-pi";
import { useJiraStatus } from "@/hooks/use-jira";
import { useAppStore } from "@/stores/app-store";
import { JiraConnectionPrompt } from "@/components/shared/jira-connection-prompt";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { format, addWeeks } from "date-fns";
import {
  PERSONA_CONFIGS,
  getPersonaInsights,
  HELP_CONTENT,
  type PersonaRole,
} from "@/lib/demo/persona-data";

interface PICardData extends PIListItem {
  teams: number;
  dependencies: number;
  risks: number;
}

function PersonaContextBanner({ role }: { role: PersonaRole }) {
  const config = PERSONA_CONFIGS[role];
  const horizonFocus = config.dataFocus.horizon;

  const focusLabels: Record<string, string> = {
    my_features: "your assigned features",
    team: "your team's features",
    dependencies: "cross-team dependencies",
    portfolio: "the full portfolio",
  };

  return (
    <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-iris/10 to-transparent border border-iris/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-iris/20">
            <Layers className="w-5 h-5 text-iris" />
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
                      Default focus: {focusLabels[horizonFocus]}
                    </p>
                  </div>
                }
              />
            </div>
            <p className="text-sm text-text-tertiary">
              Key metrics: {config.keyMetrics.slice(0, 3).join(", ")}
            </p>
          </div>
        </div>
        <Badge variant="default" className="bg-iris/20 text-iris border-iris/20">
          {horizonFocus === "my_features" && "Individual"}
          {horizonFocus === "team" && "Team"}
          {horizonFocus === "dependencies" && "Cross-Team"}
          {horizonFocus === "portfolio" && "Portfolio"}
        </Badge>
      </div>
    </div>
  );
}

function PIOverviewPanel({ pis }: { pis: PICardData[] }) {
  const activePIs = pis.filter(pi => pi.status === "active").length;
  const totalDeps = pis.reduce((acc, pi) => acc + pi.dependencies, 0);
  const totalRisks = pis.reduce((acc, pi) => acc + pi.risks, 0);

  return (
    <CollapsibleSection
      title="PI Overview"
      helpContent={
        <div>
          <p className="font-medium mb-1">Program Increment Overview</p>
          <p className="text-slate-300 text-xs">
            {HELP_CONTENT.piCanvas}
          </p>
        </div>
      }
      defaultOpen={true}
      storageKey="horizon-pi-overview"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-jade/10 border border-jade/20">
            <div className="text-2xl font-bold text-jade">{activePIs}</div>
            <div className="text-xs text-text-tertiary">Active PIs</div>
          </div>
          <div className="p-3 rounded-lg bg-iris/10 border border-iris/20">
            <div className="text-2xl font-bold text-iris">{pis.length}</div>
            <div className="text-xs text-text-tertiary">Total PIs</div>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="text-xs text-text-tertiary mb-2">
            <HelpInline label="Dependencies" content={HELP_CONTENT.dependencies} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <GitBranch className="w-4 h-4" />
                Total Dependencies
              </div>
              <span className="font-mono text-text-primary">{totalDeps}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-coral">
                <AlertTriangle className="w-4 h-4" />
                Total Risks
              </div>
              <span className="font-mono text-coral">{totalRisks}</span>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

function PIInsightsPanel({ role }: { role: PersonaRole }) {
  const insights = getPersonaInsights(role).filter(i =>
    i.actionHref?.includes("horizon") ||
    i.title.toLowerCase().includes("pi") ||
    i.title.toLowerCase().includes("dependency") ||
    i.title.toLowerCase().includes("risk")
  );

  const horizonInsights = [...insights];

  if (horizonInsights.length === 0) {
    horizonInsights.push({
      type: "info" as const,
      title: "PI planning on track",
      description: "No immediate actions required",
    });
  }

  return (
    <CollapsibleSection
      title="AI Insights"
      helpContent="AI-generated insights about your PI planning, dependencies, and risks based on current data."
      defaultOpen={true}
      storageKey="horizon-ai-insights"
      badge={
        <Badge variant="default" size="sm" className="bg-iris/20 text-iris">
          <Sparkles className="w-3 h-3 mr-1" />
          {horizonInsights.length}
        </Badge>
      }
    >
      <div className="space-y-2">
        {horizonInsights.map((insight, index) => (
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
              {insight.type === "action" && <Target className="w-4 h-4 text-text-secondary mt-0.5" />}
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

function QuickActionsPanel({ role }: { role: PersonaRole }) {
  const config = PERSONA_CONFIGS[role];

  const actionConfig: Record<string, { icon: typeof Target; href: string; description: string }> = {
    "Dependency map": { icon: Network, href: "/horizon", description: "View cross-team dependencies" },
    "PI objectives": { icon: Target, href: "/horizon", description: "Review and update objectives" },
    "Risk review": { icon: AlertTriangle, href: "/horizon", description: "Assess current risks" },
    "View PI canvas": { icon: Layers, href: "/horizon", description: "Open the planning canvas" },
    "Portfolio risks": { icon: AlertTriangle, href: "/horizon", description: "Review strategic risks" },
    "Team comparison": { icon: BarChart3, href: "/analytics", description: "Compare team performance" },
    "Executive summary": { icon: FileText, href: "/signal", description: "Generate exec summary" },
    "Milestone review": { icon: Calendar, href: "/horizon", description: "Review upcoming milestones" },
  };

  const actions = config.quickActions.filter(a => actionConfig[a]);

  if (actions.length === 0) return null;

  return (
    <CollapsibleSection
      title="Quick Actions"
      helpContent="Frequently used actions for your role in PI planning."
      defaultOpen={false}
      storageKey="horizon-quick-actions"
    >
      <div className="space-y-2">
        {actions.map((action) => {
          const cfg = actionConfig[action];
          if (!cfg) return null;
          const Icon = cfg.icon;
          return (
            <Link key={action} href={cfg.href}>
              <div className="p-2 rounded-lg bg-surface-02 border border-border hover:border-border-strong transition-colors">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-iris" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">{action}</div>
                    <div className="text-xs text-text-tertiary">{cfg.description}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-surface-01 border border-border rounded-lg p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded" />
                <div>
                  <Skeleton className="h-4 w-8 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-border">
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PICard({
  pi,
  onClick,
}: {
  pi: PICardData;
  onClick: () => void;
}) {
  const statusConfig = {
    planning: { icon: Clock, color: "text-amber", bg: "bg-amber-dim" },
    active: { icon: Play, color: "text-jade", bg: "bg-jade-dim" },
    completed: { icon: CheckCircle2, color: "text-text-secondary", bg: "bg-surface-03" },
  };

  const config = statusConfig[pi.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "bg-surface-01 border border-border rounded-lg p-5",
        "hover:border-border-strong hover:bg-surface-02 cursor-pointer",
        "transition-colors"
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-text-primary">{pi.name}</h3>
            <Badge
              variant={
                pi.status === "active"
                  ? "excellent"
                  : pi.status === "planning"
                  ? "fair"
                  : "default"
              }
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {pi.status}
            </Badge>
            {pi.risks > 0 && (
              <HelpTooltip
                content={`${pi.risks} ${pi.risks === 1 ? "risk" : "risks"} identified`}
                iconClassName="text-coral"
              />
            )}
          </div>
          <div className="text-sm text-text-secondary">
            {pi.startDate && pi.endDate && (
              <>
                {format(new Date(pi.startDate), "MMM d")} -{" "}
                {format(new Date(pi.endDate), "MMM d, yyyy")}
              </>
            )}
          </div>
        </div>
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
            <DropdownMenuItem>Edit PI</DropdownMenuItem>
            <DropdownMenuItem>Export</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-coral">Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-surface-03">
            <Users className="w-4 h-4 text-text-tertiary" />
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">{pi.teams}</div>
            <div className="text-xs text-text-tertiary">Teams</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded", pi.dependencies > 0 ? "bg-amber/10" : "bg-surface-03")}>
            <GitBranch className={cn("w-4 h-4", pi.dependencies > 0 ? "text-amber" : "text-text-tertiary")} />
          </div>
          <div>
            <div className={cn("text-sm font-medium", pi.dependencies > 0 ? "text-amber" : "text-text-primary")}>
              {pi.dependencies}
            </div>
            <div className="text-xs text-text-tertiary">Dependencies</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded", pi.risks > 0 ? "bg-coral/10" : "bg-surface-03")}>
            <AlertTriangle className={cn("w-4 h-4", pi.risks > 0 ? "text-coral" : "text-text-tertiary")} />
          </div>
          <div>
            <div
              className={cn(
                "text-sm font-medium",
                pi.risks > 0 ? "text-coral" : "text-text-primary"
              )}
            >
              {pi.risks}
            </div>
            <div className="text-xs text-text-tertiary">Risks</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-sm text-text-secondary">
          {pi.iterationCount} iterations
        </div>
        <div className="flex items-center text-sm text-iris hover:text-iris-light">
          Open Canvas
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </motion.div>
  );
}

export default function HorizonPage() {
  const router = useRouter();
  const toast = useToastActions();
  const { userRole } = useAppStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPIName, setNewPIName] = useState("");
  const [newPIIterations, setNewPIIterations] = useState("5");

  const { data: jiraStatus } = useJiraStatus();
  const isJiraConnected = jiraStatus?.connected ?? false;

  const { data: pisData, isLoading, error } = usePIs();
  const createPI = useCreatePI();

  const pis: PICardData[] = (pisData?.pis || []).map((pi) => ({
    ...pi,
    teams: pi.teamsCount || 0,
    dependencies: pi.dependenciesCount || 0,
    risks: pi.risksCount || 0,
  }));

  const handleCreatePI = async () => {
    try {
      const iterations = parseInt(newPIIterations) || 5;
      const startDate = new Date();
      const endDate = addWeeks(startDate, iterations * 2);

      const result = await createPI.mutateAsync({
        name: newPIName,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        iterationCount: iterations,
        iterationLengthWeeks: 2,
      });

      setIsCreateModalOpen(false);
      setNewPIName("");
      setNewPIIterations("5");

      if (result.pi?.id) {
        toast.success("PI created", `${newPIName} is ready for planning`);
        router.push(`/horizon/${result.pi.id}`);
      }
    } catch (err) {
      toast.error("Failed to create PI", err instanceof Error ? err.message : "Unknown error");
    }
  };

  const activePIs = pis.filter(pi => pi.status === "active");
  const planningPIs = pis.filter(pi => pi.status === "planning");
  const completedPIs = pis.filter(pi => pi.status === "completed");

  return (
    <div>
      <PageHeader
        title="Horizon"
        description={
          <span className="flex items-center gap-2">
            Program Increment planning and dependency management
            <HelpTooltip
              content={
                <div className="max-w-xs">
                  <p className="font-medium mb-1">Horizon Module</p>
                  <p className="text-slate-300 text-xs">
                    Plan and track Program Increments (PIs). Visualize features on the PI canvas,
                    manage cross-team dependencies, track objectives, and identify risks.
                  </p>
                </div>
              }
            />
          </span>
        }
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New PI
          </Button>
        }
      />

      {!isJiraConnected && <JiraConnectionPrompt variant="banner" />}

      {/* Persona Context Banner */}
      <PersonaContextBanner role={userRole} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <PIOverviewPanel pis={pis} />
          <PIInsightsPanel role={userRole} />
          <QuickActionsPanel role={userRole} />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          {/* View summary */}
          <div className="text-xs text-text-tertiary mb-4">
            Showing {pis.length} PIs
            <span className="mx-1">•</span>
            <span className="text-text-secondary">{PERSONA_CONFIGS[userRole].label} view</span>
          </div>

          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="w-12 h-12 text-coral mb-4" />
              <p className="text-text-secondary">Failed to load Program Increments</p>
            </div>
          ) : pis.length === 0 ? (
            <EmptyPIState onCreate={() => setIsCreateModalOpen(true)} />
          ) : (
            <div className="space-y-8">
              {/* Active PIs */}
              {activePIs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">Active PIs</h2>
                    <HelpTooltip content="Program Increments currently in execution. Features are being developed and dependencies tracked." />
                  </div>
                  <motion.div
                    className="grid grid-cols-1 xl:grid-cols-2 gap-4"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {activePIs.map((pi) => (
                      <PICard
                        key={pi.id}
                        pi={pi}
                        onClick={() => router.push(`/horizon/${pi.id}`)}
                      />
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Planning PIs */}
              {planningPIs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">Planning</h2>
                    <HelpTooltip content="PIs in planning phase. Teams are defining features, objectives, and identifying dependencies." />
                  </div>
                  <motion.div
                    className="grid grid-cols-1 xl:grid-cols-2 gap-4"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {planningPIs.map((pi) => (
                      <PICard
                        key={pi.id}
                        pi={pi}
                        onClick={() => router.push(`/horizon/${pi.id}`)}
                      />
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Completed PIs */}
              {completedPIs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-semibold text-text-primary">Completed</h2>
                    <HelpTooltip content="Historical PIs for reference and retrospective analysis." />
                  </div>
                  <motion.div
                    className="grid grid-cols-1 xl:grid-cols-2 gap-4"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {completedPIs.map((pi) => (
                      <PICard
                        key={pi.id}
                        pi={pi}
                        onClick={() => router.push(`/horizon/${pi.id}`)}
                      />
                    ))}
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create PI Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Create Program Increment"
        description="Set up a new PI for planning"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="pi-name">PI Name</Label>
            <Input
              id="pi-name"
              placeholder="e.g., PI 2026.3"
              value={newPIName}
              onChange={(e) => setNewPIName(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="iterations">Number of Iterations</Label>
              <HelpTooltip content="Standard PI duration is 5 iterations (10 weeks). Can be customized after creation." size="sm" />
            </div>
            <Input
              id="iterations"
              type="number"
              min={1}
              max={10}
              value={newPIIterations}
              onChange={(e) => setNewPIIterations(e.target.value)}
            />
            <p className="text-xs text-text-tertiary mt-1">
              Typically 5 iterations for a 10-week PI
            </p>
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={createPI.isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreatePI} disabled={!newPIName || createPI.isPending} isLoading={createPI.isPending}>
            Create PI
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
