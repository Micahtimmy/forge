"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Send,
  Map,
  AlertTriangle,
  Clock,
  ArrowRight,
  Zap,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { ScoreRing } from "@/components/ui/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

// Mock data for demo
const DEMO_DATA = {
  sprintHealth: 72,
  storiesAtRisk: 4,
  recentUpdatesCount: 3,
  activePIsCount: 2,
  recentStories: [
    { id: "1", jiraKey: "FORGE-123", title: "Implement user authentication flow", status: "In Progress", score: 85 },
    { id: "2", jiraKey: "FORGE-124", title: "Add payment integration with Paystack", status: "To Do", score: 45 },
    { id: "3", jiraKey: "FORGE-125", title: "Create dashboard analytics view", status: "In Review", score: 68 },
    { id: "4", jiraKey: "FORGE-126", title: "Setup CI/CD pipeline", status: "To Do", score: 32 },
  ],
  upcomingDeadlines: [
    { label: "Sprint 12 ends", date: "Apr 25" },
    { label: "PI Planning", date: "May 1" },
  ],
};

function StatCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem}>
      <div
        className={cn(
          "block p-4 rounded-lg border border-border bg-surface-01",
          "hover:bg-surface-02 hover:border-border-strong transition-all",
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-md bg-surface-03">{icon}</div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-text-primary">
            {value}
          </div>
          <div className="text-sm text-text-secondary mt-0.5">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickAction({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <motion.div variants={staggerItem}>
      <div
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg border border-border bg-surface-01",
          "hover:bg-surface-02 hover:border-border-strong transition-all group cursor-pointer"
        )}
      >
        <div className="p-2.5 rounded-md bg-iris-dim text-iris">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary">{label}</div>
          <div className="text-xs text-text-secondary mt-0.5">{description}</div>
        </div>
        <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-iris group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  );
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Demo Banner */}
      <div className="bg-iris text-white py-2 px-4 text-center text-sm">
        <Sparkles className="w-4 h-4 inline mr-2" />
        Demo Mode - This is sample data. <Link href="/signup" className="underline font-medium">Sign up</Link> to use FORGE with your own JIRA workspace.
      </div>

      {/* Simplified header */}
      <header className="border-b border-border bg-surface-01 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-iris flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-display font-bold text-lg text-text-primary">FORGE</span>
            <Badge variant="default">Demo</Badge>
          </div>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Welcome to FORGE
          </h1>
          <p className="text-text-secondary mt-1">
            AI-powered program intelligence for agile teams. Here&apos;s a preview of your dashboard.
          </p>
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
            label="Sprint Health"
            value={
              <div className="flex items-center gap-2">
                <ScoreRing score={DEMO_DATA.sprintHealth} size="sm" showLabel={false} />
                <span>{DEMO_DATA.sprintHealth}</span>
              </div>
            }
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-amber" />}
            label="Stories at Risk"
            value={DEMO_DATA.storiesAtRisk}
          />
          <StatCard
            icon={<Send className="w-5 h-5 text-jade" />}
            label="Updates This Week"
            value={DEMO_DATA.recentUpdatesCount}
          />
          <StatCard
            icon={<Map className="w-5 h-5 text-sky" />}
            label="Active PIs"
            value={DEMO_DATA.activePIsCount}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stories needing attention */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                Stories Needing Attention
              </h2>
            </div>

            <motion.div
              className="space-y-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {DEMO_DATA.recentStories.map((story) => (
                <motion.div
                  key={story.id}
                  variants={staggerItem}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border bg-surface-01",
                    story.score >= 70
                      ? "border-border"
                      : story.score >= 50
                      ? "border-l-2 border-l-amber border-border"
                      : "border-l-2 border-l-coral border-border"
                  )}
                >
                  <ScoreRing score={story.score} size="sm" />
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
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Column - Quick Actions & Deadlines */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Quick Actions
              </h2>
              <motion.div
                className="space-y-2"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <QuickAction
                  icon={<Zap className="w-5 h-5" />}
                  label="Score Sprint Backlog"
                  description="Run AI analysis on current sprint"
                />
                <QuickAction
                  icon={<Send className="w-5 h-5" />}
                  label="Create Update"
                  description="Draft a stakeholder update"
                />
                <QuickAction
                  icon={<Map className="w-5 h-5" />}
                  label="Plan Next PI"
                  description="Start PI planning session"
                />
              </motion.div>
            </div>

            {/* Upcoming Deadlines */}
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Upcoming
              </h2>
              <div className="space-y-2">
                {DEMO_DATA.upcomingDeadlines.map((deadline, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-surface-01 border border-border"
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
            </div>

            {/* CTA */}
            <div className="p-4 rounded-lg bg-iris-dim border border-iris/20">
              <h3 className="font-medium text-text-primary mb-2">Ready to get started?</h3>
              <p className="text-sm text-text-secondary mb-4">
                Connect your JIRA workspace and let AI analyze your stories.
              </p>
              <Link href="/signup">
                <Button className="w-full">
                  Sign Up Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
