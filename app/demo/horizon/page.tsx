"use client";

import { useState, useMemo } from "react";
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
  Calendar,
  Layers,
  Network,
  FileText,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useToastActions } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { format } from "date-fns";
import {
  PERSONA_PIS,
  PERSONA_CONFIGS,
  filterPIForPersona,
  getPersonaInsights,
  getPersonaMetrics,
  HELP_CONTENT,
  type PersonaRole,
} from "@/lib/demo/persona-data";
import { useDemoStore } from "@/stores/demo-store";

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
                      Showing: {focusLabels[horizonFocus]}
                    </p>
                  </div>
                }
              />
            </div>
            <p className="text-sm text-text-tertiary">
              Showing {focusLabels[horizonFocus]} and related dependencies
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-iris/20 text-iris border-iris/20">
            {horizonFocus === "my_features" && "Individual"}
            {horizonFocus === "team" && "Team"}
            {horizonFocus === "dependencies" && "Cross-Team"}
            {horizonFocus === "portfolio" && "Portfolio"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function PIOverviewPanel({ pis, role }: { pis: any[]; role: PersonaRole }) {
  const activePIs = pis.filter((pi: any) => pi.status === "active");
  const totalFeatures = pis.reduce((acc: number, pi: any) => acc + pi.features.length, 0);
  const totalDependencies = pis.reduce((acc: number, pi: any) => acc + pi.dependencies.length, 0);
  const atRiskDeps = pis.reduce((acc: number, pi: any) =>
    acc + pi.dependencies.filter((d: any) => d.status === "at_risk").length, 0
  );

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
            <div className="text-2xl font-bold text-jade">{activePIs.length}</div>
            <div className="text-xs text-text-tertiary">Active PIs</div>
          </div>
          <div className="p-3 rounded-lg bg-iris/10 border border-iris/20">
            <div className="text-2xl font-bold text-iris">{totalFeatures}</div>
            <div className="text-xs text-text-tertiary">Features</div>
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
              <span className="font-mono text-text-primary">{totalDependencies}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-amber">
                <AlertTriangle className="w-4 h-4" />
                At Risk
              </div>
              <span className="font-mono text-amber">{atRiskDeps}</span>
            </div>
          </div>
        </div>

        {role === "rte" || role === "executive" || role === "program_manager" ? (
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-text-tertiary mb-2">Cross-Team Status</div>
            <div className="space-y-1.5">
              {["Platform", "Integrations", "Mobile", "Analytics"].map(team => (
                <div key={team} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{team}</span>
                  <Badge variant={team === "Mobile" ? "fair" : "excellent"} size="sm">
                    {team === "Mobile" ? "At Risk" : "On Track"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : null}
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

  // Add Horizon-specific insights
  const horizonInsights = [...insights];

  if (role === "rte" || role === "program_manager") {
    horizonInsights.push({
      type: "action" as const,
      title: "Generate PI Objectives",
      description: "AI can suggest objectives based on backlog and strategic goals",
      action: "Generate",
      actionHref: "/demo/horizon/pi-1",
    });
  }

  if (role === "developer" || role === "scrum_master") {
    horizonInsights.push({
      type: "info" as const,
      title: "Feature progress",
      description: "3 features assigned to your team, 2 in progress",
      action: "View features",
      actionHref: "/demo/horizon/pi-1",
    });
  }

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

function ObjectivesPanel({ pis }: { pis: any[] }) {
  const activePI = pis.find((pi: any) => pi.status === "active");
  if (!activePI) return null;

  const objectives = activePI.objectives;
  const committed = objectives.filter((o: any) => o.committed);
  const avgConfidence = Math.round(
    objectives.reduce((acc: number, o: any) => acc + o.confidence, 0) / objectives.length
  );

  return (
    <CollapsibleSection
      title="PI Objectives"
      helpContent={
        <div>
          <p className="font-medium mb-1">PI Objectives</p>
          <p className="text-slate-300 text-xs">{HELP_CONTENT.piObjectives}</p>
          <p className="mt-2 text-slate-300 text-xs">{HELP_CONTENT.confidenceVote}</p>
        </div>
      }
      defaultOpen={true}
      storageKey="horizon-objectives"
      badge={
        <span className="text-xs text-text-tertiary">
          {committed.length}/{objectives.length} committed
        </span>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-tertiary">Avg. Confidence</span>
          <Badge variant={avgConfidence >= 80 ? "excellent" : avgConfidence >= 60 ? "fair" : "poor"}>
            {avgConfidence}%
          </Badge>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          {objectives.slice(0, 4).map((obj: any) => (
            <div key={obj.id} className="p-2 rounded-lg bg-surface-02">
              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                    obj.committed ? "bg-jade" : "bg-amber"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate">{obj.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default" size="sm">
                      {obj.committed ? "Committed" : "Uncommitted"}
                    </Badge>
                    <span className="text-xs text-text-tertiary">{obj.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CollapsibleSection>
  );
}

function RisksPanel({ pis }: { pis: any[] }) {
  const allRisks = pis.flatMap(pi => pi.risks);
  const highRisks = allRisks.filter(r => r.severity === "high" || r.severity === "critical");

  return (
    <CollapsibleSection
      title="Risk Register"
      helpContent={HELP_CONTENT.riskRegister}
      defaultOpen={false}
      storageKey="horizon-risks"
      badge={
        highRisks.length > 0 ? (
          <Badge variant="poor" size="sm">
            {highRisks.length} high
          </Badge>
        ) : undefined
      }
    >
      <div className="space-y-2">
        {allRisks.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-4">No risks identified</p>
        ) : (
          allRisks.slice(0, 5).map((risk) => (
            <div
              key={risk.id}
              className={cn(
                "p-2 rounded-lg border",
                risk.severity === "critical" && "bg-coral/5 border-coral/20",
                risk.severity === "high" && "bg-amber/5 border-amber/20",
                risk.severity === "medium" && "bg-surface-02 border-border",
                risk.severity === "low" && "bg-surface-02 border-border"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary">{risk.title}</span>
                <Badge
                  variant={
                    risk.severity === "critical" || risk.severity === "high"
                      ? "poor"
                      : risk.severity === "medium"
                      ? "fair"
                      : "default"
                  }
                  size="sm"
                >
                  {risk.severity}
                </Badge>
              </div>
              <p className="text-xs text-text-tertiary">{risk.mitigation}</p>
            </div>
          ))
        )}
      </div>
    </CollapsibleSection>
  );
}

function PICard({ pi, role }: { pi: any; role: PersonaRole }) {
  const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
    planning: { icon: Clock, color: "text-amber", bg: "bg-amber-dim" },
    active: { icon: Play, color: "text-jade", bg: "bg-jade-dim" },
    completed: { icon: CheckCircle2, color: "text-text-secondary", bg: "bg-surface-03" },
  };

  const config = statusConfig[pi.status] || statusConfig.active;
  const StatusIcon = config.icon;

  const totalObjectives = pi.objectives.length;
  const committedObjectives = pi.objectives.filter((o: any) => o.committed).length;
  const avgConfidence = Math.round(
    pi.objectives.reduce((acc: number, o: any) => acc + o.confidence, 0) / (totalObjectives || 1)
  );

  const atRiskDeps = pi.dependencies.filter((d: any) => d.status === "at_risk").length;

  return (
    <Link href={`/demo/horizon/${pi.id}`}>
      <motion.div
        variants={staggerItem}
        className={cn(
          "bg-surface-01 border border-border rounded-lg p-5",
          "hover:border-border-strong hover:bg-surface-02 cursor-pointer",
          "transition-colors"
        )}
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
                    : (pi.status as string) === "planning"
                    ? "fair"
                    : "default"
                }
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {pi.status}
              </Badge>
              {atRiskDeps > 0 && (
                <HelpTooltip
                  content={`${atRiskDeps} ${atRiskDeps === 1 ? "dependency" : "dependencies"} at risk`}
                  iconClassName="text-amber"
                />
              )}
            </div>
            <div className="text-sm text-text-secondary">
              {format(new Date(pi.startDate), "MMM d")} -{" "}
              {format(new Date(pi.endDate), "MMM d, yyyy")}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-surface-03">
              <Users className="w-4 h-4 text-text-tertiary" />
            </div>
            <div>
              <div className="text-sm font-medium text-text-primary">{pi.teams.length}</div>
              <div className="text-xs text-text-tertiary">Teams</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded", atRiskDeps > 0 ? "bg-amber/10" : "bg-surface-03")}>
              <GitBranch className={cn("w-4 h-4", atRiskDeps > 0 ? "text-amber" : "text-text-tertiary")} />
            </div>
            <div>
              <div className={cn("text-sm font-medium", atRiskDeps > 0 ? "text-amber" : "text-text-primary")}>
                {pi.dependencies.length}
              </div>
              <div className="text-xs text-text-tertiary">Dependencies</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded", pi.risks.length > 0 ? "bg-coral/10" : "bg-surface-03")}>
              <AlertTriangle className={cn("w-4 h-4", pi.risks.length > 0 ? "text-coral" : "text-text-tertiary")} />
            </div>
            <div>
              <div
                className={cn(
                  "text-sm font-medium",
                  pi.risks.length > 0 ? "text-coral" : "text-text-primary"
                )}
              >
                {pi.risks.length}
              </div>
              <div className="text-xs text-text-tertiary">Risks</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-surface-03">
              <Target className="w-4 h-4 text-text-tertiary" />
            </div>
            <div>
              <div className="text-sm font-medium text-text-primary">
                {committedObjectives}/{totalObjectives}
              </div>
              <div className="text-xs text-text-tertiary">Objectives</div>
            </div>
          </div>
        </div>

        {/* Objectives Preview - Different views per role */}
        {pi.objectives.length > 0 && pi.status !== "completed" && (
          <div className="mb-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-text-tertiary mb-2">
              <HelpInline label="PI Objectives" content={HELP_CONTENT.piObjectives} />
              <span className="text-text-tertiary">(Avg. Confidence: {avgConfidence}%)</span>
            </div>
            <div className="space-y-1">
              {pi.objectives.slice(0, 2).map((obj: any) => (
                <div key={obj.id} className="flex items-center gap-2 text-sm">
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      obj.committed ? "bg-jade" : "bg-amber"
                    )}
                  />
                  <span className="text-text-secondary truncate">{obj.title}</span>
                  <span className="text-text-tertiary ml-auto">{obj.confidence}%</span>
                </div>
              ))}
              {pi.objectives.length > 2 && (
                <div className="text-xs text-text-tertiary">
                  +{pi.objectives.length - 2} more objectives
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dependencies Preview for RTE/PM roles */}
        {(role === "rte" || role === "program_manager") && pi.dependencies.length > 0 && (
          <div className="mb-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-text-tertiary mb-2">
              <HelpInline label="Key Dependencies" content={HELP_CONTENT.dependencies} />
            </div>
            <div className="space-y-1">
              {pi.dependencies.slice(0, 2).map((dep: any) => (
                <div key={dep.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary truncate">{dep.description}</span>
                  <Badge
                    variant={dep.status === "resolved" ? "excellent" : dep.status === "at_risk" ? "poor" : "fair"}
                    size="sm"
                  >
                    {dep.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm text-text-secondary">
            {pi.iterations} iterations • {pi.features.length} features
          </div>
          <div className="flex items-center text-sm text-iris hover:text-iris-light">
            Open Canvas
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function QuickActionsPanel({ role }: { role: PersonaRole }) {
  const config = PERSONA_CONFIGS[role];

  const actionConfig: Record<string, { icon: typeof Target; href: string; description: string }> = {
    "Dependency map": { icon: Network, href: "/demo/horizon/pi-1", description: "View cross-team dependencies" },
    "PI objectives": { icon: Target, href: "/demo/horizon/pi-1", description: "Review and update objectives" },
    "Risk review": { icon: AlertTriangle, href: "/demo/horizon/pi-1", description: "Assess current risks" },
    "View PI canvas": { icon: Layers, href: "/demo/horizon/pi-1", description: "Open the planning canvas" },
    "Portfolio risks": { icon: AlertTriangle, href: "/demo/horizon", description: "Review strategic risks" },
    "Team comparison": { icon: BarChart3, href: "/demo/analytics", description: "Compare team performance" },
    "Executive summary": { icon: FileText, href: "/demo/signal", description: "Generate exec summary" },
    "Milestone review": { icon: Calendar, href: "/demo/horizon/pi-1", description: "Review upcoming milestones" },
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

export default function DemoHorizonPage() {
  const toast = useToastActions();
  const { selectedRole } = useDemoStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPIName, setNewPIName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Filter PIs based on persona
  const personaFilteredPIs = useMemo(() => {
    return filterPIForPersona(PERSONA_PIS, selectedRole);
  }, [selectedRole]);

  const handleCreatePI = async () => {
    setIsCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsCreateModalOpen(false);
    setNewPIName("");
    setIsCreating(false);
    toast.success("PI created", "Your new Program Increment has been created");
  };

  const activePIs = personaFilteredPIs.filter((pi) => pi.status === "active");
  const planningPIs = personaFilteredPIs.filter((pi) => (pi.status as string) === "planning");
  const completedPIs = personaFilteredPIs.filter((pi) => pi.status === "completed");

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

      {/* Persona Context Banner */}
      <PersonaContextBanner role={selectedRole} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <PIOverviewPanel pis={personaFilteredPIs} role={selectedRole} />
          <PIInsightsPanel role={selectedRole} />
          <ObjectivesPanel pis={personaFilteredPIs} />
          <RisksPanel pis={personaFilteredPIs} />
          <QuickActionsPanel role={selectedRole} />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          {/* Summary stats for the view */}
          <div className="mb-4 text-xs text-text-tertiary">
            Showing {activePIs.length + planningPIs.length + completedPIs.length} PIs
            <span className="mx-1">•</span>
            <span className="text-text-secondary">{PERSONA_CONFIGS[selectedRole].label} view</span>
          </div>

          {/* Active PIs */}
          {activePIs.length > 0 && (
            <div className="mb-8">
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
                  <PICard key={pi.id} pi={pi} role={selectedRole} />
                ))}
              </motion.div>
            </div>
          )}

          {/* Planning PIs */}
          {planningPIs.length > 0 && (
            <div className="mb-8">
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
                  <PICard key={pi.id} pi={pi} role={selectedRole} />
                ))}
              </motion.div>
            </div>
          )}

          {/* Completed PIs */}
          {completedPIs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Completed PIs</h2>
                <HelpTooltip content="Historical PIs for reference and retrospective analysis." />
              </div>
              <motion.div
                className="grid grid-cols-1 xl:grid-cols-2 gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {completedPIs.map((pi) => (
                  <PICard key={pi.id} pi={pi} role={selectedRole} />
                ))}
              </motion.div>
            </div>
          )}

          {/* Empty state */}
          {activePIs.length === 0 && planningPIs.length === 0 && completedPIs.length === 0 && (
            <div className="text-center py-12 bg-surface-01 border border-border rounded-lg">
              <Layers className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
              <p className="text-text-primary font-medium mb-1">No PIs visible for your role</p>
              <p className="text-sm text-text-tertiary mb-4">
                {selectedRole === "developer"
                  ? "You'll see PIs here when features are assigned to you"
                  : "Create a new PI to start planning"}
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Create PI
              </Button>
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
              <Label>Duration</Label>
              <HelpTooltip content="Standard PI duration is 5 iterations (10 weeks). Can be customized after creation." size="sm" />
            </div>
            <p className="text-sm text-text-secondary">
              Default: 5 iterations (10 weeks)
            </p>
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreatePI} disabled={!newPIName || isCreating} isLoading={isCreating}>
            Create PI
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
