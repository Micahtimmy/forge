"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel,
  Plus,
  Search,
  Tag,
  Link2,
  X,
  User,
  Calendar,
  ChevronRight,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown";
import { AnimatedCard } from "@/components/ui/animated";
import { useToastActions } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { formatDistanceToNow } from "date-fns";

export interface Decision {
  id: string;
  title: string;
  reasoning: string | null;
  madeById: string;
  madeByName?: string;
  affectedTickets: string[];
  tags: string[];
  createdAt: Date;
  signalUpdateId?: string | null;
}

interface DecisionLoggerProps {
  decisions: Decision[];
  onCreateDecision: (decision: {
    title: string;
    reasoning?: string;
    affectedTickets?: string[];
    tags?: string[];
  }) => Promise<void>;
  onDeleteDecision: (decisionId: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const SUGGESTED_TAGS = [
  "scope-change",
  "technical",
  "budget",
  "timeline",
  "resource",
  "risk",
  "process",
  "dependency",
];

export function DecisionLogger({
  decisions,
  onCreateDecision,
  onDeleteDecision,
  isLoading,
  className,
}: DecisionLoggerProps) {
  const toast = useToastActions();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Composer state
  const [title, setTitle] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [ticketInput, setTicketInput] = useState("");
  const [affectedTickets, setAffectedTickets] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredDecisions = decisions.filter((decision) => {
    if (
      searchQuery &&
      !decision.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !decision.reasoning?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (selectedTag && !decision.tags.includes(selectedTag)) {
      return false;
    }
    return true;
  });

  const allTags = [...new Set(decisions.flatMap((d) => d.tags))];

  const handleAddTicket = () => {
    const ticket = ticketInput.trim().toUpperCase();
    if (ticket && !affectedTickets.includes(ticket)) {
      setAffectedTickets([...affectedTickets, ticket]);
      setTicketInput("");
    }
  };

  const handleRemoveTicket = (ticket: string) => {
    setAffectedTickets(affectedTickets.filter((t) => t !== ticket));
  };

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.warning("Title required", "Please enter a decision title");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateDecision({
        title: title.trim(),
        reasoning: reasoning.trim() || undefined,
        affectedTickets,
        tags,
      });

      // Reset form
      setTitle("");
      setReasoning("");
      setAffectedTickets([]);
      setTags([]);
      setIsComposerOpen(false);

      toast.success("Decision logged", "Your decision has been recorded");
    } catch {
      toast.error("Failed to log decision", "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (decisionId: string) => {
    try {
      await onDeleteDecision(decisionId);
      toast.success("Decision deleted");
    } catch {
      toast.error("Failed to delete", "Please try again");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-iris-dim flex items-center justify-center">
            <Gavel className="w-4 h-4 text-iris" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Decision Log</h3>
            <p className="text-xs text-text-tertiary">
              {decisions.length} decision{decisions.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setIsComposerOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Log Decision
        </Button>
      </div>

      {/* Composer */}
      <AnimatePresence>
        {isComposerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <AnimatedCard className="p-4 border-iris/30">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Decision Title *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Descoped payment gateway integration from MVP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Reasoning (optional)
                  </label>
                  <Textarea
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    placeholder="Why was this decision made? What factors were considered?"
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Affected Tickets
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={ticketInput}
                      onChange={(e) => setTicketInput(e.target.value)}
                      placeholder="PROJ-123"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTicket();
                        }
                      }}
                      leftIcon={<Link2 className="w-4 h-4" />}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddTicket}
                      disabled={!ticketInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {affectedTickets.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {affectedTickets.map((ticket) => (
                        <Badge
                          key={ticket}
                          variant="default"
                          className="pl-2 pr-1 py-0.5 flex items-center gap-1"
                        >
                          {ticket}
                          <button
                            onClick={() => handleRemoveTicket(ticket)}
                            aria-label={`Remove ticket ${ticket}`}
                            className="hover:bg-surface-03 rounded p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        className={cn(
                          "px-2 py-1 text-xs rounded-full border transition-colors",
                          tags.includes(tag)
                            ? "bg-iris text-white border-iris"
                            : "bg-surface-02 text-text-secondary border-border hover:border-iris"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsComposerOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !title.trim()}
                  >
                    {isSubmitting ? "Logging..." : "Log Decision"}
                  </Button>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter */}
      {decisions.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Search decisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="w-4 h-4 text-text-tertiary" />
              {allTags.slice(0, 5).map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTag(selectedTag === tag ? null : tag)
                  }
                  className={cn(
                    "px-2 py-0.5 text-xs rounded-full transition-colors",
                    selectedTag === tag
                      ? "bg-iris text-white"
                      : "bg-surface-02 text-text-secondary hover:bg-surface-03"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Decision List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-lg bg-surface-02 animate-pulse"
            />
          ))}
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="text-center py-8 text-text-tertiary">
          {decisions.length === 0
            ? "No decisions logged yet. Start by logging your first decision."
            : "No decisions match your search."}
        </div>
      ) : (
        <motion.div
          className="space-y-2"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {filteredDecisions.map((decision) => (
            <DecisionRow
              key={decision.id}
              decision={decision}
              onDelete={() => handleDelete(decision.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function DecisionRow({
  decision,
  onDelete,
}: {
  decision: Decision;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div variants={staggerItem}>
      <AnimatedCard
        className={cn(
          "p-4 cursor-pointer transition-colors",
          isExpanded && "border-iris/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-03 flex items-center justify-center flex-shrink-0">
            <Gavel className="w-4 h-4 text-text-tertiary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-text-primary">
                  {decision.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {decision.madeByName || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(decision.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ChevronRight
                  className={cn(
                    "w-4 h-4 text-text-tertiary transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1.5 rounded hover:bg-surface-03 text-text-tertiary hover:text-text-primary"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="More options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-coral"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Tags */}
            {decision.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {decision.tags.map((tag) => (
                  <Badge key={tag} variant="default" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-border space-y-3">
                    {decision.reasoning && (
                      <div>
                        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                          Reasoning
                        </span>
                        <p className="text-sm text-text-secondary mt-1">
                          {decision.reasoning}
                        </p>
                      </div>
                    )}

                    {decision.affectedTickets.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                          Affected Tickets
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {decision.affectedTickets.map((ticket) => (
                            <Badge
                              key={ticket}
                              variant="default"
                              className="font-mono"
                            >
                              {ticket}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </AnimatedCard>
    </motion.div>
  );
}
