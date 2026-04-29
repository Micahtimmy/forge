"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Send,
  Map,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Brain,
  Target,
  Users,
  Building2,
  BarChart3,
  Network,
} from "lucide-react";
import { ScoreRing } from "@/components/ui/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import {
  DEMO_STORIES,
  DEMO_UPDATES,
  DEMO_PIS,
  DEMO_TEAM,
  DEMO_SPRINT_COMMAND_CENTER,
  DEMO_ACTIVE_RISKS,
  DEMO_STORY_INSIGHTS,
  DEMO_CAPACITY_INTELLIGENCE,
  DEMO_SPRINT_PREDICTION,
  DEMO_EXECUTIVE_SUMMARY,
  DEMO_WORKSPACE_COMPARISON,
  DEMO_RISK_AGGREGATION,
  DEMO_VELOCITY_FORECAST,
  calculateSprintHealth,
  getScoreDistribution,
  getStoriesAtRisk,
  getSprintHealthStatus,
} from "@/lib/demo/mock-data";
import { formatDistanceToNow } from "date-fns";
import { SprintCommandCenter } from "@/components/system/surfaces/SprintCommandCenter";
import { RiskReviewPanel } from "@/components/system/surfaces/RiskReviewPanel";
import { StoryInsightCard } from "@/components/system/intelligence/StoryInsightCard";
import { useToastActions } from "@/components/ui/toast";
import { useDemoStore } from "@/stores/demo-store";
import { ROLE_DEFINITIONS } from "@/lib/onboarding/roles";

const sprintHealth = calculateSprintHealth(DEMO_STORIES);
const distribution = getScoreDistribution(DEMO_STORIES);
const storiesAtRisk = getStoriesAtRisk(DEMO_STORIES);
const activePIs = DEMO_PIS.filter((pi) => pi.status === "active");
const burnoutRisks = DEMO_CAPACITY_INTELLIGENCE.members.filter((m: { burnoutRisk: string }) => m.burnoutRisk === "high");

function StatCard({
  icon,
  label,
  value,
  trend,
  href,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  trend?: { direction: "up" | "down"; value: number };
  href?: string;
  className?: string;
}) {
  const content = (
    <div
      className={cn(
        "block p-4 rounded-lg border border-border bg-surface-01",
        href && "hover:bg-surface-02 hover:border-border-strong cursor-pointer",
        "transition-all",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-md bg-surface-03">{icon}</div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.direction === "up" ? "text-jade" : "text-coral"
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold font-mono text-text-primary">
          {value}
        </div>
        <div className="text-sm text-text-secondary mt-0.5">{label}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <motion.div variants={staggerItem}>
        <Link href={href}>{content}</Link>
      </motion.div>
    );
  }

  return <motion.div variants={staggerItem}>{content}</motion.div>;
}

function StoryRow({ story }: { story: (typeof DEMO_STORIES)[0] }) {
  const score = story.score?.totalScore ?? 0;

  return (
    <Link href={`/demo/quality-gate/story/${story.id}`}>
      <div
        className={cn(
          "flex items-center gap-4 p-3 rounded-lg border bg-surface-01",
          "hover:bg-surface-02 hover:border-border-strong cursor-pointer transition-colors",
          score >= 70
            ? "border-border"
            : score >= 50
            ? "border-l-2 border-l-amber border-border"
            : "border-l-2 border-l-coral border-border"
        )}
      >
        <ScoreRing score={score} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-tertiary">
              {story.jiraKey}
            </span>
            <Badge variant="default" size="sm">
              {story.status}
            </Badge>
          </div>
          <div className="text-sm font-medium text-text-primary truncate">
            {story.title}
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-text-tertiary" />
      </div>
    </Link>
  );
}

function UpdateRow({ update }: { update: (typeof DEMO_UPDATES)[0] }) {
  return (
    <Link href={`/demo/signal/${update.id}`}>
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border bg-surface-01",
          "hover:bg-surface-02 hover:border-border-strong cursor-pointer transition-colors"
        )}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            update.status === "sent" ? "bg-jade-dim" : "bg-amber-dim"
          )}
        >
          {update.status === "sent" ? (
            <CheckCircle2 className="w-4 h-4 text-jade" />
          ) : (
            <Clock className="w-4 h-4 text-amber" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">
            {update.title}
          </div>
          <div className="text-xs text-text-tertiary">
            {update.sentAt
              ? `Sent ${formatDistanceToNow(new Date(update.sentAt), { addSuffix: true })}`
              : `Draft - ${formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}`}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DemoDashboard() {
  const router = useRouter();
  const toast = useToastActions();
  const { selectedRole } = useDemoStore();
  const roleConfig = ROLE_DEFINITIONS[selectedRole];
  const [isRiskPanelOpen, setIsRiskPanelOpen] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleScoreAll = async () => {
    setIsScoring(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success("Sprint scored", `Analyzed ${DEMO_STORIES.length} stories with AI`);
    setIsScoring(false);
  };

  const handleSyncJira = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("JIRA synced", "All stories are up to date");
    setIsSyncing(false);
  };

  const handleAcknowledgeRisk = (riskId: string) => {
    toast.success("Risk acknowledged", "You will be notified of any changes");
  };

  const handleResolveRisk = (riskId: string) => {
    toast.success("Risk resolved", "Great job addressing this issue!");
  };

  const getRoleGreeting = () => {
    switch (selectedRole) {
      case 'executive': return 'Executive Overview';
      case 'rte': return 'Release Train Dashboard';
      case 'program_manager': return 'Program Dashboard';
      case 'engineering_manager': return 'Team Performance Dashboard';
      case 'product_manager': return 'Product Dashboard';
      case 'developer': return 'My Sprint View';
      default: return 'Sprint Dashboard';
    }
  };

  const getRoleDescription = () => {
    switch (selectedRole) {
      case 'executive': return 'Cross-workspace metrics and organizational health';
      case 'rte': return 'Train coordination, PI progress, and team alignment';
      case 'program_manager': return 'Cross-team dependencies, risks, and program execution';
      case 'engineering_manager': return 'Team velocity, capacity, and individual metrics';
      case 'product_manager': return 'Backlog quality, feature progress, and stakeholder updates';
      case 'developer': return 'Your assigned stories and sprint progress';
      default: return 'Sprint health, story quality, and team progress';
    }
  };

  // Executive view
  if (selectedRole === 'executive') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-text-primary">{getRoleGreeting()}</h1>
          <p className="text-text-secondary mt-1">{getRoleDescription()}</p>
        </div>

        {/* Executive Summary Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Building2 className="w-5 h-5 text-iris" />}
              label="Total Workspaces"
              value={DEMO_EXECUTIVE_SUMMARY.totalWorkspaces}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Target className="w-5 h-5 text-jade" />}
              label="Avg Quality Score"
              value={DEMO_EXECUTIVE_SUMMARY.averageQualityScore}
              trend={{ direction: "up", value: 8 }}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              icon={<BarChart3 className="w-5 h-5 text-iris" />}
              label="Team Utilization"
              value={`${DEMO_EXECUTIVE_SUMMARY.teamUtilization}%`}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              icon={<AlertTriangle className="w-5 h-5 text-coral" />}
              label="At-Risk Sprints"
              value={DEMO_EXECUTIVE_SUMMARY.atRiskSprints}
              href="/demo/analytics"
            />
          </motion.div>
        </motion.div>

        {/* Workspace Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface-01 border border-border rounded-lg p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Workspace Performance</h3>
            <div className="space-y-3">
              {DEMO_WORKSPACE_COMPARISON.map((ws) => (
                <div key={ws.workspaceId} className="flex items-center justify-between p-3 bg-surface-02 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-iris/20 flex items-center justify-center text-iris font-semibold text-sm">
                      {ws.workspaceName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{ws.workspaceName}</p>
                      <p className="text-xs text-text-tertiary">{ws.metrics.teamSize} members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="text-text-tertiary text-xs">Quality</p>
                      <p className={cn("font-mono font-semibold", ws.metrics.avgQualityScore >= 70 ? "text-jade" : "text-amber")}>
                        {ws.metrics.avgQualityScore}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-tertiary text-xs">Velocity</p>
                      <p className="font-mono font-semibold text-text-primary">{ws.metrics.velocity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/demo/analytics">
              <Button variant="secondary" size="sm" className="w-full mt-4">
                View Full Analytics
              </Button>
            </Link>
          </div>

          <div className="bg-surface-01 border border-border rounded-lg p-5">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-coral" />
              Organization Risk Summary
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-coral/10 border border-coral/20 rounded-lg">
                <p className="text-xs text-coral uppercase font-medium">Critical</p>
                <p className="text-2xl font-semibold font-mono text-coral">{DEMO_RISK_AGGREGATION.bySeverity.critical}</p>
              </div>
              <div className="p-3 bg-amber/10 border border-amber/20 rounded-lg">
                <p className="text-xs text-amber uppercase font-medium">High</p>
                <p className="text-2xl font-semibold font-mono text-amber">{DEMO_RISK_AGGREGATION.bySeverity.high}</p>
              </div>
            </div>
            <div className="space-y-2">
              {DEMO_RISK_AGGREGATION.topRisks.slice(0, 3).map((risk) => (
                <div key={risk.id} className="flex items-center gap-2 p-2 bg-surface-02 rounded text-sm">
                  <span className={cn("w-2 h-2 rounded-full", risk.severity === "critical" ? "bg-coral" : "bg-amber")} />
                  <span className="text-text-secondary truncate">{risk.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions for Executive */}
        <div className="bg-surface-01 border border-border rounded-lg p-5">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {roleConfig.quickActions.map((action) => (
              <Link key={action.id} href={action.href.replace('/', '/demo/')}>
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                  <div className="p-2 rounded-lg bg-iris/10">
                    <BarChart3 className="w-5 h-5 text-iris" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{action.label}</p>
                    <p className="text-xs text-text-tertiary">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <RiskReviewPanel
          isOpen={isRiskPanelOpen}
          onClose={() => setIsRiskPanelOpen(false)}
          risks={DEMO_ACTIVE_RISKS as any}
          onAcknowledge={handleAcknowledgeRisk}
          onResolve={handleResolveRisk}
        />
      </div>
    );
  }

  // RTE (Release Train Engineer) view - Focus on PI planning and cross-team coordination
  if (selectedRole === 'rte') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-text-primary">{getRoleGreeting()}</h1>
          <p className="text-text-secondary mt-1">{getRoleDescription()}</p>
        </div>

        {/* RTE Summary Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <StatCard
            icon={<Map className="w-5 h-5 text-sky" />}
            label="Active PIs"
            value={activePIs.length}
            href="/demo/horizon"
          />
          <StatCard
            icon={<Network className="w-5 h-5 text-iris" />}
            label="Cross-team Dependencies"
            value={7}
            trend={{ direction: "down", value: 3 }}
            href="/demo/horizon"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-coral" />}
            label="Blocked Items"
            value={3}
            href="/demo/kanban"
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-jade" />}
            label="Teams on Track"
            value="4/5"
            trend={{ direction: "up", value: 20 }}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PI Progress */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">PI Progress Overview</h3>
                <Link href="/demo/horizon">
                  <Button variant="secondary" size="sm">View Canvas</Button>
                </Link>
              </div>
              <div className="space-y-4">
                {activePIs.map((pi) => (
                  <div key={pi.id} className="p-4 bg-surface-02 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-text-primary">{pi.name}</span>
                      <Badge variant={pi.status === "active" ? "excellent" : "default"}>
                        {pi.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text-secondary mb-3">
                      <span>{pi.startDate} - {pi.endDate}</span>
                    </div>
                    <div className="h-2 bg-surface-03 rounded-full overflow-hidden">
                      <div className="h-full bg-iris rounded-full" style={{ width: '65%' }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-text-tertiary">
                      <span>65% Complete</span>
                      <span>Week 4 of 6</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dependency Health */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Dependency Health</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-jade/10 border border-jade/20 rounded-lg">
                  <p className="text-2xl font-bold font-mono text-jade">12</p>
                  <p className="text-xs text-text-secondary">Resolved</p>
                </div>
                <div className="text-center p-3 bg-amber/10 border border-amber/20 rounded-lg">
                  <p className="text-2xl font-bold font-mono text-amber">5</p>
                  <p className="text-xs text-text-secondary">At Risk</p>
                </div>
                <div className="text-center p-3 bg-coral/10 border border-coral/20 rounded-lg">
                  <p className="text-2xl font-bold font-mono text-coral">2</p>
                  <p className="text-xs text-text-secondary">Blocked</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Team Alignment */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Team Alignment</h3>
              <div className="space-y-3">
                {['Platform', 'Mobile', 'Backend', 'Frontend', 'QA'].map((team, idx) => (
                  <div key={team} className="flex items-center justify-between">
                    <span className="text-sm text-text-primary">{team}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-surface-03 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", idx === 2 ? "bg-amber" : "bg-jade")}
                          style={{ width: `${85 - idx * 8}%` }}
                        />
                      </div>
                      <span className={cn("text-xs font-mono", idx === 2 ? "text-amber" : "text-jade")}>
                        {85 - idx * 8}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/demo/horizon">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <Map className="w-4 h-4 text-sky" />
                    <span className="text-sm">Open PI Canvas</span>
                  </div>
                </Link>
                <Link href="/demo/signal/new">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <Send className="w-4 h-4 text-jade" />
                    <span className="text-sm">Send Train Update</span>
                  </div>
                </Link>
                <Link href="/demo/analytics">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <BarChart3 className="w-4 h-4 text-iris" />
                    <span className="text-sm">View Metrics</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Program Manager view - Focus on cross-team execution and risk management
  if (selectedRole === 'program_manager') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-text-primary">{getRoleGreeting()}</h1>
          <p className="text-text-secondary mt-1">{getRoleDescription()}</p>
        </div>

        {/* Program Manager Summary Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <StatCard
            icon={<Network className="w-5 h-5 text-iris" />}
            label="Active Dependencies"
            value={19}
            href="/demo/horizon"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-coral" />}
            label="Program Risks"
            value={DEMO_ACTIVE_RISKS.filter(r => !r.resolvedAt).length}
            href="/demo/analytics"
          />
          <StatCard
            icon={<Target className="w-5 h-5 text-jade" />}
            label="On-Track Milestones"
            value="8/10"
            trend={{ direction: "up", value: 10 }}
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-sky" />}
            label="Execution Health"
            value="78%"
            trend={{ direction: "up", value: 5 }}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Management */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-coral" />
                  Program Risks
                </h3>
                <Button variant="secondary" size="sm" onClick={() => setIsRiskPanelOpen(true)}>
                  Review All
                </Button>
              </div>
              <div className="space-y-3">
                {DEMO_ACTIVE_RISKS.filter(r => !r.resolvedAt).slice(0, 4).map((risk) => (
                  <div
                    key={risk.id}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer hover:bg-surface-02 transition-colors",
                      risk.severity === "critical" ? "border-coral/30 bg-coral/5" : "border-border bg-surface-02"
                    )}
                    onClick={() => setIsRiskPanelOpen(true)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">{risk.title}</p>
                        <p className="text-sm text-text-secondary mt-1 line-clamp-1">{risk.description}</p>
                      </div>
                      <Badge variant={risk.severity === "critical" ? "poor" : risk.severity === "high" ? "fair" : "default"}>
                        {risk.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
                      <span>Probability: {risk.probability}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross-team Dependencies */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Cross-team Dependencies</h3>
              <div className="space-y-3">
                {[
                  { from: "Platform", to: "Mobile", status: "resolved", item: "Auth API Ready" },
                  { from: "Backend", to: "Frontend", status: "at-risk", item: "GraphQL Schema" },
                  { from: "Mobile", to: "QA", status: "blocked", item: "Test Builds" },
                ].map((dep, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-surface-02 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary">{dep.from}</span>
                      <ArrowRight className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm text-text-secondary">{dep.to}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary">{dep.item}</span>
                      <Badge variant={dep.status === "resolved" ? "excellent" : dep.status === "at-risk" ? "fair" : "poor"}>
                        {dep.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Milestone Tracker */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Upcoming Milestones</h3>
              <div className="space-y-3">
                {[
                  { name: "API Freeze", date: "Apr 30", status: "on-track" },
                  { name: "Feature Complete", date: "May 7", status: "at-risk" },
                  { name: "Code Freeze", date: "May 14", status: "on-track" },
                ].map((milestone, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-surface-02 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{milestone.name}</p>
                      <p className="text-xs text-text-tertiary">{milestone.date}</p>
                    </div>
                    <Badge variant={milestone.status === "on-track" ? "excellent" : "fair"}>
                      {milestone.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/demo/horizon">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <Network className="w-4 h-4 text-iris" />
                    <span className="text-sm">Dependency Map</span>
                  </div>
                </Link>
                <Link href="/demo/signal/new">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <Send className="w-4 h-4 text-jade" />
                    <span className="text-sm">Status Report</span>
                  </div>
                </Link>
                <button
                  onClick={() => setIsRiskPanelOpen(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-coral" />
                  <span className="text-sm">Risk Review</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <RiskReviewPanel
          isOpen={isRiskPanelOpen}
          onClose={() => setIsRiskPanelOpen(false)}
          risks={DEMO_ACTIVE_RISKS as any}
          onAcknowledge={handleAcknowledgeRisk}
          onResolve={handleResolveRisk}
        />
      </div>
    );
  }

  // Engineering Manager view - Focus on team performance and capacity
  if (selectedRole === 'engineering_manager') {
    return (
      <div>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">{getRoleGreeting()}</h1>
            <p className="text-text-secondary mt-1">{getRoleDescription()}</p>
          </div>
          {burnoutRisks.length > 0 && (
            <button
              onClick={() => setIsRiskPanelOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-coral/10 border border-coral/20 text-coral hover:bg-coral/20 transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{burnoutRisks.length} Team Member{burnoutRisks.length > 1 ? 's' : ''} at Risk</span>
            </button>
          )}
        </div>

        {/* EM Summary Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-jade" />}
            label="Team Velocity"
            value={DEMO_VELOCITY_FORECAST.periods[4]?.actual ?? 28}
            trend={{ direction: "up", value: 12 }}
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-iris" />}
            label="Team Utilization"
            value={`${Math.round(DEMO_CAPACITY_INTELLIGENCE.members.reduce((sum: number, m: { allocation: number }) => sum + m.allocation, 0) / DEMO_CAPACITY_INTELLIGENCE.members.length)}%`}
          />
          <StatCard
            icon={<Target className="w-5 h-5 text-sky" />}
            label="Sprint Completion"
            value={`${DEMO_SPRINT_PREDICTION.projectedCompletion.likely}%`}
          />
          <StatCard
            icon={<ShieldCheck className="w-5 h-5 text-jade" />}
            label="Quality Score"
            value={sprintHealth}
            trend={{ direction: "up", value: 8 }}
            href="/demo/quality-gate"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Performance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Capacity - Expanded */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Team Capacity</h3>
                <Badge variant={DEMO_CAPACITY_INTELLIGENCE.teamHealth.overallScore >= 80 ? "excellent" : "fair"}>
                  Health: {DEMO_CAPACITY_INTELLIGENCE.teamHealth.overallScore}
                </Badge>
              </div>
              <div className="space-y-4">
                {DEMO_CAPACITY_INTELLIGENCE.members.map((member) => (
                  <div key={member.userId} className="p-3 bg-surface-02 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-03 flex items-center justify-center text-xs font-medium text-text-secondary">
                          {member.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{member.name}</p>
                          <p className="text-xs text-text-tertiary">{member.capacity} capacity</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.burnoutRisk !== "low" && (
                          <Badge variant={member.burnoutRisk === "high" ? "poor" : "fair"}>
                            {member.burnoutRisk} risk
                          </Badge>
                        )}
                        <span className={cn(
                          "text-sm font-mono font-semibold",
                          member.allocation > 100 ? "text-coral" :
                          member.allocation > 85 ? "text-amber" : "text-jade"
                        )}>
                          {member.allocation}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface-03 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          member.allocation > 100 ? "bg-coral" :
                          member.allocation > 85 ? "bg-amber" : "bg-jade"
                        )}
                        style={{ width: `${Math.min(member.allocation, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Velocity Trend */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Velocity Forecast</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-surface-02 rounded-lg">
                  <p className="text-xs text-text-tertiary uppercase">Current</p>
                  <p className="text-2xl font-bold font-mono text-text-primary">{DEMO_VELOCITY_FORECAST.periods[4]?.actual ?? 28}</p>
                </div>
                <div className="text-center p-4 bg-surface-02 rounded-lg">
                  <p className="text-xs text-text-tertiary uppercase">Predicted</p>
                  <p className="text-2xl font-bold font-mono text-iris">{DEMO_VELOCITY_FORECAST.periods[5]?.predicted ?? 28}</p>
                </div>
                <div className="text-center p-4 bg-surface-02 rounded-lg">
                  <p className="text-xs text-text-tertiary uppercase">Confidence</p>
                  <p className="text-2xl font-bold font-mono text-jade">{Math.round(DEMO_VELOCITY_FORECAST.confidence * 100)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Sprint Progress */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Sprint Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">Completed</span>
                    <span className="text-jade font-mono">{DEMO_SPRINT_COMMAND_CENTER.metrics.completedStories}</span>
                  </div>
                  <div className="h-2 bg-jade/20 rounded-full">
                    <div className="h-full bg-jade rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">In Progress</span>
                    <span className="text-iris font-mono">{DEMO_SPRINT_COMMAND_CENTER.metrics.inProgressStories}</span>
                  </div>
                  <div className="h-2 bg-iris/20 rounded-full">
                    <div className="h-full bg-iris rounded-full" style={{ width: '30%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">To Do</span>
                    <span className="text-text-tertiary font-mono">
                      {DEMO_SPRINT_COMMAND_CENTER.metrics.totalStories - DEMO_SPRINT_COMMAND_CENTER.metrics.completedStories - DEMO_SPRINT_COMMAND_CENTER.metrics.inProgressStories}
                    </span>
                  </div>
                  <div className="h-2 bg-surface-03 rounded-full">
                    <div className="h-full bg-surface-04 rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/demo/analytics">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <BarChart3 className="w-4 h-4 text-iris" />
                    <span className="text-sm">Team Analytics</span>
                  </div>
                </Link>
                <Link href="/demo/kanban">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <Target className="w-4 h-4 text-sky" />
                    <span className="text-sm">Kanban Board</span>
                  </div>
                </Link>
                <Link href="/demo/settings/team">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <Users className="w-4 h-4 text-jade" />
                    <span className="text-sm">Manage Team</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Product Manager view - Focus on backlog quality and stakeholder communication
  if (selectedRole === 'product_manager') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-text-primary">{getRoleGreeting()}</h1>
          <p className="text-text-secondary mt-1">{getRoleDescription()}</p>
        </div>

        {/* PM Summary Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <StatCard
            icon={<ShieldCheck className="w-5 h-5 text-iris" />}
            label="Backlog Quality"
            value={sprintHealth}
            trend={{ direction: "up", value: 8 }}
            href="/demo/quality-gate"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-amber" />}
            label="Stories Need Work"
            value={storiesAtRisk.length}
            href="/demo/quality-gate"
          />
          <StatCard
            icon={<Send className="w-5 h-5 text-jade" />}
            label="Updates Sent"
            value={DEMO_UPDATES.filter((u) => u.status === "sent").length}
            href="/demo/signal"
          />
          <StatCard
            icon={<Target className="w-5 h-5 text-sky" />}
            label="Features on Track"
            value="12/15"
            trend={{ direction: "up", value: 10 }}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Backlog Quality */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stories Needing Attention */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Stories Needing Improvement</h3>
                <Link href="/demo/quality-gate">
                  <Button variant="secondary" size="sm">Score All</Button>
                </Link>
              </div>
              <div className="space-y-3">
                {storiesAtRisk.slice(0, 4).map((story) => (
                  <StoryRow key={story.id} story={story} />
                ))}
              </div>
            </div>

            {/* Score Distribution */}
            <div className="bg-surface-01 border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-text-primary mb-4">Backlog Score Distribution</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-full h-2 rounded-full bg-jade/20 mb-2">
                    <div className="h-full rounded-full bg-jade" style={{ width: `${(distribution.excellent / DEMO_STORIES.length) * 100}%` }} />
                  </div>
                  <div className="text-lg font-bold text-jade">{distribution.excellent}</div>
                  <div className="text-xs text-text-tertiary">Excellent</div>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 rounded-full bg-iris/20 mb-2">
                    <div className="h-full rounded-full bg-iris" style={{ width: `${(distribution.good / DEMO_STORIES.length) * 100}%` }} />
                  </div>
                  <div className="text-lg font-bold text-iris">{distribution.good}</div>
                  <div className="text-xs text-text-tertiary">Good</div>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 rounded-full bg-amber/20 mb-2">
                    <div className="h-full rounded-full bg-amber" style={{ width: `${(distribution.fair / DEMO_STORIES.length) * 100}%` }} />
                  </div>
                  <div className="text-lg font-bold text-amber">{distribution.fair}</div>
                  <div className="text-xs text-text-tertiary">Fair</div>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 rounded-full bg-coral/20 mb-2">
                    <div className="h-full rounded-full bg-coral" style={{ width: `${(distribution.poor / DEMO_STORIES.length) * 100}%` }} />
                  </div>
                  <div className="text-lg font-bold text-coral">{distribution.poor}</div>
                  <div className="text-xs text-text-tertiary">Poor</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Updates */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Recent Updates</h3>
                <Link href="/demo/signal">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              <div className="space-y-2">
                {DEMO_UPDATES.slice(0, 3).map((update) => (
                  <UpdateRow key={update.id} update={update} />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/demo/signal/new">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <Send className="w-4 h-4 text-jade" />
                    <span className="text-sm">Create Status Update</span>
                  </div>
                </Link>
                <Link href="/demo/quality-gate">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <ShieldCheck className="w-4 h-4 text-iris" />
                    <span className="text-sm">Review Story Quality</span>
                  </div>
                </Link>
                <Link href="/demo/horizon">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <Map className="w-4 h-4 text-sky" />
                    <span className="text-sm">Feature Roadmap</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Developer view - Focus on assigned work and personal metrics
  if (selectedRole === 'developer') {
    const myStories = DEMO_STORIES.filter(s => s.assigneeId === 'user-1').slice(0, 5);
    const myCompletedStories = myStories.filter(s => s.status === 'done');
    const myInProgressStories = myStories.filter(s => s.status === 'in_progress');

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-text-primary">{getRoleGreeting()}</h1>
          <p className="text-text-secondary mt-1">{getRoleDescription()}</p>
        </div>

        {/* Developer Summary Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <StatCard
            icon={<Target className="w-5 h-5 text-iris" />}
            label="My Stories"
            value={myStories.length}
            href="/demo/kanban"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-jade" />}
            label="Completed"
            value={myCompletedStories.length}
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber" />}
            label="In Progress"
            value={myInProgressStories.length}
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-sky" />}
            label="Story Points"
            value="13"
            trend={{ direction: "up", value: 8 }}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Work */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">My Assigned Stories</h3>
                <Link href="/demo/kanban">
                  <Button variant="secondary" size="sm">View Board</Button>
                </Link>
              </div>
              <div className="space-y-3">
                {(myStories.length > 0 ? myStories : DEMO_STORIES.slice(0, 4)).map((story) => (
                  <StoryRow key={story.id} story={story} />
                ))}
              </div>
            </div>

            {/* Sprint Overview */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Sprint Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-02 rounded-lg">
                  <p className="text-xs text-text-tertiary uppercase mb-1">Days Remaining</p>
                  <p className="text-2xl font-bold font-mono text-text-primary">7</p>
                </div>
                <div className="p-4 bg-surface-02 rounded-lg">
                  <p className="text-xs text-text-tertiary uppercase mb-1">Sprint Health</p>
                  <div className="flex items-center gap-2">
                    <ScoreRing score={sprintHealth} size="sm" showLabel={false} />
                    <span className="text-lg font-bold font-mono">{sprintHealth}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* My Stats */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">My Stats This Sprint</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Points Completed</span>
                  <span className="font-mono font-semibold text-jade">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Points In Progress</span>
                  <span className="font-mono font-semibold text-iris">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Avg Quality Score</span>
                  <span className="font-mono font-semibold text-jade">78</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Cycle Time</span>
                  <span className="font-mono font-semibold text-text-primary">2.3 days</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface-01 border border-border rounded-lg p-5">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/demo/kanban">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <Target className="w-4 h-4 text-iris" />
                    <span className="text-sm">My Board</span>
                  </div>
                </Link>
                <Link href="/demo/quality-gate">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <ShieldCheck className="w-4 h-4 text-jade" />
                    <span className="text-sm">Check Story Quality</span>
                  </div>
                </Link>
                <Link href="/demo/analytics">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 hover:bg-surface-03 transition-colors cursor-pointer">
                    <BarChart3 className="w-4 h-4 text-sky" />
                    <span className="text-sm">My Analytics</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with ML Predictions Badge */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">{getRoleGreeting()}</h1>
          <p className="text-text-secondary mt-1">{getRoleDescription()}</p>
        </div>

        {/* AI Predictions Summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-iris/10 border border-iris/20">
            <Brain className="w-4 h-4 text-iris" />
            <span className="text-sm font-medium text-iris">
              ML: {DEMO_SPRINT_PREDICTION.projectedCompletion.likely}% completion predicted
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <StatCard
          icon={<ShieldCheck className="w-5 h-5 text-iris" />}
          label="Sprint Health Score"
          value={
            <div className="flex items-center gap-2">
              <ScoreRing score={sprintHealth} size="sm" showLabel={false} />
              <span>{sprintHealth}</span>
            </div>
          }
          trend={{ direction: "up", value: 8 }}
          href="/demo/quality-gate"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-amber" />}
          label="Stories at Risk"
          value={storiesAtRisk.length}
          href="/demo/quality-gate"
        />
        <StatCard
          icon={<Send className="w-5 h-5 text-jade" />}
          label="Updates This Sprint"
          value={DEMO_UPDATES.filter((u) => u.status === "sent").length}
          href="/demo/signal"
        />
        <StatCard
          icon={<Map className="w-5 h-5 text-sky" />}
          label="Active PIs"
          value={activePIs.length}
          href="/demo/horizon"
        />
      </motion.div>

      {/* Sprint Command Center - Full Width */}
      <div className="mb-8">
        <SprintCommandCenter
          sprintId={parseInt(DEMO_SPRINT_COMMAND_CENTER.sprintId.replace('sprint-', ''))}
          sprintName={DEMO_SPRINT_COMMAND_CENTER.sprintName}
          metrics={DEMO_SPRINT_COMMAND_CENTER.metrics}
          alerts={DEMO_SPRINT_COMMAND_CENTER.alerts}
          healthStatus={DEMO_SPRINT_COMMAND_CENTER.healthStatus}
          onScoreAll={handleScoreAll}
          onSyncJira={handleSyncJira}
          onViewBurndown={() => router.push('/demo/analytics')}
          onViewStories={() => router.push('/demo/quality-gate')}
          isScoring={isScoring}
          isSyncing={isSyncing}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - AI Story Insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stories at Risk with V2 Insight Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-text-primary">
                  AI Story Insights
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-iris/10 text-iris border border-iris/20">
                  ML Powered
                </span>
              </div>
              <Link href="/demo/quality-gate">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {DEMO_STORY_INSIGHTS.slice(0, 4).map((insight) => (
                <motion.div key={insight.storyId} variants={staggerItem}>
                  <StoryInsightCard
                    insight={insight as any}
                    onViewDetails={() => router.push(`/demo/quality-gate/story/${insight.storyId}`)}
                    onRescore={() => toast.success("Re-scoring", `${insight.storyKey} is being analyzed...`)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Score Distribution */}
          <div className="bg-surface-01 border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text-primary mb-4">
              Sprint Score Distribution
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-full h-2 rounded-full bg-jade/20 mb-2">
                  <div
                    className="h-full rounded-full bg-jade"
                    style={{ width: `${(distribution.excellent / DEMO_STORIES.length) * 100}%` }}
                  />
                </div>
                <div className="text-lg font-bold text-jade">{distribution.excellent}</div>
                <div className="text-xs text-text-tertiary">Excellent</div>
              </div>
              <div className="text-center">
                <div className="w-full h-2 rounded-full bg-iris/20 mb-2">
                  <div
                    className="h-full rounded-full bg-iris"
                    style={{ width: `${(distribution.good / DEMO_STORIES.length) * 100}%` }}
                  />
                </div>
                <div className="text-lg font-bold text-iris">{distribution.good}</div>
                <div className="text-xs text-text-tertiary">Good</div>
              </div>
              <div className="text-center">
                <div className="w-full h-2 rounded-full bg-amber/20 mb-2">
                  <div
                    className="h-full rounded-full bg-amber"
                    style={{ width: `${(distribution.fair / DEMO_STORIES.length) * 100}%` }}
                  />
                </div>
                <div className="text-lg font-bold text-amber">{distribution.fair}</div>
                <div className="text-xs text-text-tertiary">Fair</div>
              </div>
              <div className="text-center">
                <div className="w-full h-2 rounded-full bg-coral/20 mb-2">
                  <div
                    className="h-full rounded-full bg-coral"
                    style={{ width: `${(distribution.poor / DEMO_STORIES.length) * 100}%` }}
                  />
                </div>
                <div className="text-lg font-bold text-coral">{distribution.poor}</div>
                <div className="text-xs text-text-tertiary">Poor</div>
              </div>
            </div>
          </div>

          {/* Capacity Intelligence */}
          <div className="bg-surface-01 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-primary">
                Capacity Intelligence
              </h3>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-iris/10 text-iris">
                Health: {DEMO_CAPACITY_INTELLIGENCE.teamHealth.overallScore}
              </span>
            </div>
            <div className="space-y-3">
              {DEMO_CAPACITY_INTELLIGENCE.members.slice(0, 4).map((member: {
                userId: string;
                name: string;
                allocation: number;
                burnoutRisk: string;
              }) => (
                <div key={member.userId} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-03 flex items-center justify-center text-xs font-medium text-text-secondary">
                    {member.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-primary">{member.name}</span>
                      <span className={cn(
                        "text-xs font-mono",
                        member.allocation > 100 ? "text-coral" :
                        member.allocation > 85 ? "text-amber" : "text-jade"
                      )}>
                        {member.allocation}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-surface-03 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          member.allocation > 100 ? "bg-coral" :
                          member.allocation > 85 ? "bg-amber" : "bg-jade"
                        )}
                        style={{ width: `${Math.min(member.allocation, 100)}%` }}
                      />
                    </div>
                    {member.burnoutRisk !== "low" && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className={cn(
                          "text-xs",
                          member.burnoutRisk === "high" ? "text-coral" : "text-amber"
                        )}>
                          {member.burnoutRisk} burnout risk
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions, Risk Summary & Recent Updates */}
        <div className="space-y-6">
          {/* Active Risks Summary */}
          <div className="bg-surface-01 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Active Risks</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRiskPanelOpen(true)}
              >
                View All
              </Button>
            </div>
            <div className="space-y-2">
              {DEMO_ACTIVE_RISKS.filter(r => !r.resolvedAt).slice(0, 3).map((risk) => (
                <div
                  key={risk.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-surface-02 transition-colors",
                    risk.severity === "critical" ? "border-coral/30 bg-coral/5" :
                    risk.severity === "high" ? "border-coral/20 bg-coral/5" :
                    "border-border"
                  )}
                  onClick={() => setIsRiskPanelOpen(true)}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-1.5",
                      risk.severity === "critical" ? "bg-coral" :
                      risk.severity === "high" ? "bg-coral" :
                      risk.severity === "medium" ? "bg-amber" : "bg-jade"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary line-clamp-1">
                      {risk.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-tertiary">
                        {risk.probability}% probability
                      </span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-medium",
                        risk.predictedBy === "ml" ? "bg-iris/10 text-iris" : "bg-surface-03 text-text-secondary"
                      )}>
                        {risk.predictedBy === "ml" ? "ML" : "Rule"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link href="/demo/quality-gate">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-01 hover:bg-surface-02 hover:border-border-strong cursor-pointer transition-colors">
                  <div className="p-2 rounded-md bg-iris-dim">
                    <Zap className="w-4 h-4 text-iris" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">Score Sprint</div>
                    <div className="text-xs text-text-tertiary">Run AI analysis</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-tertiary" />
                </div>
              </Link>
              <Link href="/demo/signal/new">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-01 hover:bg-surface-02 hover:border-border-strong cursor-pointer transition-colors">
                  <div className="p-2 rounded-md bg-jade-dim">
                    <Send className="w-4 h-4 text-jade" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">Create Update</div>
                    <div className="text-xs text-text-tertiary">Draft a stakeholder update</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-tertiary" />
                </div>
              </Link>
              <Link href="/demo/horizon">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-01 hover:bg-surface-02 hover:border-border-strong cursor-pointer transition-colors">
                  <div className="p-2 rounded-md bg-sky-dim">
                    <Map className="w-4 h-4 text-sky" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">PI Planning</div>
                    <div className="text-xs text-text-tertiary">View active program increment</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-tertiary" />
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Updates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                Recent Updates
              </h2>
              <Link href="/demo/signal">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            <div className="space-y-2">
              {DEMO_UPDATES.slice(0, 3).map((update) => (
                <UpdateRow key={update.id} update={update} />
              ))}
            </div>
          </div>

          {/* Team */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Team</h2>
              <Link href="/demo/settings/team">
                <Button variant="ghost" size="sm">Manage</Button>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {DEMO_TEAM.slice(0, 4).map((member) => (
                  <div
                    key={member.id}
                    className="w-8 h-8 rounded-full bg-surface-03 border-2 border-surface-01 flex items-center justify-center"
                    title={member.name}
                  >
                    <span className="text-xs font-medium text-text-secondary">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                ))}
              </div>
              {DEMO_TEAM.length > 4 && (
                <span className="text-sm text-text-tertiary">
                  +{DEMO_TEAM.length - 4} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Review Panel */}
      <RiskReviewPanel
        isOpen={isRiskPanelOpen}
        onClose={() => setIsRiskPanelOpen(false)}
        risks={DEMO_ACTIVE_RISKS as any}
        onAcknowledge={handleAcknowledgeRisk}
        onResolve={handleResolveRisk}
        onViewDetails={(risk) => toast.info("Risk details", risk.title)}
      />
    </div>
  );
}
