"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  GitBranch,
  AlertTriangle,
  Target,
  Calendar,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { DEMO_PIS } from "@/lib/demo/mock-data";
import { format } from "date-fns";

function FeatureCard({ feature, teams }: { feature: (typeof DEMO_PIS)[0]["features"][0]; teams: (typeof DEMO_PIS)[0]["teams"] }) {
  const team = teams.find((t) => t.id === feature.team);

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    planned: { label: "Planned", color: "text-text-secondary", bg: "bg-surface-03" },
    in_progress: { label: "In Progress", color: "text-iris", bg: "bg-iris-dim" },
    done: { label: "Done", color: "text-jade", bg: "bg-jade-dim" },
  };

  const config = statusConfig[feature.status] || statusConfig.planned;

  return (
    <div className="bg-surface-01 border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-text-primary">{feature.title}</h4>
        <Badge variant={feature.status === "done" ? "excellent" : feature.status === "in_progress" ? "good" : "default"} size="sm">
          {config.label}
        </Badge>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-tertiary">
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: team?.color || "#666" }}
          />
          <span>{team?.name}</span>
        </div>
        <span>Iteration {feature.iteration}</span>
        <span>{feature.points} pts</span>
      </div>
    </div>
  );
}

function DependencyRow({ dep, features }: { dep: (typeof DEMO_PIS)[0]["dependencies"][0]; features: (typeof DEMO_PIS)[0]["features"] }) {
  const fromFeature = features.find((f) => f.id === dep.from);
  const toFeature = features.find((f) => f.id === dep.to);

  const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
    open: { icon: Clock, color: "text-text-secondary", bg: "bg-surface-03" },
    at_risk: { icon: AlertTriangle, color: "text-amber", bg: "bg-amber-dim" },
    resolved: { icon: CheckCircle2, color: "text-jade", bg: "bg-jade-dim" },
    blocked: { icon: XCircle, color: "text-coral", bg: "bg-coral-dim" },
  };

  const config = statusConfig[dep.status] || statusConfig.open;
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center gap-4 p-3 bg-surface-01 border border-border rounded-lg">
      <div className={cn("p-2 rounded-full", config.bg)}>
        <StatusIcon className={cn("w-4 h-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-primary font-medium truncate">{fromFeature?.title}</span>
          <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          <span className="text-text-primary font-medium truncate">{toFeature?.title}</span>
        </div>
        <p className="text-xs text-text-tertiary mt-1">{dep.description}</p>
      </div>
      <Badge
        variant={dep.status === "resolved" ? "excellent" : dep.status === "at_risk" ? "fair" : "default"}
        size="sm"
      >
        {dep.status.replace("_", " ")}
      </Badge>
    </div>
  );
}

function RiskRow({ risk }: { risk: (typeof DEMO_PIS)[0]["risks"][0] }) {
  const severityConfig: Record<string, { color: string; bg: string }> = {
    high: { color: "text-coral", bg: "bg-coral-dim" },
    medium: { color: "text-amber", bg: "bg-amber-dim" },
    low: { color: "text-jade", bg: "bg-jade-dim" },
  };

  const config = severityConfig[risk.severity] || severityConfig.medium;

  return (
    <div className="bg-surface-01 border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-text-primary">{risk.title}</h4>
        <Badge
          variant={risk.severity === "high" ? "poor" : risk.severity === "medium" ? "fair" : "excellent"}
          size="sm"
        >
          {risk.severity}
        </Badge>
      </div>
      <p className="text-xs text-text-secondary mb-2">
        <strong>Mitigation:</strong> {risk.mitigation}
      </p>
      <Badge variant="default" size="sm">
        {risk.status}
      </Badge>
    </div>
  );
}

function ObjectiveRow({ objective }: { objective: (typeof DEMO_PIS)[0]["objectives"][0] }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-surface-01 border border-border rounded-lg">
      <div className={cn(
        "p-2 rounded-full",
        objective.committed ? "bg-jade-dim" : "bg-amber-dim"
      )}>
        <Target className={cn(
          "w-4 h-4",
          objective.committed ? "text-jade" : "text-amber"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">{objective.title}</div>
        <div className="text-xs text-text-tertiary">
          {objective.committed ? "Committed" : "Uncommitted"}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-mono text-text-primary">{objective.confidence}%</div>
        <div className="text-xs text-text-tertiary">confidence</div>
      </div>
    </div>
  );
}

export default function DemoPIDetailPage({
  params,
}: {
  params: Promise<{ piId: string }>;
}) {
  const { piId } = use(params);
  const [activeTab, setActiveTab] = useState("canvas");
  const [expandedTeams, setExpandedTeams] = useState<string[]>([]);

  const pi = DEMO_PIS.find((p) => p.id === piId);

  if (!pi) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Program Increment not found</p>
        <Link href="/demo/horizon">
          <Button variant="secondary" className="mt-4">
            Back to Horizon
          </Button>
        </Link>
      </div>
    );
  }

  const toggleTeam = (teamId: string) => {
    setExpandedTeams((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  const atRiskDeps = pi.dependencies.filter((d) => d.status === "at_risk").length;
  const openDeps = pi.dependencies.filter((d) => d.status === "open").length;

  return (
    <div>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Link href="/demo/horizon">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-text-primary">{pi.name}</span>
            <Badge variant={pi.status === "active" ? "excellent" : "default"}>
              {pi.status}
            </Badge>
          </div>
        }
        description={`${format(new Date(pi.startDate), "MMM d")} - ${format(new Date(pi.endDate), "MMM d, yyyy")} • ${pi.iterations} iterations`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-01 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm text-text-secondary">Teams</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">{pi.teams.length}</div>
        </div>
        <div className="bg-surface-01 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm text-text-secondary">Dependencies</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {pi.dependencies.length}
            {atRiskDeps > 0 && (
              <span className="text-sm text-amber ml-2">({atRiskDeps} at risk)</span>
            )}
          </div>
        </div>
        <div className="bg-surface-01 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm text-text-secondary">Risks</span>
          </div>
          <div className={cn(
            "text-2xl font-bold",
            pi.risks.filter((r) => r.severity === "high").length > 0 ? "text-coral" : "text-text-primary"
          )}>
            {pi.risks.length}
          </div>
        </div>
        <div className="bg-surface-01 border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm text-text-secondary">Objectives</span>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {pi.objectives.filter((o) => o.committed).length}/{pi.objectives.length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsListUnderline>
          <TabsTriggerUnderline value="canvas">
            Canvas
          </TabsTriggerUnderline>
          <TabsTriggerUnderline value="dependencies">
            Dependencies
            {(atRiskDeps > 0 || openDeps > 0) && (
              <Badge variant={atRiskDeps > 0 ? "fair" : "default"} size="sm" className="ml-2">
                {atRiskDeps + openDeps}
              </Badge>
            )}
          </TabsTriggerUnderline>
          <TabsTriggerUnderline value="risks">
            Risks
            {pi.risks.length > 0 && (
              <Badge variant="fair" size="sm" className="ml-2">
                {pi.risks.length}
              </Badge>
            )}
          </TabsTriggerUnderline>
          <TabsTriggerUnderline value="objectives">
            Objectives
          </TabsTriggerUnderline>
        </TabsListUnderline>

        {/* Canvas Tab */}
        <TabsContent value="canvas" className="mt-6">
          <div className="space-y-4">
            {/* Iteration Headers */}
            <div className="flex gap-4 overflow-x-auto pb-2">
              <div className="w-40 flex-shrink-0" />
              {Array.from({ length: pi.iterations }, (_, i) => (
                <div key={i} className="w-48 flex-shrink-0 text-center">
                  <div className="text-sm font-medium text-text-primary">Iteration {i + 1}</div>
                  <div className="text-xs text-text-tertiary">2 weeks</div>
                </div>
              ))}
            </div>

            {/* Team Rows */}
            {pi.teams.map((team) => {
              const teamFeatures = pi.features.filter((f) => f.team === team.id);
              const isExpanded = expandedTeams.includes(team.id);

              return (
                <div key={team.id} className="bg-surface-01 border border-border rounded-lg">
                  <button
                    onClick={() => toggleTeam(team.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-surface-02 transition-colors"
                  >
                    <ChevronDown className={cn(
                      "w-4 h-4 text-text-tertiary transition-transform",
                      !isExpanded && "-rotate-90"
                    )} />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="font-medium text-text-primary">{team.name}</span>
                    <span className="text-sm text-text-tertiary">
                      {teamFeatures.length} features • {team.capacity} pts capacity
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="flex gap-4 overflow-x-auto">
                        <div className="w-40 flex-shrink-0" />
                        {Array.from({ length: pi.iterations }, (_, i) => {
                          const iterationFeatures = teamFeatures.filter(
                            (f) => f.iteration === i + 1
                          );
                          return (
                            <div key={i} className="w-48 flex-shrink-0 space-y-2">
                              {iterationFeatures.length > 0 ? (
                                iterationFeatures.map((feature) => (
                                  <FeatureCard
                                    key={feature.id}
                                    feature={feature}
                                    teams={pi.teams}
                                  />
                                ))
                              ) : (
                                <div className="h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                                  <span className="text-xs text-text-tertiary">No features</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Dependencies Tab */}
        <TabsContent value="dependencies" className="mt-6">
          <div className="space-y-3">
            {pi.dependencies.length === 0 ? (
              <div className="text-center py-12 bg-surface-01 border border-border rounded-lg">
                <GitBranch className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-text-secondary">No dependencies identified</p>
              </div>
            ) : (
              pi.dependencies.map((dep) => (
                <DependencyRow key={dep.id} dep={dep} features={pi.features} />
              ))
            )}
          </div>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pi.risks.length === 0 ? (
              <div className="text-center py-12 bg-surface-01 border border-border rounded-lg col-span-2">
                <AlertTriangle className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-text-secondary">No risks identified</p>
              </div>
            ) : (
              pi.risks.map((risk) => (
                <RiskRow key={risk.id} risk={risk} />
              ))
            )}
          </div>
        </TabsContent>

        {/* Objectives Tab */}
        <TabsContent value="objectives" className="mt-6">
          <div className="space-y-3">
            {pi.objectives.length === 0 ? (
              <div className="text-center py-12 bg-surface-01 border border-border rounded-lg">
                <Target className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-text-secondary">No objectives defined</p>
              </div>
            ) : (
              pi.objectives.map((obj) => (
                <ObjectiveRow key={obj.id} objective={obj} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
