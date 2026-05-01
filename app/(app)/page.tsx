"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Send,
  Map,
  AlertTriangle,
  Clock,
  ArrowRight,
  Zap,
  Inbox,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  FileText,
  Settings,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ScoreRing } from "@/components/ui/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { useToastActions } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { useDashboard } from "@/hooks/use-dashboard";
import { useJiraStatus } from "@/hooks/use-jira";
import { useAppStore } from "@/stores/app-store";
import { JiraConnectionPrompt } from "@/components/shared/jira-connection-prompt";
import {
  PERSONA_CONFIGS,
  getPersonaInsights,
  HELP_CONTENT,
  type PersonaRole,
} from "@/lib/demo/persona-data";

function StatCard({
  icon,
  label,
  value,
  trend,
  href,
  className,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  trend?: { value: string; positive: boolean };
  href: string;
  className?: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="p-4 rounded-lg border border-border bg-surface-01">
        <div className="flex items-start justify-between">
          <Skeleton className="w-9 h-9 rounded-md" />
        </div>
        <div className="mt-3">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-24 mt-2" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={staggerItem}>
      <Link
        href={href}
        className={cn(
          "block p-4 rounded-lg border border-border bg-surface-01",
          "hover:bg-surface-02 hover:border-border-strong transition-all",
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-md bg-surface-03">{icon}</div>
          {trend && (
            <Badge variant={trend.positive ? "excellent" : "poor"}>
              {trend.value}
            </Badge>
          )}
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-text-primary">
            {value}
          </div>
          <div className="text-sm text-text-secondary mt-0.5">{label}</div>
        </div>
      </Link>
    </motion.div>
  );
}

function QuickAction({
  icon,
  label,
  description,
  href,
  color = "iris",
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  color?: "iris" | "jade" | "amber" | "coral" | "sky";
}) {
  const colorClasses = {
    iris: "bg-iris-dim text-iris",
    jade: "bg-jade-dim text-jade",
    amber: "bg-amber-dim text-amber",
    coral: "bg-coral-dim text-coral",
    sky: "bg-sky-dim text-sky",
  };

  return (
    <motion.div variants={staggerItem}>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg border border-border bg-surface-01",
          "hover:bg-surface-02 hover:border-border-strong transition-all group"
        )}
      >
        <div className={cn("p-2.5 rounded-md", colorClasses[color])}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary">{label}</div>
          <div className="text-xs text-text-secondary mt-0.5">{description}</div>
        </div>
        <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-iris group-hover:translate-x-1 transition-all" />
      </Link>
    </motion.div>
  );
}

// Persona Context Banner
function PersonaContextBanner({ role }: { role: PersonaRole }) {
  const config = PERSONA_CONFIGS[role];
  const primaryModule = config.primaryModules[0];

  return (
    <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-iris/10 to-transparent border border-iris/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-iris/20">
            <Briefcase className="w-5 h-5 text-iris" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-text-primary">{config.label} Dashboard</h3>
              <HelpTooltip
                content={
                  <div>
                    <p className="font-medium mb-1">{config.label}</p>
                    <p className="text-slate-300">{config.description}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Primary focus: {config.primaryModules.map(m => m.replace("-", " ")).join(", ")}
                    </p>
                  </div>
                }
              />
            </div>
            <p className="text-sm text-text-tertiary">
              Personalized view with {config.dataFocus.stories.length > 0 ? "story insights" : "program metrics"}, {config.primaryModules.includes("signal") ? "communication tools" : "planning features"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {config.primaryModules.slice(0, 2).map((module) => (
            <Badge key={module} variant="default" className="bg-iris/20 text-iris">
              {module.replace("-", " ")}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// AI Insights Panel
function AIInsightsPanel({ role }: { role: PersonaRole }) {
  const insights = getPersonaInsights(role);
  const topInsights = insights.slice(0, 4);

  return (
    <CollapsibleSection
      title="AI Insights"
      helpContent="AI-generated insights based on your role and current sprint data. These update as your data changes."
      defaultOpen={true}
      storageKey="dashboard-ai-insights"
      badge={
        <Badge variant="default" size="sm" className="bg-iris/20 text-iris">
          <Sparkles className="w-3 h-3 mr-1" />
          {topInsights.length}
        </Badge>
      }
    >
      <div className="space-y-2">
        {topInsights.map((insight, index) => (
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

// Get role-specific quick actions
function getRoleQuickActions(role: PersonaRole) {
  const baseActions = {
    developer: [
      { icon: <ShieldCheck className="w-5 h-5" />, label: "My Stories", description: "View your assigned stories and scores", href: "/quality-gate", color: "iris" as const },
      { icon: <BarChart3 className="w-5 h-5" />, label: "My Metrics", description: "View your contribution metrics", href: "/my-dashboard", color: "jade" as const },
    ],
    scrum_master: [
      { icon: <Zap className="w-5 h-5" />, label: "Score Sprint", description: "Run AI analysis on backlog", href: "/quality-gate", color: "iris" as const },
      { icon: <Send className="w-5 h-5" />, label: "Create Update", description: "Draft stakeholder update", href: "/signal/new", color: "jade" as const },
      { icon: <Users className="w-5 h-5" />, label: "Team Health", description: "Check team capacity", href: "/analytics", color: "amber" as const },
    ],
    product_manager: [
      { icon: <ShieldCheck className="w-5 h-5" />, label: "Backlog Quality", description: "Review story readiness", href: "/quality-gate", color: "iris" as const },
      { icon: <Map className="w-5 h-5" />, label: "Roadmap", description: "Plan upcoming features", href: "/horizon", color: "sky" as const },
      { icon: <Send className="w-5 h-5" />, label: "Client Update", description: "Draft release notes", href: "/signal/new", color: "jade" as const },
    ],
    engineering_manager: [
      { icon: <BarChart3 className="w-5 h-5" />, label: "Team Analytics", description: "View team performance", href: "/analytics", color: "jade" as const },
      { icon: <ShieldCheck className="w-5 h-5" />, label: "Quality Overview", description: "Sprint health across teams", href: "/quality-gate", color: "iris" as const },
      { icon: <Users className="w-5 h-5" />, label: "Capacity Planning", description: "Manage team capacity", href: "/horizon", color: "amber" as const },
    ],
    rte: [
      { icon: <Map className="w-5 h-5" />, label: "PI Planning", description: "Manage program increments", href: "/horizon", color: "sky" as const },
      { icon: <Target className="w-5 h-5" />, label: "Dependencies", description: "Track cross-team dependencies", href: "/horizon", color: "coral" as const },
      { icon: <Send className="w-5 h-5" />, label: "Program Update", description: "Draft executive update", href: "/signal/new", color: "jade" as const },
    ],
    program_manager: [
      { icon: <BarChart3 className="w-5 h-5" />, label: "Program Metrics", description: "Cross-team analytics", href: "/analytics", color: "jade" as const },
      { icon: <Map className="w-5 h-5" />, label: "Portfolio View", description: "Manage program increments", href: "/horizon", color: "sky" as const },
      { icon: <Send className="w-5 h-5" />, label: "Board Update", description: "Draft board-level update", href: "/signal/new", color: "amber" as const },
    ],
    executive: [
      { icon: <TrendingUp className="w-5 h-5" />, label: "Executive Summary", description: "High-level program health", href: "/analytics", color: "jade" as const },
      { icon: <FileText className="w-5 h-5" />, label: "Reports", description: "View sent updates", href: "/signal", color: "iris" as const },
      { icon: <Map className="w-5 h-5" />, label: "Strategic View", description: "Program roadmap", href: "/horizon", color: "sky" as const },
    ],
  };

  return baseActions[role] || baseActions.scrum_master;
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-16 h-16 rounded-full bg-surface-02 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-2">
        No data yet
      </h3>
      <p className="text-sm text-text-secondary text-center max-w-md mb-6">
        Connect your JIRA workspace to start seeing sprint health, story scores,
        and AI-powered insights.
      </p>
      <Link href="/settings/jira">
        <Button>
          Connect JIRA
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </motion.div>
  );
}

function StoryListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-lg border border-border bg-surface-01"
        >
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToastActions();
  const { userRole } = useAppStore();
  const { data, isLoading, error, refetch, isRefetching } = useDashboard();
  const { data: jiraStatus } = useJiraStatus();
  const isJiraConnected = jiraStatus?.connected ?? false;

  const hasData = data && (data.recentStories.length > 0 || data.sprintHealth > 0);
  const config = PERSONA_CONFIGS[userRole];
  const quickActions = getRoleQuickActions(userRole);

  // Handle OAuth errors in URL (e.g., flow_state_already_used)
  useEffect(() => {
    const errorCode = searchParams.get("error_code");
    const errorParam = searchParams.get("error");

    if (errorCode || errorParam) {
      // Show a friendly message for common OAuth errors
      if (errorCode === "flow_state_already_used") {
        toast.info("Already signed in", "You're already logged in. Welcome back!");
      } else if (errorParam) {
        toast.warning("Auth notice", "There was an issue with authentication, but you're signed in.");
      }

      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("error_code");
      url.searchParams.delete("error_description");
      router.replace(url.pathname, { scroll: false });
    }
  }, [searchParams, router, toast]);

  return (
    <div>
      <PageHeader
        title="Welcome back"
        description={
          <span className="flex items-center gap-2">
            Here's what's happening with your program today.
            <HelpTooltip
              content={
                <div className="max-w-xs">
                  <p className="font-medium mb-1">Dashboard Overview</p>
                  <p className="text-slate-300 text-xs">
                    Your personalized command center shows metrics, insights, and quick actions
                    tailored to your role as {config.label.toLowerCase()}.
                  </p>
                </div>
              }
            />
          </span>
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefetching && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {!isJiraConnected && <JiraConnectionPrompt variant="banner" />}

      {/* Persona Context Banner */}
      <PersonaContextBanner role={userRole} />

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-coral-dim border border-coral-border text-coral text-sm">
          Failed to load dashboard data. Please try again.
        </div>
      )}

      {/* Stats Grid - Role-aware metrics */}
      <CollapsibleSection
        title="Key Metrics"
        helpContent={`Your most important metrics as ${config.label.toLowerCase()}. These update in real-time with your JIRA data.`}
        defaultOpen={true}
        storageKey="dashboard-metrics"
        className="mb-6"
      >
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <StatCard
            icon={<ShieldCheck className="w-5 h-5 text-iris" />}
            label="Sprint Health"
            isLoading={isLoading}
            value={
              <div className="flex items-center gap-2">
                <ScoreRing score={data?.sprintHealth || 0} size="sm" showLabel={false} />
                <span>{data?.sprintHealth || 0}</span>
              </div>
            }
            href="/quality-gate"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-amber" />}
            label="Stories at Risk"
            value={data?.storiesAtRisk || 0}
            isLoading={isLoading}
            href="/quality-gate"
          />
          <StatCard
            icon={<Send className="w-5 h-5 text-jade" />}
            label="Updates This Week"
            value={data?.recentUpdatesCount || 0}
            isLoading={isLoading}
            href="/signal"
          />
          <StatCard
            icon={<Map className="w-5 h-5 text-sky" />}
            label="Active PIs"
            value={data?.activePIsCount || 0}
            isLoading={isLoading}
            href="/horizon"
          />
        </motion.div>
      </CollapsibleSection>

      {!isLoading && !hasData ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - AI Insights */}
          <div className="lg:col-span-1 space-y-4">
            <AIInsightsPanel role={userRole} />

            {/* Upcoming Deadlines */}
            <CollapsibleSection
              title="Upcoming"
              helpContent="Important deadlines and milestones that require your attention."
              defaultOpen={true}
              storageKey="dashboard-upcoming"
            >
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : data?.upcomingDeadlines && data.upcomingDeadlines.length > 0 ? (
                <div className="space-y-2">
                  {data.upcomingDeadlines.map((deadline, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-surface-02 border border-border"
                    >
                      <Clock className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm text-text-primary flex-1">
                        {deadline.label}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {deadline.date}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-text-secondary text-sm">
                  No upcoming deadlines
                </div>
              )}
            </CollapsibleSection>
          </div>

          {/* Main Content - Stories needing attention */}
          <div className="lg:col-span-2 space-y-4">
            <CollapsibleSection
              title="Stories Needing Attention"
              helpContent="Stories with low quality scores or missing criteria that need improvement before the sprint."
              defaultOpen={true}
              storageKey="dashboard-stories"
              badge={
                data?.recentStories && data.recentStories.length > 0 ? (
                  <Badge variant="default" size="sm">
                    {data.recentStories.length}
                  </Badge>
                ) : null
              }
              headerAction={
                <Link
                  href="/quality-gate"
                  className="text-sm text-iris hover:text-iris-light"
                >
                  View all
                </Link>
              }
            >
              {isLoading ? (
                <StoryListSkeleton />
              ) : data?.recentStories && data.recentStories.length > 0 ? (
                <motion.div
                  className="space-y-2"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {data.recentStories.map((story) => (
                    <motion.div
                      key={story.id}
                      variants={staggerItem}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border bg-surface-01",
                        story.score === null
                          ? "border-border"
                          : story.score >= 70
                          ? "border-border"
                          : story.score >= 50
                          ? "border-l-2 border-l-amber border-border"
                          : "border-l-2 border-l-coral border-border"
                      )}
                    >
                      <ScoreRing score={story.score || 0} size="sm" />
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
                      <Link href={`/quality-gate/story/${story.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-8 text-text-secondary text-sm">
                  No stories to display. Sync with JIRA to see your backlog.
                </div>
              )}
            </CollapsibleSection>
          </div>

          {/* Right Sidebar - Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            <CollapsibleSection
              title={`${config.label} Actions`}
              helpContent={`Quick actions tailored for your role as ${config.label.toLowerCase()}. These shortcuts help you complete common tasks faster.`}
              defaultOpen={true}
              storageKey="dashboard-quick-actions"
            >
              <motion.div
                className="space-y-2"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {quickActions.map((action, index) => (
                  <QuickAction
                    key={index}
                    icon={action.icon}
                    label={action.label}
                    description={action.description}
                    href={action.href}
                    color={action.color}
                  />
                ))}
              </motion.div>
            </CollapsibleSection>

            {/* Role-specific tip */}
            <div className="p-4 rounded-lg bg-surface-01 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-text-tertiary" />
                <span className="text-xs font-medium text-text-secondary">Role Tip</span>
              </div>
              <p className="text-xs text-text-tertiary">
                {HELP_CONTENT.roles[userRole]}
              </p>
              <Link href="/profile" className="text-xs text-iris hover:text-iris-light mt-2 inline-block">
                Change role in settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
