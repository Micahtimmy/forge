"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Send,
  Map,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  BarChart3,
  Kanban,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { AIAssistant } from "@/components/ai/ai-assistant";
import { DemoBanner } from "@/components/demo/demo-banner";
import { PageSkeleton } from "@/components/ui/skeleton";

const navItems = [
  { href: "/demo", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/demo/my-dashboard", icon: User, label: "My Dashboard" },
  { href: "/demo/quality-gate", icon: ShieldCheck, label: "Quality Gate" },
  { href: "/demo/signal", icon: Send, label: "Signal" },
  { href: "/demo/horizon", icon: Map, label: "Horizon" },
  { href: "/demo/kanban", icon: Kanban, label: "Kanban" },
  { href: "/demo/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/demo/settings", icon: Settings, label: "Settings" },
];

function DemoSidebar({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: expanded ? 220 : 56 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={cn(
        "fixed left-0 top-[40px] h-[calc(100vh-40px)] z-40",
        "bg-surface-01 border-r border-border",
        "flex flex-col"
      )}
    >
      {/* Logo */}
      <div className="h-12 flex items-center px-3 border-b border-border">
        <Link href="/demo" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-iris flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-display font-bold text-text-primary"
              >
                FORGE
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/demo" && pathname.startsWith(item.href));
          const Icon = item.icon;

          const linkContent = (
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive
                  ? "bg-iris-dim text-iris"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-02"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );

          return (
            <div key={item.href}>
              {expanded ? linkContent : (
                <Tooltip content={item.label} side="right">
                  {linkContent}
                </Tooltip>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-border">
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center justify-center p-2 rounded-md",
            "text-text-tertiary hover:text-text-secondary hover:bg-surface-02",
            "transition-colors"
          )}
        >
          {expanded ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}

function DemoTopbar({ sidebarExpanded }: { sidebarExpanded: boolean }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useAppStore();

  const getPageTitle = () => {
    if (pathname === "/demo") return "Dashboard";
    if (pathname.startsWith("/demo/my-dashboard")) return "My Dashboard";
    if (pathname.startsWith("/demo/quality-gate")) return "Quality Gate";
    if (pathname.startsWith("/demo/signal")) return "Signal";
    if (pathname.startsWith("/demo/horizon")) return "Horizon";
    if (pathname.startsWith("/demo/kanban")) return "Kanban";
    if (pathname.startsWith("/demo/analytics")) return "Analytics";
    if (pathname.startsWith("/demo/settings")) return "Settings";
    return "FORGE";
  };

  return (
    <header
      className={cn(
        "fixed top-[40px] right-0 h-12 z-30",
        "bg-canvas/80 backdrop-blur-md border-b border-border-subtle",
        "flex items-center justify-between px-4",
        "transition-all duration-200",
        sidebarExpanded ? "left-[220px]" : "left-[56px]"
      )}
    >
      {/* Left: Page Title */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-primary">{getPageTitle()}</span>
        <Badge variant="iris" size="sm">Demo</Badge>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Tooltip content="Search (Cmd+K)">
          <button
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

        {/* Theme Toggle */}
        <Tooltip content={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
          <button
            onClick={toggleTheme}
            className={cn(
              "p-2 rounded-md",
              "text-text-secondary hover:text-text-primary hover:bg-surface-03",
              "transition-colors"
            )}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </Tooltip>

        <Tooltip content="Notifications">
          <button
            className={cn(
              "relative p-2 rounded-md",
              "text-text-secondary hover:text-text-primary hover:bg-surface-03",
              "transition-colors"
            )}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full" />
          </button>
        </Tooltip>

        <Link href="/signup">
          <Button size="sm">
            Get Started
          </Button>
        </Link>
      </div>
    </header>
  );
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarExpanded(false);
      } else {
        setSidebarExpanded(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Demo Banner - fixed at very top */}
      <DemoBanner className="fixed top-0 left-0 right-0 z-50 h-[40px]" />

      {/* Main content wrapper - starts below banner */}
      <DemoSidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded(!sidebarExpanded)} />
      <DemoTopbar sidebarExpanded={sidebarExpanded} />

      <main
        className={cn(
          "pt-[92px] min-h-screen transition-all duration-200",
          sidebarExpanded ? "pl-[220px]" : "pl-[56px]"
        )}
      >
        <Suspense fallback={<PageSkeleton />}>
          <div className="p-6">{children}</div>
        </Suspense>
      </main>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}
