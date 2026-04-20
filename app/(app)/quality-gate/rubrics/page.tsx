"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Settings2,
  Trash2,
  Copy,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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

interface Dimension {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  enabled: boolean;
}

interface Rubric {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  dimensions: Dimension[];
  createdAt: string;
}

// Mock data
const mockRubrics: Rubric[] = [
  {
    id: "default",
    name: "Standard Quality Rubric",
    description: "The default rubric for scoring user stories based on agile best practices",
    isDefault: true,
    dimensions: [
      { id: "completeness", name: "Completeness", description: "Story has all required fields filled out", maxScore: 25, enabled: true },
      { id: "clarity", name: "Clarity", description: "Story is clearly written and easily understood", maxScore: 25, enabled: true },
      { id: "estimability", name: "Estimability", description: "Story can be reasonably estimated", maxScore: 20, enabled: true },
      { id: "traceability", name: "Traceability", description: "Story is linked to epics, has labels, assigned", maxScore: 15, enabled: true },
      { id: "testability", name: "Testability", description: "Story has verifiable acceptance criteria", maxScore: 15, enabled: true },
    ],
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "strict",
    name: "Strict Engineering Rubric",
    description: "Higher bar for technical stories requiring detailed specifications",
    isDefault: false,
    dimensions: [
      { id: "completeness", name: "Completeness", description: "Story has all required fields filled out", maxScore: 20, enabled: true },
      { id: "clarity", name: "Clarity", description: "Story is clearly written and easily understood", maxScore: 20, enabled: true },
      { id: "estimability", name: "Estimability", description: "Story can be reasonably estimated", maxScore: 15, enabled: true },
      { id: "traceability", name: "Traceability", description: "Story is linked to epics, has labels, assigned", maxScore: 15, enabled: true },
      { id: "testability", name: "Testability", description: "Story has verifiable acceptance criteria", maxScore: 20, enabled: true },
      { id: "technical", name: "Technical Clarity", description: "Technical requirements and dependencies are documented", maxScore: 10, enabled: true },
    ],
    createdAt: "2026-02-15T00:00:00Z",
  },
];

function DimensionRow({
  dimension,
  onUpdate,
  onRemove,
}: {
  dimension: Dimension;
  onUpdate: (updates: Partial<Dimension>) => void;
  onRemove: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg bg-surface-01">
      <div className="flex items-center gap-3 p-3">
        <GripVertical className="w-4 h-4 text-text-tertiary cursor-grab" />
        <Switch
          checked={dimension.enabled}
          onCheckedChange={(checked) => onUpdate({ enabled: checked })}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary">
            {dimension.name}
          </div>
          <div className="text-xs text-text-secondary truncate">
            {dimension.description}
          </div>
        </div>
        <Badge variant="default" className="font-mono">
          {dimension.maxScore} pts
        </Badge>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded hover:bg-surface-03 text-text-tertiary"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border p-4 space-y-4"
        >
          <div>
            <Label>Name</Label>
            <Input
              value={dimension.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={dimension.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
            />
          </div>
          <div>
            <Label>Max Score: {dimension.maxScore}</Label>
            <Slider
              value={[dimension.maxScore]}
              onValueChange={([value]) => onUpdate({ maxScore: value })}
              min={5}
              max={50}
              step={5}
            />
          </div>
          <div className="flex justify-end">
            <Button variant="danger" size="sm" onClick={onRemove}>
              <Trash2 className="w-4 h-4 mr-1" />
              Remove Dimension
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function RubricCard({
  rubric,
  onEdit,
  onDuplicate,
  onSetDefault,
  onDelete,
}: {
  rubric: Rubric;
  onEdit: () => void;
  onDuplicate: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const totalMaxScore = rubric.dimensions.reduce(
    (sum, d) => sum + (d.enabled ? d.maxScore : 0),
    0
  );

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "bg-surface-01 border rounded-lg p-5",
        rubric.isDefault ? "border-iris" : "border-border"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-text-primary">
              {rubric.name}
            </h3>
            {rubric.isDefault && <Badge variant="iris">Default</Badge>}
          </div>
          <p className="text-sm text-text-secondary">{rubric.description}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded hover:bg-surface-03 text-text-tertiary">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Settings2 className="w-4 h-4 mr-2" />
              Edit Rubric
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            {!rubric.isDefault && (
              <DropdownMenuItem onClick={onSetDefault}>
                Set as Default
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-coral">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dimensions Preview */}
      <div className="space-y-2">
        {rubric.dimensions.slice(0, 4).map((dim) => (
          <div key={dim.id} className="flex items-center justify-between">
            <span
              className={cn(
                "text-sm",
                dim.enabled ? "text-text-secondary" : "text-text-tertiary line-through"
              )}
            >
              {dim.name}
            </span>
            <span className="text-xs font-mono text-text-tertiary">
              {dim.maxScore} pts
            </span>
          </div>
        ))}
        {rubric.dimensions.length > 4 && (
          <div className="text-xs text-text-tertiary">
            +{rubric.dimensions.length - 4} more dimensions
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <span className="text-xs text-text-tertiary">
          {rubric.dimensions.filter((d) => d.enabled).length} active dimensions
        </span>
        <span className="text-sm font-mono text-text-primary">
          Total: {totalMaxScore} pts
        </span>
      </div>
    </motion.div>
  );
}

export default function RubricsPage() {
  const toast = useToastActions();
  const [rubrics, setRubrics] = useState(mockRubrics);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null);
  const [newRubricName, setNewRubricName] = useState("");

  const handleCreateRubric = () => {
    const newRubric: Rubric = {
      id: `rubric-${Date.now()}`,
      name: newRubricName,
      description: "Custom scoring rubric",
      isDefault: false,
      dimensions: [
        { id: "completeness", name: "Completeness", description: "Story has all required fields", maxScore: 25, enabled: true },
        { id: "clarity", name: "Clarity", description: "Story is clearly written", maxScore: 25, enabled: true },
        { id: "estimability", name: "Estimability", description: "Story can be estimated", maxScore: 20, enabled: true },
        { id: "traceability", name: "Traceability", description: "Story is properly linked", maxScore: 15, enabled: true },
        { id: "testability", name: "Testability", description: "Story has testable criteria", maxScore: 15, enabled: true },
      ],
      createdAt: new Date().toISOString(),
    };
    setRubrics([...rubrics, newRubric]);
    setIsCreateModalOpen(false);
    setNewRubricName("");
    setEditingRubric(newRubric);
    toast.success("Rubric created", "You can now customize the dimensions");
  };

  const handleDuplicateRubric = (rubric: Rubric) => {
    const duplicate: Rubric = {
      ...rubric,
      id: `rubric-${crypto.randomUUID()}`,
      name: `${rubric.name} (Copy)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    setRubrics([...rubrics, duplicate]);
    toast.success("Rubric duplicated", "You can now customize the copy");
  };

  const handleSetDefault = (rubricId: string) => {
    setRubrics(
      rubrics.map((r) => ({
        ...r,
        isDefault: r.id === rubricId,
      }))
    );
    toast.success("Default rubric updated", "New stories will use this rubric");
  };

  const handleDeleteRubric = (rubricId: string) => {
    if (rubrics.find((r) => r.id === rubricId)?.isDefault) {
      toast.error("Cannot delete", "Default rubric cannot be deleted");
      return;
    }
    setRubrics(rubrics.filter((r) => r.id !== rubricId));
    toast.success("Rubric deleted");
  };

  const handleUpdateDimension = (
    rubricId: string,
    dimensionId: string,
    updates: Partial<Dimension>
  ) => {
    setRubrics(
      rubrics.map((r) =>
        r.id === rubricId
          ? {
              ...r,
              dimensions: r.dimensions.map((d) =>
                d.id === dimensionId ? { ...d, ...updates } : d
              ),
            }
          : r
      )
    );
  };

  const handleRemoveDimension = (rubricId: string, dimensionId: string) => {
    setRubrics(
      rubrics.map((r) =>
        r.id === rubricId
          ? {
              ...r,
              dimensions: r.dimensions.filter((d) => d.id !== dimensionId),
            }
          : r
      )
    );
  };

  const handleAddDimension = (rubricId: string) => {
    const newDimension: Dimension = {
      id: `dim-${Date.now()}`,
      name: "New Dimension",
      description: "Describe what this dimension measures",
      maxScore: 10,
      enabled: true,
    };
    setRubrics(
      rubrics.map((r) =>
        r.id === rubricId
          ? { ...r, dimensions: [...r.dimensions, newDimension] }
          : r
      )
    );
  };

  return (
    <div>
      <PageHeader
        title="Quality Rubrics"
        description="Configure scoring dimensions and weights for story analysis"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Rubric
          </Button>
        }
      />

      {editingRubric ? (
        // Editor View
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {editingRubric.name}
              </h2>
              <p className="text-sm text-text-secondary">
                {editingRubric.description}
              </p>
            </div>
            <Button variant="secondary" onClick={() => setEditingRubric(null)}>
              Done Editing
            </Button>
          </div>

          <div className="bg-surface-01 border border-border rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
              <AlertCircle className="w-4 h-4" />
              Total score should add up to 100 for consistent scoring
            </div>
            <div className="text-lg font-mono text-text-primary">
              Total Max Score:{" "}
              {editingRubric.dimensions.reduce(
                (sum, d) => sum + (d.enabled ? d.maxScore : 0),
                0
              )}{" "}
              / 100
            </div>
          </div>

          <div className="space-y-2">
            {editingRubric.dimensions.map((dimension) => (
              <DimensionRow
                key={dimension.id}
                dimension={dimension}
                onUpdate={(updates) =>
                  handleUpdateDimension(editingRubric.id, dimension.id, updates)
                }
                onRemove={() =>
                  handleRemoveDimension(editingRubric.id, dimension.id)
                }
              />
            ))}
          </div>

          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={() => handleAddDimension(editingRubric.id)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Dimension
          </Button>
        </div>
      ) : (
        // List View
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {rubrics.map((rubric) => (
            <RubricCard
              key={rubric.id}
              rubric={rubric}
              onEdit={() => setEditingRubric(rubric)}
              onDuplicate={() => handleDuplicateRubric(rubric)}
              onSetDefault={() => handleSetDefault(rubric.id)}
              onDelete={() => handleDeleteRubric(rubric.id)}
            />
          ))}
        </motion.div>
      )}

      {/* Create Rubric Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Create New Rubric"
        description="Start with default dimensions and customize as needed"
      >
        <div>
          <Label htmlFor="rubric-name">Rubric Name</Label>
          <Input
            id="rubric-name"
            placeholder="e.g., Frontend Stories Rubric"
            value={newRubricName}
            onChange={(e) => setNewRubricName(e.target.value)}
          />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateRubric} disabled={!newRubricName.trim()}>
            Create Rubric
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
