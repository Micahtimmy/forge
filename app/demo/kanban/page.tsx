"use client";

import { motion } from "framer-motion";
import {
  Clock,
  AlertCircle,
  MoreHorizontal,
  Plus,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LabelWithInfo, MetricCard } from "@/components/ui/info-tip";
import { cn } from "@/lib/utils";
import { DEMO_KANBAN_BOARD } from "@/lib/demo/mock-data";

interface KanbanItem {
  id: string;
  key: string;
  title: string;
  priority: string;
  daysInColumn: number;
  assignee?: string;
}

interface KanbanColumn {
  id: string;
  name: string;
  wipLimit: number | null;
  items: KanbanItem[];
}

function KanbanCard({ item }: { item: KanbanItem }) {
  const priorityColors: Record<string, string> = {
    high: "border-l-coral",
    medium: "border-l-amber",
    low: "border-l-text-tertiary",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "bg-surface-02 border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing",
        "hover:border-border-strong transition-colors",
        "border-l-2",
        priorityColors[item.priority] || "border-l-text-tertiary"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-xs text-text-tertiary">{item.key}</span>
        <button className="text-text-tertiary hover:text-text-secondary">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-text-primary mb-3 line-clamp-2">{item.title}</p>
      <div className="flex items-center justify-between">
        {item.assignee ? (
          <div className="w-6 h-6 rounded-full bg-surface-03 flex items-center justify-center">
            <span className="text-xs text-text-secondary">
              {item.assignee[0]}
            </span>
          </div>
        ) : (
          <div className="w-6 h-6" />
        )}
        {item.daysInColumn > 0 && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              item.daysInColumn > 3 ? "text-coral" : "text-text-tertiary"
            )}
          >
            <Clock className="w-3 h-3" />
            {item.daysInColumn}d
          </div>
        )}
      </div>
    </motion.div>
  );
}

function KanbanColumnComponent({ column }: { column: KanbanColumn }) {
  const isOverWip = column.wipLimit !== null && column.items.length > column.wipLimit;
  const isAtWip = column.wipLimit !== null && column.items.length === column.wipLimit;

  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-text-primary">{column.name}</h3>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              isOverWip && "bg-coral-dim text-coral",
              isAtWip && !isOverWip && "bg-amber-dim text-amber",
              !isAtWip && !isOverWip && "bg-surface-03 text-text-tertiary"
            )}
          >
            {column.items.length}
            {column.wipLimit && `/${column.wipLimit}`}
          </span>
        </div>
        <button className="text-text-tertiary hover:text-text-secondary">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isOverWip && (
        <div className="mb-3 p-2 bg-coral-dim border border-coral/20 rounded-lg flex items-center gap-2 text-xs text-coral">
          <AlertCircle className="w-3 h-3" />
          <LabelWithInfo label="WIP limit exceeded" termKey="wip" />
        </div>
      )}

      <div className="space-y-2 min-h-[200px]">
        {column.items.map((item) => (
          <KanbanCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const board = DEMO_KANBAN_BOARD;
  const metrics = board.metrics;

  return (
    <div>
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <span>Kanban Board</span>
            <Badge variant="default">Ops Team</Badge>
          </div>
        }
        description="Continuous flow board for Operations team"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Metrics
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        }
      />

      {/* Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <MetricCard
          label="Cycle Time"
          value={`${metrics.avgCycleTime}d`}
          termKey="cycleTime"
          trend={{ value: -12, positive: true }}
        />
        <MetricCard
          label="Lead Time"
          value={`${metrics.avgLeadTime}d`}
          termKey="leadTime"
          trend={{ value: -6, positive: true }}
        />
        <MetricCard
          label="Throughput"
          value={metrics.throughputThisWeek}
          trend={{
            value: Math.round(
              ((metrics.throughputThisWeek - metrics.throughputAvg) /
                metrics.throughputAvg) *
                100
            ),
          }}
        />
        <MetricCard
          label="Avg Throughput"
          value={`${metrics.throughputAvg}/wk`}
        />
        <MetricCard
          label="Blocked"
          value={`${metrics.blockedPercentage}%`}
          trend={{ value: -4, positive: true }}
        />
      </div>

      {/* Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {board.columns.map((column) => (
            <KanbanColumnComponent key={column.id} column={column} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-text-tertiary">Priority:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-l-2 border-coral bg-surface-03" />
            <span className="text-text-secondary">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-l-2 border-amber bg-surface-03" />
            <span className="text-text-secondary">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-l-2 border-text-tertiary bg-surface-03" />
            <span className="text-text-secondary">Low</span>
          </div>
          <div className="ml-4 flex items-center gap-2 text-text-tertiary">
            <Clock className="w-4 h-4" />
            <span>Days in column</span>
          </div>
        </div>
      </div>
    </div>
  );
}
