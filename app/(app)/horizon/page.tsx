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
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { format } from "date-fns";
import type { ProgramIncrement } from "@/types/pi";

// Mock data
const mockPIs: (ProgramIncrement & { teams: number; dependencies: number; risks: number })[] = [
  {
    id: "pi-1",
    workspaceId: "ws-1",
    name: "PI 2026.2",
    startDate: "2026-04-14",
    endDate: "2026-07-06",
    status: "active",
    iterations: 5,
    canvasData: null,
    createdAt: "2026-04-01T00:00:00Z",
    teams: 4,
    dependencies: 12,
    risks: 3,
  },
  {
    id: "pi-2",
    workspaceId: "ws-1",
    name: "PI 2026.1",
    startDate: "2026-01-13",
    endDate: "2026-04-06",
    status: "completed",
    iterations: 5,
    canvasData: null,
    createdAt: "2026-01-01T00:00:00Z",
    teams: 4,
    dependencies: 18,
    risks: 0,
  },
];

function PICard({
  pi,
  onClick,
}: {
  pi: (typeof mockPIs)[0];
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
          {pi.iterations} iterations
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPIName, setNewPIName] = useState("");
  const [newPIIterations, setNewPIIterations] = useState("5");

  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePI = async () => {
    setIsCreating(true);
    try {
      // In real app, this would create a PI in the database and return the ID
      // For now, generate a temporary ID based on name
      const tempId = `pi-${newPIName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
      console.log("Creating PI:", { name: newPIName, iterations: newPIIterations, id: tempId });
      setIsCreateModalOpen(false);
      setNewPIName("");
      setNewPIIterations("5");
      // Navigate to the created PI
      router.push(`/horizon/${tempId}`);
    } catch (error) {
      console.error("Failed to create PI:", error);
    } finally {
      setIsCreating(false);
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

      {mockPIs.length === 0 ? (
        <EmptyPIState onCreate={() => setIsCreateModalOpen(true)} />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {mockPIs.map((pi) => (
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
