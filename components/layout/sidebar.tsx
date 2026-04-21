"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShieldCheck,
  Send,
  Map,
  Settings2,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Building2,
  ChevronDown,
  User,
  BarChart3,
  Kanban,
  Gavel,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { sidebarVariants } from "@/lib/motion/variants";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
      },
      {
        label: "My Work",
        href: "/my-dashboard",
        icon: <User className="w-[18px] h-[18px]" />,
      },
    ],
  },
  {
    label: "Modules",
    items: [
      {
        label: "Quality Gate",
        href: "/quality-gate",
        icon: <ShieldCheck className="w-[18px] h-[18px]" />,
      },
      {
        label: "Story Writer",
        href: "/quality-gate/writer",
        icon: <Wand2 className="w-[18px] h-[18px]" />,
      },
      {
        label: "Signal",
        href: "/signal",
        icon: <Send className="w-[18px] h-[18px]" />,
      },
      {
        label: "Decisions",
        href: "/signal/decisions",
        icon: <Gavel className="w-[18px] h-[18px]" />,
      },
      {
        label: "Horizon",
        href: "/horizon",
        icon: <Map className="w-[18px] h-[18px]" />,
      },
      {
        label: "Kanban",
        href: "/kanban",
        icon: <Kanban className="w-[18px] h-[18px]" />,
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Analytics",
        href: "/analytics",
        icon: <BarChart3 className="w-[18px] h-[18px]" />,
      },
    ],
  },
  {
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: <Settings2 className="w-[18px] h-[18px]" />,
      },
    ],
  },
];

function NavLink({
  item,
  expanded,
  isActive,
}: {
  item: NavItem;
  expanded: boolean;
  isActive: boolean;
}) {
  const content = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center h-9 rounded-md px-2.5 gap-2.5 transition-colors",
        "text-text-secondary hover:text-text-primary hover:bg-surface-03",
        isActive && "bg-iris-dim text-text-primary"
      )}
    >
      <span
        className={cn(
          "flex-shrink-0",
          isActive ? "text-iris-light" : "text-text-secondary"
        )}
      >
        {item.icon}
      </span>
      <AnimatePresence>
        {expanded && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="text-[13px] font-medium whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {item.badge && expanded && (
        <span className="ml-auto text-xs bg-surface-03 text-text-secondary px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );

  if (!expanded) {
    return (
      <Tooltip content={item.label} side="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarExpanded, sidebarPinned, toggleSidebar, toggleSidebarPin } =
    useAppStore();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <motion.aside
      className={cn(
        "fixed left-0 top-0 h-full z-40",
        "bg-canvas border-r border-border-subtle",
        "flex flex-col"
      )}
      variants={sidebarVariants}
      initial={false}
      animate={sidebarExpanded ? "expanded" : "collapsed"}
    >
      {/* Header */}
      <div className="flex items-center h-12 px-3 border-b border-border-subtle">
        <AnimatePresence mode="wait">
          {sidebarExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between w-full"
            >
              <span className="font-display font-bold text-lg text-iris">
                FORGE
              </span>
              <button
                onClick={toggleSidebarPin}
                className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-03 transition-colors"
                title={sidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
              >
                {sidebarPinned ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeft className="w-4 h-4" />
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center w-full"
            >
              <span className="font-display font-bold text-lg text-iris">F</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navigation.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-2">
            {group.label && sidebarExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-text-tertiary"
              >
                {group.label}
              </motion.div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  expanded={sidebarExpanded}
                  isActive={isActive(item.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border-subtle p-2">
        {/* Workspace Switcher */}
        <button
          className={cn(
            "w-full flex items-center gap-2.5 p-2 rounded-md",
            "hover:bg-surface-03 transition-colors text-left"
          )}
        >
          <div className="w-7 h-7 rounded bg-iris-dim flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-iris" />
          </div>
          <AnimatePresence>
            {sidebarExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-text-primary truncate">
                    Workspace
                  </span>
                  <ChevronDown className="w-3 h-3 text-text-tertiary flex-shrink-0" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* User */}
        <div
          className={cn(
            "flex items-center gap-2.5 p-2 rounded-md mt-1",
            "hover:bg-surface-03 transition-colors cursor-pointer"
          )}
        >
          <Avatar size="sm" alt="User" status="online" />
          <AnimatePresence>
            {sidebarExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <span className="text-sm font-medium text-text-primary truncate block">
                  User
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expand/Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute -right-3 top-1/2 -translate-y-1/2",
          "w-6 h-6 rounded-full bg-surface-02 border border-border",
          "flex items-center justify-center",
          "text-text-tertiary hover:text-text-primary hover:border-border-strong",
          "transition-colors shadow-sm"
        )}
      >
        {sidebarExpanded ? (
          <ChevronLeft className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>
    </motion.aside>
  );
}
