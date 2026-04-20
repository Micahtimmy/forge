"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  Search,
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
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { formatDistanceToNow } from "date-fns";
import { DEMO_UPDATES } from "@/lib/demo/mock-data";
import { audienceLabels } from "@/types/signal";

function UpdateRow({ update }: { update: (typeof DEMO_UPDATES)[0] }) {
  return (
    <Link href={`/demo/signal/${update.id}`}>
      <motion.div
        variants={staggerItem}
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg border bg-surface-01",
          "border-border hover:border-border-strong hover:bg-surface-02 cursor-pointer",
          "transition-colors"
        )}
      >
        {/* Status Icon */}
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            update.status === "sent" && "bg-jade-dim",
            update.status === "draft" && "bg-amber-dim",
            update.status === "archived" && "bg-surface-03"
          )}
        >
          {update.status === "sent" && <CheckCircle2 className="w-5 h-5 text-jade" />}
          {update.status === "draft" && <Clock className="w-5 h-5 text-amber" />}
          {update.status === "archived" && <Archive className="w-5 h-5 text-text-tertiary" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-text-primary">{update.title}</span>
            <Badge
              variant={update.status === "sent" ? "excellent" : update.status === "draft" ? "fair" : "default"}
              size="sm"
            >
              {update.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {update.audiences.map((audience) => (
              <span
                key={audience}
                className="text-xs px-1.5 py-0.5 rounded bg-surface-03 text-text-secondary"
              >
                {audienceLabels[audience].split(" ")[0]}
              </span>
            ))}
            <span className="text-xs text-text-tertiary">
              {update.sprintRef}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="text-right flex-shrink-0">
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
    </Link>
  );
}

export default function DemoSignalPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "draft">("all");

  const filteredUpdates = DEMO_UPDATES.filter((update) => {
    if (statusFilter !== "all" && update.status !== statusFilter) return false;
    if (searchQuery && !update.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Signal"
        description="AI-powered stakeholder updates and communication"
        actions={
          <Link href="/demo/signal/new">
            <Button>
              <Plus className="w-4 h-4 mr-1" />
              New Update
            </Button>
          </Link>
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
              {DEMO_UPDATES.length}
            </Badge>
          </TabsTriggerUnderline>
          <TabsTriggerUnderline value="sent">
            Sent
            <Badge variant="excellent" size="sm" className="ml-2">
              {DEMO_UPDATES.filter((u) => u.status === "sent").length}
            </Badge>
          </TabsTriggerUnderline>
          <TabsTriggerUnderline value="draft">
            Drafts
            <Badge variant="fair" size="sm" className="ml-2">
              {DEMO_UPDATES.filter((u) => u.status === "draft").length}
            </Badge>
          </TabsTriggerUnderline>
        </TabsListUnderline>

        <TabsContent value={statusFilter} className="mt-4">
          {filteredUpdates.length === 0 ? (
            <div className="text-center py-12 bg-surface-01 border border-border rounded-lg">
              <p className="text-text-secondary mb-4">No updates match your filters</p>
              <Link href="/demo/signal/new">
                <Button>Create your first update</Button>
              </Link>
            </div>
          ) : (
            <motion.div
              className="space-y-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {filteredUpdates.map((update) => (
                <UpdateRow key={update.id} update={update} />
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
