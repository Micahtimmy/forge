"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Bell,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

// Map paths to breadcrumb labels
const pathLabels: Record<string, string> = {
  "/": "Dashboard",
  "/quality-gate": "Quality Gate",
  "/quality-gate/rubrics": "Rubrics",
  "/quality-gate/trends": "Trends",
  "/signal": "Signal",
  "/signal/new": "New Update",
  "/horizon": "Horizon",
  "/settings": "Settings",
  "/settings/jira": "JIRA",
  "/settings/team": "Team",
};

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items
  const items: Array<{ label: string; href: string }> = [];
  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = pathLabels[currentPath] || segment;
    items.push({ label, href: currentPath });
  });

  // If no segments, we're on home
  if (items.length === 0) {
    items.push({ label: "Dashboard", href: "/" });
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          )}
          <span
            className={cn(
              index === items.length - 1
                ? "text-text-primary font-medium"
                : "text-text-secondary"
            )}
          >
            {item.label}
          </span>
        </div>
      ))}
    </nav>
  );
}

function SyncIndicator() {
  const { jiraSyncStatus, lastSyncedAt } = useAppStore();

  const getStatusContent = () => {
    switch (jiraSyncStatus) {
      case "syncing":
        return (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-3.5 h-3.5 text-iris" />
            </motion.div>
            <span className="text-xs text-text-secondary">Syncing...</span>
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-coral" />
            <span className="text-xs text-coral">Sync failed</span>
          </>
        );
      default:
        return (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-jade" />
            <span className="text-xs text-text-secondary">
              {lastSyncedAt
                ? `Synced ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}`
                : "Synced"}
            </span>
          </>
        );
    }
  };

  return (
    <Tooltip
      content={
        jiraSyncStatus === "error"
          ? "Click to retry sync"
          : `Last synced: ${lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Never"}`
      }
    >
      <button
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md",
          "hover:bg-surface-03 transition-colors"
        )}
      >
        {getStatusContent()}
      </button>
    </Tooltip>
  );
}

export function Topbar() {
  const { sidebarExpanded, setCommandPaletteOpen } = useAppStore();

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-12 z-30",
        "bg-canvas/80 backdrop-blur-md border-b border-border-subtle",
        "flex items-center justify-between px-4",
        "transition-all duration-200",
        sidebarExpanded ? "left-[220px]" : "left-[56px]"
      )}
    >
      {/* Left: Breadcrumbs */}
      <Breadcrumbs />

      {/* Center: Sync indicator (when syncing) */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <SyncIndicator />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <Tooltip content="Search (⌘K)">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md",
              "bg-surface-02 border border-border",
              "text-text-tertiary hover:text-text-secondary hover:border-border-strong",
              "transition-colors text-sm"
            )}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline text-xs bg-surface-03 px-1.5 py-0.5 rounded font-mono">
              ⌘K
            </kbd>
          </button>
        </Tooltip>

        {/* Notifications */}
        <Tooltip content="Notifications">
          <button
            className={cn(
              "relative p-2 rounded-md",
              "text-text-secondary hover:text-text-primary hover:bg-surface-03",
              "transition-colors"
            )}
          >
            <Bell className="w-5 h-5" />
            {/* Notification dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full" />
          </button>
        </Tooltip>

        {/* User Menu */}
        <button className="p-1 rounded-md hover:bg-surface-03 transition-colors">
          <Avatar size="sm" alt="User" />
        </button>
      </div>
    </header>
  );
}
