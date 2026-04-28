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
import { usePI, usePICanvasMutation, usePITeams, usePIFeatures, usePIDependencies, usePIRisks } from "@/hooks/use-pi";
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
  const { data: teamsData, isLoading: teamsLoading } = usePITeams(piId);
  const { data: featuresData } = usePIFeatures(piId);
  const { data: dependenciesData, isLoading: depsLoading } = usePIDependencies(piId);
  const { data: risksData, isLoading: risksLoading } = usePIRisks(piId);

  const teams = teamsData?.teams || [];
  const features = featuresData?.features || [];
  const dependencies = dependenciesData?.dependencies || [];
  const risks = risksData?.risks || [];

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
            {teamsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary mb-2">No teams configured</p>
                <p className="text-sm text-text-tertiary">
                  Add teams to track capacity for this PI
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {teams.map((team) => {
                  const teamFeatures = features.filter((f) => f.teamId === team.id);
                  const committedPoints = teamFeatures.reduce((sum, f) => sum + (f.points || 0), 0);
                  const utilizationPct = team.totalCapacity > 0
                    ? Math.min(100, (committedPoints / team.totalCapacity) * 100)
                    : 0;
                  const isOverCapacity = committedPoints > team.totalCapacity;

                  return (
                    <div key={team.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-primary">
                          {team.name}
                        </span>
                        <span className="text-sm font-mono text-text-secondary">
                          {committedPoints}/{team.totalCapacity} pts
                        </span>
                      </div>
                      <div className="h-2 bg-surface-03 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isOverCapacity ? "bg-coral" : utilizationPct > 85 ? "bg-amber" : "bg-jade"
                          )}
                          style={{ width: `${Math.min(100, utilizationPct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Dependencies View */}
        <TabsContent value="dependencies" className="mt-4">
          <div className="bg-surface-01 border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Cross-Team Dependencies
            </h2>
            {depsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-02 rounded-md">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : dependencies.length === 0 ? (
              <div className="text-center py-8">
                <GitBranch className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary mb-2">No dependencies tracked</p>
                <p className="text-sm text-text-tertiary">
                  Use Dependency Mode on the canvas to link features
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {dependencies.map((dep) => {
                  const sourceFeature = features.find((f) => f.id === dep.sourceFeatureId);
                  const targetFeature = features.find((f) => f.id === dep.targetFeatureId);

                  return (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between p-3 bg-surface-02 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-text-primary">
                          {sourceFeature?.title || "Unknown Feature"}
                        </span>
                        <GitBranch className="w-4 h-4 text-text-tertiary" />
                        <span className="text-sm text-text-primary">
                          {targetFeature?.title || "Unknown Feature"}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          dep.status === "resolved" && "bg-jade-dim text-jade",
                          dep.status === "at_risk" && "bg-amber-dim text-amber",
                          dep.status === "blocked" && "bg-coral-dim text-coral",
                          dep.status === "open" && "bg-sky-dim text-sky"
                        )}
                      >
                        {dep.status.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Risks View */}
        <TabsContent value="risks" className="mt-4">
          <div className="bg-surface-01 border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Risk Register
            </h2>
            {risksLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-02 rounded-md">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4" />
                      <div>
                        <Skeleton className="h-4 w-48 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : risks.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary mb-2">No risks identified</p>
                <p className="text-sm text-text-tertiary">
                  Use AI risk analysis to identify potential issues
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {risks.map((risk) => (
                  <div
                    key={risk.id}
                    className="flex items-center justify-between p-3 bg-surface-02 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        className={cn(
                          "w-4 h-4",
                          risk.impact === "high" ? "text-coral" : risk.impact === "medium" ? "text-amber" : "text-text-tertiary"
                        )}
                      />
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {risk.title}
                        </div>
                        {risk.description && (
                          <div className="text-xs text-text-tertiary line-clamp-1">
                            {risk.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          risk.impact === "high" && "bg-coral-dim text-coral",
                          risk.impact === "medium" && "bg-amber-dim text-amber",
                          risk.impact === "low" && "bg-surface-03 text-text-secondary"
                        )}
                      >
                        {risk.impact} impact
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          risk.status === "resolved" && "bg-jade-dim text-jade",
                          risk.status === "mitigating" && "bg-iris-dim text-iris",
                          risk.status === "accepted" && "bg-amber-dim text-amber",
                          risk.status === "identified" && "bg-surface-03 text-text-secondary"
                        )}
                      >
                        {risk.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
