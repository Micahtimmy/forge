"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Link2,
  Users,
  Sliders,
  Bell,
  CreditCard,
  Shield,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
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
    title: "Preferences",
    items: [
      {
        icon: Bell,
        label: "Notifications",
        description: "Email and Slack notification settings",
        href: "/settings/notifications",
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
      </div>
    </div>
  );
}
