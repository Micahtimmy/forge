"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Send,
  Clock,
  CheckCircle2,
  Archive,
  MoreHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { Tabs, TabsListUnderline, TabsTriggerUnderline, TabsContent } from "@/components/ui/tabs";
import { EmptySignalState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { formatDistanceToNow } from "date-fns";
import { audienceLabels, type AudienceType } from "@/types/signal";

type UpdateStatus = "draft" | "sent" | "archived";

// Mock data
const mockUpdates: Array<{
  id: string;
  sprintRef: string;
  audiences: AudienceType[];
  status: UpdateStatus;
  sentAt: string | null;
  createdAt: string;
  authorName: string;
}> = [
  {
    id: "1",
    sprintRef: "Sprint 22",
    audiences: ["executive", "team"],
    status: "sent",
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    authorName: "Jane Doe",
  },
  {
    id: "2",
    sprintRef: "Sprint 21",
    audiences: ["executive", "team", "client"],
    status: "sent",
    sentAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    authorName: "John Smith",
  },
  {
    id: "3",
    sprintRef: "Sprint 22",
    audiences: ["board"],
    status: "draft",
    sentAt: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    authorName: "Jane Doe",
  },
];

function UpdateRow({
  update,
  onClick,
}: {
  update: (typeof mockUpdates)[0];
  onClick: () => void;
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
          <span className="font-medium text-text-primary">{update.sprintRef}</span>
          <Badge variant={update.status === "sent" ? "excellent" : "fair"} size="sm">
            {update.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {update.audiences.map((audience) => (
            <span
              key={audience}
              className="text-xs px-1.5 py-0.5 rounded bg-surface-03 text-text-secondary"
            >
              {audienceLabels[audience].split(" ")[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Meta */}
      <div className="text-right">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Avatar size="xs" alt={update.authorName} />
          <span>{update.authorName}</span>
        </div>
        <div className="text-xs text-text-tertiary mt-1">
          {update.sentAt
            ? `Sent ${formatDistanceToNow(new Date(update.sentAt), { addSuffix: true })}`
            : `Created ${formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}`}
        </div>
      </div>

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
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-coral">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

export default function SignalPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "draft">("all");

  const filteredUpdates = mockUpdates.filter((update) => {
    if (statusFilter !== "all" && update.status !== statusFilter) return false;
    if (
      searchQuery &&
      !update.sprintRef.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

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
              {mockUpdates.length}
            </Badge>
          </TabsTriggerUnderline>
          <TabsTriggerUnderline value="sent">
            Sent
            <Badge variant="excellent" size="sm" className="ml-2">
              {mockUpdates.filter((u) => u.status === "sent").length}
            </Badge>
          </TabsTriggerUnderline>
          <TabsTriggerUnderline value="draft">
            Drafts
            <Badge variant="fair" size="sm" className="ml-2">
              {mockUpdates.filter((u) => u.status === "draft").length}
            </Badge>
          </TabsTriggerUnderline>
        </TabsListUnderline>

        <TabsContent value={statusFilter} className="mt-4">
          {filteredUpdates.length === 0 ? (
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
                />
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
