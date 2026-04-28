"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Clock,
  CheckCircle2,
  Archive,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from "@/components/ui/tabs";
import { EmptySignalState } from "@/components/ui/empty-state";
import { useToastActions } from "@/components/ui/toast";
import { useSignalUpdates, useDeleteUpdate } from "@/hooks/use-signal";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { formatDistanceToNow } from "date-fns";

type UpdateStatus = "draft" | "sent" | "archived";

interface SignalUpdateItem {
  id: string;
  sprintRef: string | null;
  status: UpdateStatus;
  sentAt: string | null;
  createdAt: string;
}

function LoadingState() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-surface-01">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function UpdateRow({
  update,
  onClick,
  onDelete,
}: {
  update: SignalUpdateItem;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border bg-surface-01",
        "border-border hover:border-border-strong hover:bg-surface-02 cursor-pointer",
        "transition-colors"
      )}
      onClick={onClick}
    >
      {/* Status Icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          update.status === "sent" && "bg-jade-dim",
          update.status === "draft" && "bg-amber-dim",
          update.status === "archived" && "bg-surface-03"
        )}
      >
        {update.status === "sent" && <CheckCircle2 className="w-4 h-4 text-jade" />}
        {update.status === "draft" && <Clock className="w-4 h-4 text-amber" />}
        {update.status === "archived" && <Archive className="w-4 h-4 text-text-tertiary" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary">{update.sprintRef || "Update"}</span>
          <Badge variant={update.status === "sent" ? "excellent" : "fair"} size="sm">
            {update.status}
          </Badge>
        </div>
        <div className="text-xs text-text-tertiary mt-1">
          {update.sentAt
            ? `Sent ${formatDistanceToNow(new Date(update.sentAt), { addSuffix: true })}`
            : `Created ${formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}`}
        </div>
      </div>

      {/* Meta - Spacer */}
      <div className="flex-1" />

      {/* Actions */}
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
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>View Details</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-coral" onClick={(e) => { e.stopPropagation(); onDelete(); }}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

export default function SignalPage() {
  const router = useRouter();
  const toast = useToastActions();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "draft">("all");

  const { data: updatesData, isLoading, error } = useSignalUpdates({
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const deleteUpdate = useDeleteUpdate();

  const updates: SignalUpdateItem[] = (updatesData?.updates || []).map((u) => ({
    id: u.id,
    sprintRef: u.sprintRef,
    status: u.status as UpdateStatus,
    sentAt: u.sentAt || null,
    createdAt: u.createdAt,
  }));

  const filteredUpdates = updates.filter((update) => {
    if (
      searchQuery &&
      !(update.sprintRef || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const handleDelete = async (updateId: string) => {
    try {
      await deleteUpdate.mutateAsync(updateId);
      toast.success("Update deleted");
    } catch (err) {
      toast.error("Failed to delete", err instanceof Error ? err.message : "Unknown error");
    }
  };

  const allUpdatesCount = updates.length;
  const sentCount = updates.filter((u) => u.status === "sent").length;
  const draftCount = updates.filter((u) => u.status === "draft").length;

  return (
    <div>
      <PageHeader
        title="Signal"
        description="AI-powered stakeholder updates and communication"
        actions={
          <Button onClick={() => router.push("/signal/new")}>
            <Plus className="w-4 h-4 mr-1" />
            New Update
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
      >
        <TabsListUnderline>
          <TabsTriggerUnderline value="all">
            All Updates
            <Badge variant="default" size="sm" className="ml-2">
              {allUpdatesCount}
            </Badge>
          </TabsTriggerUnderline>
          <TabsTriggerUnderline value="sent">
            Sent
            <Badge variant="excellent" size="sm" className="ml-2">
              {sentCount}
            </Badge>
          </TabsTriggerUnderline>
          <TabsTriggerUnderline value="draft">
            Drafts
            <Badge variant="fair" size="sm" className="ml-2">
              {draftCount}
            </Badge>
          </TabsTriggerUnderline>
        </TabsListUnderline>

        <TabsContent value={statusFilter} className="mt-4">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-coral mb-4" />
              <p className="text-text-secondary">Failed to load updates</p>
            </div>
          ) : filteredUpdates.length === 0 ? (
            <EmptySignalState onCreate={() => router.push("/signal/new")} />
          ) : (
            <motion.div
              className="space-y-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {filteredUpdates.map((update) => (
                <UpdateRow
                  key={update.id}
                  update={update}
                  onClick={() => router.push(`/signal/${update.id}`)}
                  onDelete={() => handleDelete(update.id)}
                />
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
