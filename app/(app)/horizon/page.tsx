"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { EmptyPIState } from "@/components/ui/empty-state";
import { useToastActions } from "@/components/ui/toast";
import { usePIs, useCreatePI, type PIListItem } from "@/hooks/use-pi";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { format, addWeeks } from "date-fns";

interface PICardData extends PIListItem {
  teams: number;
  dependencies: number;
  risks: number;
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-surface-01 border border-border rounded-lg p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded" />
                <div>
                  <Skeleton className="h-4 w-8 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-border">
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PICard({
  pi,
  onClick,
}: {
  pi: PICardData;
  onClick: () => void;
}) {
  const statusConfig = {
    planning: { icon: Clock, color: "text-amber", bg: "bg-amber-dim" },
    active: { icon: Play, color: "text-jade", bg: "bg-jade-dim" },
    completed: { icon: CheckCircle2, color: "text-text-secondary", bg: "bg-surface-03" },
  };

  const config = statusConfig[pi.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "bg-surface-01 border border-border rounded-lg p-5",
        "hover:border-border-strong hover:bg-surface-02 cursor-pointer",
        "transition-colors"
      )}
      onClick={onClick}
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
                  : pi.status === "planning"
                  ? "fair"
                  : "default"
              }
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {pi.status}
            </Badge>
          </div>
          <div className="text-sm text-text-secondary">
            {pi.startDate && pi.endDate && (
              <>
                {format(new Date(pi.startDate), "MMM d")} -{" "}
                {format(new Date(pi.endDate), "MMM d, yyyy")}
              </>
            )}
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-surface-03">
            <Users className="w-4 h-4 text-text-tertiary" />
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">{pi.teams}</div>
            <div className="text-xs text-text-tertiary">Teams</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-surface-03">
            <GitBranch className="w-4 h-4 text-text-tertiary" />
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">
              {pi.dependencies}
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
                pi.risks > 0 ? "text-amber" : "text-text-primary"
              )}
            >
              {pi.risks}
            </div>
            <div className="text-xs text-text-tertiary">Risks</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-sm text-text-secondary">
          {pi.iterationCount} iterations
        </div>
        <div className="flex items-center text-sm text-iris hover:text-iris-light">
          Open Canvas
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </motion.div>
  );
}

export default function HorizonPage() {
  const router = useRouter();
  const toast = useToastActions();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPIName, setNewPIName] = useState("");
  const [newPIIterations, setNewPIIterations] = useState("5");

  const { data: pisData, isLoading, error } = usePIs();
  const createPI = useCreatePI();

  const pis: PICardData[] = (pisData?.pis || []).map((pi) => ({
    ...pi,
    teams: pi.teamsCount || 0,
    dependencies: pi.dependenciesCount || 0,
    risks: pi.risksCount || 0,
  }));

  const handleCreatePI = async () => {
    try {
      const iterations = parseInt(newPIIterations) || 5;
      const startDate = new Date();
      const endDate = addWeeks(startDate, iterations * 2);

      const result = await createPI.mutateAsync({
        name: newPIName,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        iterationCount: iterations,
        iterationLengthWeeks: 2,
      });

      setIsCreateModalOpen(false);
      setNewPIName("");
      setNewPIIterations("5");

      if (result.pi?.id) {
        toast.success("PI created", `${newPIName} is ready for planning`);
        router.push(`/horizon/${result.pi.id}`);
      }
    } catch (err) {
      toast.error("Failed to create PI", err instanceof Error ? err.message : "Unknown error");
    }
  };

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

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="w-12 h-12 text-coral mb-4" />
          <p className="text-text-secondary">Failed to load Program Increments</p>
        </div>
      ) : pis.length === 0 ? (
        <EmptyPIState onCreate={() => setIsCreateModalOpen(true)} />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {pis.map((pi) => (
            <PICard
              key={pi.id}
              pi={pi}
              onClick={() => router.push(`/horizon/${pi.id}`)}
            />
          ))}
        </motion.div>
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
            <Label htmlFor="iterations">Number of Iterations</Label>
            <Input
              id="iterations"
              type="number"
              min={1}
              max={10}
              value={newPIIterations}
              onChange={(e) => setNewPIIterations(e.target.value)}
            />
            <p className="text-xs text-text-tertiary mt-1">
              Typically 5 iterations for a 10-week PI
            </p>
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} disabled={createPI.isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreatePI} disabled={!newPIName || createPI.isPending} isLoading={createPI.isPending}>
            Create PI
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
