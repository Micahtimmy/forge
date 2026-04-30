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
  Sparkles,
  User,
  Target,
  Shield,
  Code,
  Briefcase,
  Wand2,
  Check,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea } from "@/components/ui/input";
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

// Starter templates for different roles
const RUBRIC_TEMPLATES = [
  {
    id: "engineering-manager",
    name: "Engineering Manager",
    icon: Briefcase,
    color: "bg-iris-dim text-iris",
    description: "Focuses on business value, technical feasibility, and delivery confidence",
    dimensions: [
      { id: "completeness", name: "Business Value Clarity", description: "Story clearly articulates business value and outcomes", maxScore: 25, enabled: true },
      { id: "clarity", name: "Technical Feasibility", description: "Technical approach is defined and achievable within sprint", maxScore: 25, enabled: true },
      { id: "estimability", name: "Effort Estimate Confidence", description: "Team has high confidence in estimation accuracy", maxScore: 20, enabled: true },
      { id: "traceability", name: "Dependency Identification", description: "All dependencies are identified and managed", maxScore: 15, enabled: true },
      { id: "testability", name: "Definition of Done Completeness", description: "Clear, measurable acceptance criteria", maxScore: 15, enabled: true },
    ],
  },
  {
    id: "rte-safe",
    name: "RTE / SAFe Coach",
    icon: Target,
    color: "bg-jade-dim text-jade",
    description: "Optimized for PI planning, cross-team dependencies, and risk management",
    dimensions: [
      { id: "completeness", name: "PI Objective Alignment", description: "Story contributes to PI objectives and ART vision", maxScore: 20, enabled: true },
      { id: "clarity", name: "Dependency Mapping", description: "Cross-team dependencies are identified and negotiated", maxScore: 25, enabled: true },
      { id: "estimability", name: "Capacity Feasibility", description: "Story fits within team capacity and velocity", maxScore: 20, enabled: true },
      { id: "traceability", name: "ROAM Risk Categorization", description: "Risks are identified and properly categorized", maxScore: 20, enabled: true },
      { id: "testability", name: "ART-Level Value Clarity", description: "Value stream impact is understood", maxScore: 15, enabled: true },
    ],
  },
  {
    id: "scrum-master",
    name: "Scrum Master",
    icon: Shield,
    color: "bg-amber-dim text-amber",
    description: "INVEST principles, sprint readiness, and team collaboration focus",
    dimensions: [
      { id: "completeness", name: "Acceptance Criteria Completeness", description: "Clear, testable acceptance criteria following Given-When-Then", maxScore: 25, enabled: true },
      { id: "clarity", name: "Sprint-Ready (INVEST)", description: "Story meets Independent, Negotiable, Valuable, Estimable, Small, Testable criteria", maxScore: 25, enabled: true },
      { id: "estimability", name: "Shared Understanding", description: "Team has discussed and understands the story", maxScore: 20, enabled: true },
      { id: "traceability", name: "Story Independence", description: "Story can be delivered independently without tight coupling", maxScore: 15, enabled: true },
      { id: "testability", name: "Testability", description: "QA can write test cases from the story", maxScore: 15, enabled: true },
    ],
  },
  {
    id: "tech-lead",
    name: "Tech Lead",
    icon: Code,
    color: "bg-sky-dim text-sky",
    description: "Technical depth, API contracts, NFRs, and system resilience",
    dimensions: [
      { id: "completeness", name: "Technical Clarity", description: "Implementation approach, architecture decisions, and constraints are defined", maxScore: 25, enabled: true },
      { id: "clarity", name: "NFR Coverage", description: "Performance, security, scalability requirements are specified", maxScore: 20, enabled: true },
      { id: "estimability", name: "API/Contract Definition", description: "Interface contracts and data models are documented", maxScore: 20, enabled: true },
      { id: "traceability", name: "Edge Case Consideration", description: "Error scenarios and edge cases are identified", maxScore: 20, enabled: true },
      { id: "testability", name: "Rollback/Failure Path", description: "Recovery procedures and failure handling defined", maxScore: 15, enabled: true },
    ],
  },
];

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

function TemplateCard({
  template,
  onUse,
}: {
  template: typeof RUBRIC_TEMPLATES[0];
  onUse: () => void;
}) {
  const IconComponent = template.icon;

  return (
    <motion.div
      variants={staggerItem}
      className="bg-surface-01 border border-border rounded-lg p-5 hover:border-border-strong transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-lg", template.color)}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary mb-1">
            {template.name}
          </h3>
          <p className="text-xs text-text-secondary mb-3">
            {template.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {template.dimensions.slice(0, 3).map((dim) => (
              <Badge key={dim.id} variant="default" size="sm">
                {dim.name.split(" ").slice(0, 2).join(" ")}
              </Badge>
            ))}
            {template.dimensions.length > 3 && (
              <Badge variant="default" size="sm">
                +{template.dimensions.length - 3} more
              </Badge>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={onUse} className="w-full">
            <Check className="w-3 h-3 mr-1" />
            Use Template
          </Button>
        </div>
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-surface-02 flex items-center justify-center mx-auto mb-4">
        <Shield className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-2">
        No Rubrics Yet
      </h3>
      <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
        Create your first quality rubric to start scoring stories. Choose from
        a template or create a custom rubric tailored to your team.
      </p>
      <Button onClick={onCreate}>
        <Plus className="w-4 h-4 mr-1" />
        Create Your First Rubric
      </Button>
    </div>
  );
}

export default function RubricsPage() {
  const toast = useToastActions();
  const { data: rubricsData, isLoading, error, refetch } = useRubrics();
  const createRubric = useCreateRubric();
  const updateRubric = useUpdateRubric();
  const deleteRubric = useDeleteRubric();

  const [localRubrics, setLocalRubrics] = useState<Rubric[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null);
  const [newRubricName, setNewRubricName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [aiPrompt, setAIPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGeneratedRubric, setAIGeneratedRubric] = useState<{
    name: string;
    description: string;
    dimensions: Dimension[];
  } | null>(null);

  useEffect(() => {
    if (rubricsData?.rubrics) {
      setLocalRubrics(rubricsData.rubrics.map(transformRubricFromAPI));
    }
  }, [rubricsData]);

  const rubrics = localRubrics;

  const handleUseTemplate = async (template: typeof RUBRIC_TEMPLATES[0]) => {
    try {
      const result = await createRubric.mutateAsync({
        name: template.name,
        description: template.description,
        completenessWeight: template.dimensions.find((d) => d.id === "completeness")?.maxScore || 25,
        clarityWeight: template.dimensions.find((d) => d.id === "clarity")?.maxScore || 25,
        estimabilityWeight: template.dimensions.find((d) => d.id === "estimability")?.maxScore || 20,
        traceabilityWeight: template.dimensions.find((d) => d.id === "traceability")?.maxScore || 15,
        testabilityWeight: template.dimensions.find((d) => d.id === "testability")?.maxScore || 15,
      });
      toast.success("Template applied", "You can now customize the rubric");
      if (result.rubric) {
        const newRubric = transformRubricFromAPI(result.rubric);
        // Apply custom dimension names from template
        newRubric.dimensions = template.dimensions.map((td) => ({
          ...td,
          maxScore: newRubric.dimensions.find((d) => d.id === td.id)?.maxScore || td.maxScore,
        }));
        setEditingRubric(newRubric);
      }
    } catch (err) {
      toast.error("Failed to apply template", err instanceof Error ? err.message : "Unknown error");
    }
  };

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

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Enter a description", "Tell us about your team and what you'd like to measure");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const res = await fetch("/api/ai/generate-rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate rubric");
      }

      const data = await res.json();
      setAIGeneratedRubric({
        name: data.name || "AI-Generated Rubric",
        description: data.description || aiPrompt,
        dimensions: data.dimensions || [],
      });
    } catch (err) {
      toast.error("Generation failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveAIRubric = async () => {
    if (!aiGeneratedRubric) return;

    try {
      const dims = aiGeneratedRubric.dimensions.reduce((acc, d, i) => {
        const keys = ["completeness", "clarity", "estimability", "traceability", "testability"];
        if (keys[i]) {
          acc[`${keys[i]}Weight`] = d.maxScore;
        }
        return acc;
      }, {} as Record<string, number>);

      await createRubric.mutateAsync({
        name: aiGeneratedRubric.name,
        description: aiGeneratedRubric.description,
        completenessWeight: dims.completenessWeight || 20,
        clarityWeight: dims.clarityWeight || 20,
        estimabilityWeight: dims.estimabilityWeight || 20,
        traceabilityWeight: dims.traceabilityWeight || 20,
        testabilityWeight: dims.testabilityWeight || 20,
      });

      toast.success("Rubric saved", "Your AI-generated rubric is ready to use");
      setIsAIModalOpen(false);
      setAIGeneratedRubric(null);
      setAIPrompt("");
    } catch (err) {
      toast.error("Failed to save", err instanceof Error ? err.message : "Unknown error");
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
          actions={
            <Button variant="secondary" onClick={() => refetch()}>
              <Loader2 className="w-4 h-4 mr-1" />
              Retry
            </Button>
          }
        />
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-coral mb-4" />
          <p className="text-text-primary font-medium mb-2">Failed to Load Rubrics</p>
          <p className="text-text-secondary text-sm mb-4">
            {error instanceof Error ? error.message : "Please check your connection and try again"}
          </p>
          <Button onClick={() => refetch()}>
            Try Again
          </Button>
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
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsAIModalOpen(true)}>
              <Sparkles className="w-4 h-4 mr-1" />
              Generate with AI
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Rubric
            </Button>
          </div>
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
              <Info className="w-4 h-4" />
              Total score should add up to 100 for consistent scoring
            </div>
            <div className="text-lg font-mono text-text-primary">
              Total Max Score:{" "}
              <span className={cn(
                editingRubric.dimensions.reduce((sum, d) => sum + (d.enabled ? d.maxScore : 0), 0) === 100
                  ? "text-jade"
                  : "text-amber"
              )}>
                {editingRubric.dimensions.reduce(
                  (sum, d) => sum + (d.enabled ? d.maxScore : 0),
                  0
                )}
              </span>
              {" "}/ 100
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
        <>
          {/* Templates Section */}
          {rubrics.length === 0 || showTemplates ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-text-primary">Starter Templates</h2>
                  <p className="text-sm text-text-secondary">
                    Choose a template tailored to your role for quick setup
                  </p>
                </div>
                {rubrics.length > 0 && (
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="text-xs text-text-tertiary hover:text-text-secondary"
                  >
                    Hide templates
                  </button>
                )}
              </div>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {RUBRIC_TEMPLATES.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={() => handleUseTemplate(template)}
                  />
                ))}
              </motion.div>
            </div>
          ) : (
            <button
              onClick={() => setShowTemplates(true)}
              className="mb-6 text-sm text-iris hover:underline"
            >
              Show starter templates
            </button>
          )}

          {/* Rubrics List */}
          {rubrics.length === 0 ? (
            <EmptyState onCreate={() => setIsCreateModalOpen(true)} />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-text-primary">Your Rubrics</h2>
                <Badge variant="default">{rubrics.length} rubric{rubrics.length !== 1 ? "s" : ""}</Badge>
              </div>
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
            </>
          )}
        </>
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

      {/* AI Generation Modal */}
      <Modal
        open={isAIModalOpen}
        onOpenChange={setIsAIModalOpen}
        title="Generate Rubric with AI"
        description="Describe your team and what quality aspects matter most"
      >
        <div className="space-y-4">
          {!aiGeneratedRubric ? (
            <>
              <div>
                <Label htmlFor="ai-prompt">Describe Your Team Context</Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="e.g., We're a mobile app team focused on consumer fintech. We prioritize security, user experience, and fast iteration. Our stories often involve API integrations and payment flows..."
                  value={aiPrompt}
                  onChange={(e) => setAIPrompt(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="p-3 bg-surface-02 rounded-lg text-xs text-text-secondary">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-iris mt-0.5" />
                  <div>
                    <strong className="text-text-primary">Powered by Gemini AI</strong>
                    <p className="mt-1">
                      The AI will generate 5 scoring dimensions tailored to your team's context,
                      with descriptions and recommended weights.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-jade-dim border border-jade/30 rounded-lg">
                <div className="flex items-center gap-2 text-jade mb-2">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Rubric Generated</span>
                </div>
                <h4 className="text-text-primary font-medium">{aiGeneratedRubric.name}</h4>
                <p className="text-sm text-text-secondary mt-1">{aiGeneratedRubric.description}</p>
              </div>
              <div className="space-y-2">
                <Label>Preview Dimensions</Label>
                {aiGeneratedRubric.dimensions.map((dim, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface-02 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{dim.name}</div>
                      <div className="text-xs text-text-secondary">{dim.description}</div>
                    </div>
                    <Badge variant="default" className="font-mono">{dim.maxScore} pts</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <ModalFooter>
          {!aiGeneratedRubric ? (
            <>
              <Button variant="ghost" onClick={() => setIsAIModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerateWithAI}
                isLoading={isGeneratingAI}
                disabled={!aiPrompt.trim()}
              >
                <Wand2 className="w-4 h-4 mr-1" />
                Generate
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setAIGeneratedRubric(null);
                  setAIPrompt("");
                }}
              >
                Start Over
              </Button>
              <Button onClick={handleSaveAIRubric}>
                <Check className="w-4 h-4 mr-1" />
                Save Rubric
              </Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
