"use client";

import { useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Grid3X3,
  BarChart3,
  GitBranch,
  AlertTriangle,
  Plus,
  Link2,
  ZoomIn,
  ZoomOut,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PICanvas } from "@/components/horizon/pi-canvas";
import { useHorizonStore } from "@/stores/horizon-store";
import { usePI, usePICanvasMutation } from "@/hooks/use-pi";
import { cn } from "@/lib/utils";
import type { PICanvasData } from "@/types/pi";

function PIDetailSkeleton() {
  return (
    <div className="h-[calc(100vh-96px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-8" />
          <div>
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-36 h-8" />
          <Skeleton className="w-28 h-8" />
        </div>
      </div>
      <Skeleton className="h-10 w-96 mb-4" />
      <Skeleton className="flex-1 w-full" />
    </div>
  );
}

export default function PIDetailPage() {
  const params = useParams();
  const router = useRouter();
  const piId = params.piId as string;

  const {
    viewMode,
    setViewMode,
    isDependencyMode,
    setIsDependencyMode,
    canvasZoom,
    setCanvasZoom,
  } = useHorizonStore();

  const { data: pi, isLoading, error } = usePI(piId);
  const canvasMutation = usePICanvasMutation(piId);

  // Debounce save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCanvasChange = useCallback(
    (data: PICanvasData) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save by 1000ms
      saveTimeoutRef.current = setTimeout(() => {
        canvasMutation.mutate(data);
      }, 1000);
    },
    [canvasMutation]
  );

  if (isLoading) {
    return <PIDetailSkeleton />;
  }

  if (error || !pi) {
    return (
      <div className="h-[calc(100vh-96px)] flex flex-col items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-coral mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Failed to load Program Increment
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {error?.message || "The requested PI could not be found"}
        </p>
        <Button variant="secondary" onClick={() => router.push("/horizon")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Horizon
        </Button>
      </div>
    );
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="h-[calc(100vh-96px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-display font-bold text-text-primary">
              {pi.name}
            </h1>
            <p className="text-sm text-text-secondary">
              {formatDate(pi.startDate)} - {formatDate(pi.endDate)} | {pi.iterationCount} iterations
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canvasMutation.isPending && (
            <span className="flex items-center text-xs text-text-tertiary mr-2">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Saving...
            </span>
          )}
          <Button
            variant={isDependencyMode ? "primary" : "secondary"}
            size="sm"
            onClick={() => setIsDependencyMode(!isDependencyMode)}
          >
            <Link2 className="w-4 h-4 mr-1" />
            {isDependencyMode ? "Exit Dependency Mode" : "Add Dependency"}
          </Button>
          <Button variant="secondary" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Feature
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as typeof viewMode)}
        className="flex-1 flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-border pb-0">
          <TabsListUnderline>
            <TabsTriggerUnderline value="canvas">
              <Grid3X3 className="w-4 h-4 mr-1.5" />
              Canvas
            </TabsTriggerUnderline>
            <TabsTriggerUnderline value="capacity">
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Capacity
            </TabsTriggerUnderline>
            <TabsTriggerUnderline value="dependencies">
              <GitBranch className="w-4 h-4 mr-1.5" />
              Dependencies
            </TabsTriggerUnderline>
            <TabsTriggerUnderline value="risks">
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              Risks
            </TabsTriggerUnderline>
          </TabsListUnderline>

          {/* Zoom Controls (for canvas view) */}
          {viewMode === "canvas" && (
            <div className="flex items-center gap-1 pb-2">
              <button
                onClick={() => setCanvasZoom(Math.max(0.3, canvasZoom - 0.1))}
                className="p-1.5 rounded hover:bg-surface-03 text-text-secondary"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-text-tertiary w-12 text-center">
                {Math.round(canvasZoom * 100)}%
              </span>
              <button
                onClick={() => setCanvasZoom(Math.min(2, canvasZoom + 0.1))}
                className="p-1.5 rounded hover:bg-surface-03 text-text-secondary"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Canvas View */}
        <TabsContent value="canvas" className="flex-1 mt-4">
          <PICanvas
            canvasData={pi.canvasData ?? { nodes: [], edges: [] }}
            onCanvasChange={handleCanvasChange}
          />
        </TabsContent>

        {/* Capacity View */}
        <TabsContent value="capacity" className="mt-4">
          <div className="bg-surface-01 border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Team Capacity Model
            </h2>
            <div className="space-y-4">
              {["Platform Team", "Mobile Team", "Data Team", "QA Team"].map(
                (team, i) => (
                  <div key={team} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">
                        {team}
                      </span>
                      <span className="text-sm font-mono text-text-secondary">
                        {35 + i * 5}/{40 + i * 5} pts
                      </span>
                    </div>
                    <div className="h-2 bg-surface-03 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          i === 2 ? "bg-amber" : "bg-jade"
                        )}
                        style={{ width: `${70 + i * 8}%` }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </TabsContent>

        {/* Dependencies View */}
        <TabsContent value="dependencies" className="mt-4">
          <div className="bg-surface-01 border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Cross-Team Dependencies
            </h2>
            <div className="space-y-2">
              {[
                { from: "Platform Team", to: "Mobile Team", status: "resolved" },
                { from: "Mobile Team", to: "Data Team", status: "at_risk" },
                { from: "Data Team", to: "QA Team", status: "open" },
              ].map((dep, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-surface-02 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-primary">{dep.from}</span>
                    <GitBranch className="w-4 h-4 text-text-tertiary" />
                    <span className="text-sm text-text-primary">{dep.to}</span>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      dep.status === "resolved" && "bg-jade-dim text-jade",
                      dep.status === "at_risk" && "bg-amber-dim text-amber",
                      dep.status === "open" && "bg-sky-dim text-sky"
                    )}
                  >
                    {dep.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Risks View */}
        <TabsContent value="risks" className="mt-4">
          <div className="bg-surface-01 border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Risk Register
            </h2>
            <div className="space-y-2">
              {[
                {
                  title: "Payment provider API changes",
                  type: "external",
                  impact: "high",
                  status: "mitigating",
                },
                {
                  title: "Mobile team capacity constraints",
                  type: "capacity",
                  impact: "medium",
                  status: "identified",
                },
                {
                  title: "Cross-team dependency on auth service",
                  type: "dependency",
                  impact: "high",
                  status: "accepted",
                },
              ].map((risk, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-surface-02 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle
                      className={cn(
                        "w-4 h-4",
                        risk.impact === "high" ? "text-coral" : "text-amber"
                      )}
                    />
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {risk.title}
                      </div>
                      <div className="text-xs text-text-tertiary">{risk.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        risk.impact === "high" && "bg-coral-dim text-coral",
                        risk.impact === "medium" && "bg-amber-dim text-amber"
                      )}
                    >
                      {risk.impact} impact
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-03 text-text-secondary">
                      {risk.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
