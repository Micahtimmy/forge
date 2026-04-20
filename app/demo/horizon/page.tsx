"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Users,
  GitBranch,
  AlertTriangle,
  ChevronRight,
  MoreHorizontal,
  Play,
  CheckCircle2,
  Clock,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { useToastActions } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { format } from "date-fns";
import { DEMO_PIS } from "@/lib/demo/mock-data";

function PICard({ pi }: { pi: (typeof DEMO_PIS)[0] }) {
  const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
    planning: { icon: Clock, color: "text-amber", bg: "bg-amber-dim" },
    active: { icon: Play, color: "text-jade", bg: "bg-jade-dim" },
    completed: { icon: CheckCircle2, color: "text-text-secondary", bg: "bg-surface-03" },
  };

  const config = statusConfig[pi.status] || statusConfig.active;
  const StatusIcon = config.icon;

  const totalObjectives = pi.objectives.length;
  const committedObjectives = pi.objectives.filter((o) => o.committed).length;
  const avgConfidence = Math.round(
    pi.objectives.reduce((acc, o) => acc + o.confidence, 0) / totalObjectives
  );

  return (
    <Link href={`/demo/horizon/${pi.id}`}>
      <motion.div
        variants={staggerItem}
        className={cn(
          "bg-surface-01 border border-border rounded-lg p-5",
          "hover:border-border-strong hover:bg-surface-02 cursor-pointer",
          "transition-colors"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-text-primary">{pi.name}</h3>
              <Badge
                variant={
                  pi.status === "active"
                    ? "excellent"
                    : (pi.status as string) === "planning"
                    ? "fair"
                    : "default"
                }
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {pi.status}
              </Badge>
            </div>
            <div className="text-sm text-text-secondary">
              {format(new Date(pi.startDate), "MMM d")} -{" "}
              {format(new Date(pi.endDate), "MMM d, yyyy")}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded hover:bg-surface-03 text-text-tertiary hover:text-text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit PI</DropdownMenuItem>
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-coral">Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-surface-03">
              <Users className="w-4 h-4 text-text-tertiary" />
            </div>
            <div>
              <div className="text-sm font-medium text-text-primary">{pi.teams.length}</div>
              <div className="text-xs text-text-tertiary">Teams</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-surface-03">
              <GitBranch className="w-4 h-4 text-text-tertiary" />
            </div>
            <div>
              <div className="text-sm font-medium text-text-primary">
                {pi.dependencies.length}
              </div>
              <div className="text-xs text-text-tertiary">Dependencies</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-surface-03">
              <AlertTriangle className="w-4 h-4 text-text-tertiary" />
            </div>
            <div>
              <div
                className={cn(
                  "text-sm font-medium",
                  pi.risks.length > 0 ? "text-amber" : "text-text-primary"
                )}
              >
                {pi.risks.length}
              </div>
              <div className="text-xs text-text-tertiary">Risks</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-surface-03">
              <Target className="w-4 h-4 text-text-tertiary" />
            </div>
            <div>
              <div className="text-sm font-medium text-text-primary">
                {committedObjectives}/{totalObjectives}
              </div>
              <div className="text-xs text-text-tertiary">Objectives</div>
            </div>
          </div>
        </div>

        {/* Objectives Preview */}
        {pi.objectives.length > 0 && pi.status !== "completed" && (
          <div className="mb-4 pt-4 border-t border-border">
            <div className="text-xs text-text-tertiary mb-2">PI Objectives (Avg. Confidence: {avgConfidence}%)</div>
            <div className="space-y-1">
              {pi.objectives.slice(0, 2).map((obj) => (
                <div key={obj.id} className="flex items-center gap-2 text-sm">
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      obj.committed ? "bg-jade" : "bg-amber"
                    )}
                  />
                  <span className="text-text-secondary truncate">{obj.title}</span>
                  <span className="text-text-tertiary ml-auto">{obj.confidence}%</span>
                </div>
              ))}
              {pi.objectives.length > 2 && (
                <div className="text-xs text-text-tertiary">
                  +{pi.objectives.length - 2} more objectives
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm text-text-secondary">
            {pi.iterations} iterations • {pi.features.length} features
          </div>
          <div className="flex items-center text-sm text-iris hover:text-iris-light">
            Open Canvas
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function DemoHorizonPage() {
  const toast = useToastActions();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPIName, setNewPIName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePI = async () => {
    setIsCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsCreateModalOpen(false);
    setNewPIName("");
    setIsCreating(false);
    toast.success("PI created", "Your new Program Increment has been created");
  };

  const activePIs = DEMO_PIS.filter((pi) => pi.status === "active");
  const completedPIs = DEMO_PIS.filter((pi) => pi.status === "completed");

  return (
    <div>
      <PageHeader
        title="Horizon"
        description="Program Increment planning and dependency management"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New PI
          </Button>
        }
      />

      {/* Active PIs */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Active PIs</h2>
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {activePIs.map((pi) => (
            <PICard key={pi.id} pi={pi} />
          ))}
        </motion.div>
      </div>

      {/* Completed PIs */}
      {completedPIs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Completed PIs</h2>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {completedPIs.map((pi) => (
              <PICard key={pi.id} pi={pi} />
            ))}
          </motion.div>
        </div>
      )}

      {/* Create PI Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Create Program Increment"
        description="Set up a new PI for planning"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="pi-name">PI Name</Label>
            <Input
              id="pi-name"
              placeholder="e.g., PI 2026.3"
              value={newPIName}
              onChange={(e) => setNewPIName(e.target.value)}
            />
          </div>
          <div>
            <Label>Duration</Label>
            <p className="text-sm text-text-secondary">
              Default: 5 iterations (10 weeks)
            </p>
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreatePI} disabled={!newPIName || isCreating} isLoading={isCreating}>
            Create PI
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
