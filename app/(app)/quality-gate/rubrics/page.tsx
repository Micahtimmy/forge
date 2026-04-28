"use client";

import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { useToastActions } from "@/components/ui/toast";
import {
  useRubrics,
  useCreateRubric,
  useUpdateRubric,
  useDeleteRubric,
  type Rubric as RubricFromAPI,
} from "@/hooks/use-rubrics";
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

function transformRubricFromAPI(apiRubric: RubricFromAPI): Rubric {
  return {
    id: apiRubric.id,
    name: apiRubric.name,
    description: apiRubric.description || "",
    isDefault: apiRubric.isDefault,
    dimensions: [
      { id: "completeness", name: "Completeness", description: "Story has all required fields", maxScore: apiRubric.completenessWeight, enabled: true },
      { id: "clarity", name: "Clarity", description: "Story is clearly written", maxScore: apiRubric.clarityWeight, enabled: true },
      { id: "estimability", name: "Estimability", description: "Story can be estimated", maxScore: apiRubric.estimabilityWeight, enabled: true },
      { id: "traceability", name: "Traceability", description: "Story is properly linked", maxScore: apiRubric.traceabilityWeight, enabled: true },
      { id: "testability", name: "Testability", description: "Story has testable criteria", maxScore: apiRubric.testabilityWeight, enabled: true },
    ],
    createdAt: apiRubric.createdAt,
  };
}

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

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-surface-01 border border-border rounded-lg p-5">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RubricsPage() {
  const toast = useToastActions();
  const { data: rubricsData, isLoading, error } = useRubrics();
  const createRubric = useCreateRubric();
  const updateRubric = useUpdateRubric();
  const deleteRubric = useDeleteRubric();

  const [localRubrics, setLocalRubrics] = useState<Rubric[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null);
  const [newRubricName, setNewRubricName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (rubricsData?.rubrics) {
      setLocalRubrics(rubricsData.rubrics.map(transformRubricFromAPI));
    }
  }, [rubricsData]);

  const rubrics = localRubrics;

  const handleCreateRubric = async () => {
    try {
      const result = await createRubric.mutateAsync({
        name: newRubricName,
        description: "Custom scoring rubric",
      });
      setIsCreateModalOpen(false);
      setNewRubricName("");
      if (result.rubric) {
        setEditingRubric(transformRubricFromAPI(result.rubric));
      }
      toast.success("Rubric created", "You can now customize the dimensions");
    } catch (err) {
      toast.error("Failed to create rubric", err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleDuplicateRubric = async (rubric: Rubric) => {
    try {
      const dim = rubric.dimensions.reduce((acc, d) => {
        acc[`${d.id}Weight`] = d.maxScore;
        return acc;
      }, {} as Record<string, number>);

      await createRubric.mutateAsync({
        name: `${rubric.name} (Copy)`,
        description: rubric.description,
        completenessWeight: dim.completenessWeight,
        clarityWeight: dim.clarityWeight,
        estimabilityWeight: dim.estimabilityWeight,
        traceabilityWeight: dim.traceabilityWeight,
        testabilityWeight: dim.testabilityWeight,
      });
      toast.success("Rubric duplicated", "You can now customize the copy");
    } catch (err) {
      toast.error("Failed to duplicate", err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleSetDefault = async (rubricId: string) => {
    try {
      await updateRubric.mutateAsync({ rubricId, data: { isDefault: true } });
      toast.success("Default rubric updated", "New stories will use this rubric");
    } catch (err) {
      toast.error("Failed to update", err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleDeleteRubric = async (rubricId: string) => {
    if (rubrics.find((r) => r.id === rubricId)?.isDefault) {
      toast.error("Cannot delete", "Default rubric cannot be deleted");
      return;
    }
    try {
      await deleteRubric.mutateAsync(rubricId);
      toast.success("Rubric deleted");
    } catch (err) {
      toast.error("Failed to delete", err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleUpdateDimension = (
    rubricId: string,
    dimensionId: string,
    updates: Partial<Dimension>
  ) => {
    setLocalRubrics(
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
    if (editingRubric?.id === rubricId) {
      setEditingRubric({
        ...editingRubric,
        dimensions: editingRubric.dimensions.map((d) =>
          d.id === dimensionId ? { ...d, ...updates } : d
        ),
      });
    }
  };

  const handleRemoveDimension = (rubricId: string, dimensionId: string) => {
    setLocalRubrics(
      rubrics.map((r) =>
        r.id === rubricId
          ? {
              ...r,
              dimensions: r.dimensions.filter((d) => d.id !== dimensionId),
            }
          : r
      )
    );
    if (editingRubric?.id === rubricId) {
      setEditingRubric({
        ...editingRubric,
        dimensions: editingRubric.dimensions.filter((d) => d.id !== dimensionId),
      });
    }
  };

  const handleAddDimension = (rubricId: string) => {
    const newDimension: Dimension = {
      id: `dim-${Date.now()}`,
      name: "New Dimension",
      description: "Describe what this dimension measures",
      maxScore: 10,
      enabled: true,
    };
    setLocalRubrics(
      rubrics.map((r) =>
        r.id === rubricId
          ? { ...r, dimensions: [...r.dimensions, newDimension] }
          : r
      )
    );
    if (editingRubric?.id === rubricId) {
      setEditingRubric({
        ...editingRubric,
        dimensions: [...editingRubric.dimensions, newDimension],
      });
    }
  };

  const handleSaveEditing = async () => {
    if (!editingRubric) return;
    setIsSaving(true);
    try {
      const weights: Record<string, number> = {};
      for (const dim of editingRubric.dimensions) {
        if (dim.enabled) {
          weights[`${dim.id}Weight`] = dim.maxScore;
        }
      }
      await updateRubric.mutateAsync({
        rubricId: editingRubric.id,
        data: {
          completenessWeight: weights.completenessWeight ?? 0,
          clarityWeight: weights.clarityWeight ?? 0,
          estimabilityWeight: weights.estimabilityWeight ?? 0,
          traceabilityWeight: weights.traceabilityWeight ?? 0,
          testabilityWeight: weights.testabilityWeight ?? 0,
        },
      });
      toast.success("Rubric saved", "Changes have been applied");
      setEditingRubric(null);
    } catch (err) {
      toast.error("Failed to save", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Quality Rubrics"
          description="Configure scoring dimensions and weights for story analysis"
        />
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Quality Rubrics"
          description="Configure scoring dimensions and weights for story analysis"
        />
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-coral mb-4" />
          <p className="text-text-secondary">Failed to load rubrics</p>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setEditingRubric(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditing} isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
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
