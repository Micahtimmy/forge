"use client";

import { Suspense, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { RouteProgress } from "@/components/layout/route-progress";
import { CommandPalette } from "@/components/command-palette";
import { AIAssistant } from "@/components/ai/ai-assistant";
import { PageErrorBoundary, LayoutErrorBoundary, FeatureErrorBoundary } from "@/components/ui/error-boundary";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarExpanded, setCommandPaletteOpen } = useAppStore();

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setCommandPaletteOpen]);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Route loading indicator */}
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>

      <LayoutErrorBoundary name="Sidebar">
        <Sidebar />
      </LayoutErrorBoundary>
      <LayoutErrorBoundary name="Topbar">
        <Topbar />
      </LayoutErrorBoundary>

      {/* Main content area */}
      <main
        className={cn(
          "pt-12 min-h-screen transition-all duration-200",
          sidebarExpanded ? "pl-[220px]" : "pl-[56px]"
        )}
      >
        <div className="p-6">
          <PageErrorBoundary>{children}</PageErrorBoundary>
        </div>
      </main>

      {/* Command Palette */}
      <FeatureErrorBoundary featureName="Command Palette">
        <CommandPalette />
      </FeatureErrorBoundary>

      {/* AI Assistant */}
      <FeatureErrorBoundary featureName="AI Assistant">
        <AIAssistant />
      </FeatureErrorBoundary>
    </div>
  );
}
