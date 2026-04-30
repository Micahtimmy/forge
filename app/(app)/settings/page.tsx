"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Link2,
  Users,
  Sliders,
  CreditCard,
  Shield,
  ChevronRight,
  MessageSquare,
  Globe,
  Sparkles,
  BarChart3,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

const settingsSections = [
  {
    title: "Integrations",
    items: [
      {
        icon: Link2,
        label: "JIRA Connection",
        description: "Connect and configure your JIRA instance",
        href: "/settings/jira",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        icon: Shield,
        label: "Security",
        description: "Two-factor authentication and password",
        href: "/settings/security",
      },
    ],
  },
  {
    title: "Workspace",
    items: [
      {
        icon: Users,
        label: "Team Members",
        description: "Manage team members and roles",
        href: "/settings/team",
      },
      {
        icon: Sliders,
        label: "Quality Rubrics",
        description: "Configure story scoring rubrics",
        href: "/quality-gate/rubrics",
      },
    ],
  },
  {
    title: "Billing",
    items: [
      {
        icon: CreditCard,
        label: "Subscription",
        description: "Manage your subscription and billing",
        href: "/settings/billing",
      },
    ],
  },
];

const comingSoonFeatures = [
  {
    icon: MessageSquare,
    label: "Natural Language Query",
    description: "Chat interface for querying sprint history in plain English",
  },
  {
    icon: Globe,
    label: "Cross-Workspace Analytics",
    description: "Compare metrics across multiple JIRA workspaces",
  },
  {
    icon: Sparkles,
    label: "Slack Integration",
    description: "Auto-push Signal updates to Slack channels",
  },
  {
    icon: BarChart3,
    label: "Advanced ML Predictions",
    description: "Sprint outcome predictions from historical velocity",
  },
];

const sessionFeatures = [
  {
    icon: Clock,
    label: "Active Sessions",
    description: "View and manage your active sessions",
    comingSoon: true,
  },
];

function SettingsItem({
  icon: Icon,
  label,
  description,
  href,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <motion.div variants={staggerItem}>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg border bg-surface-01",
          "border-border hover:border-border-strong hover:bg-surface-02",
          "transition-colors group"
        )}
      >
        <div className="p-2.5 rounded-md bg-surface-03">
          <Icon className="w-5 h-5 text-text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary">{label}</div>
          <div className="text-xs text-text-secondary mt-0.5">{description}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
      </Link>
    </motion.div>
  );
}

function ComingSoonItem({
  icon: Icon,
  label,
  description,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <Tooltip content="We're building this — stay tuned" side="top">
      <motion.div
        variants={staggerItem}
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg border bg-surface-01",
          "border-border opacity-50 cursor-not-allowed select-none"
        )}
      >
        <div className="p-2.5 rounded-md bg-surface-03">
          <Icon className="w-5 h-5 text-text-tertiary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-tertiary">{label}</span>
            <Badge variant="default" size="sm" className="text-[10px]">
              Coming Soon
            </Badge>
          </div>
          <div className="text-xs text-text-tertiary mt-0.5">{description}</div>
        </div>
      </motion.div>
    </Tooltip>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your workspace, integrations, and preferences"
      />

      <div className="max-w-2xl space-y-8">
        {settingsSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-3">
              {section.title}
            </h2>
            <motion.div
              className="space-y-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {section.items.map((item) => (
                <SettingsItem key={item.href} {...item} />
              ))}
            </motion.div>
          </div>
        ))}

        {/* Session Management - Coming Soon */}
        <div>
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-3">
            Session
          </h2>
          <motion.div
            className="space-y-2"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {sessionFeatures.map((feature) => (
              <ComingSoonItem key={feature.label} {...feature} />
            ))}
          </motion.div>
        </div>

        {/* Coming Soon Features */}
        <div>
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-3">
            Coming Soon
          </h2>
          <motion.div
            className="space-y-2"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {comingSoonFeatures.map((feature) => (
              <ComingSoonItem key={feature.label} {...feature} />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
