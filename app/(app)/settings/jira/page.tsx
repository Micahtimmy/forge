"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Link2,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Trash2,
  AlertCircle,
  Loader2,
  FolderKanban,
  Search,
  Calendar,
  LayoutGrid,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Kanban,
  ListTodo,
  CheckSquare,
  Square,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { PageHeaderCompact } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToastActions } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useJiraStatus,
  useJiraSync,
  useJiraDisconnect,
  useJiraProjects,
  useUpdateJiraProjects,
  useJiraBoards,
  JiraProject,
  JiraBoard,
  SyncOptions,
} from "@/hooks/use-jira";
import { fadeIn } from "@/lib/motion/variants";

// Default issue types that teams commonly use
const ALL_ISSUE_TYPES = [
  { value: "Story", label: "Story" },
  { value: "Task", label: "Task" },
  { value: "Bug", label: "Bug" },
  { value: "Epic", label: "Epic" },
  { value: "Sub-task", label: "Sub-task" },
  { value: "Objective", label: "Objective" },
  { value: "Initiative", label: "Initiative" },
  { value: "Feature", label: "Feature" },
  { value: "Improvement", label: "Improvement" },
  { value: "Spike", label: "Spike" },
  { value: "Technical Debt", label: "Technical Debt" },
];

const DATE_RANGE_PRESETS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export default function JiraSettingsPage() {
  const router = useRouter();
  const toast = useToastActions();

  // Local state
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [boardSearchQuery, setBoardSearchQuery] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<Map<string, JiraProject>>(new Map());
  const [selectedBoards, setSelectedBoards] = useState<Map<number, JiraBoard>>(new Map());
  const [selectedIssueTypes, setSelectedIssueTypes] = useState<Set<string>>(
    new Set(["Story", "Task", "Bug", "Epic", "Objective"])
  );
  const [dateRangePreset, setDateRangePreset] = useState<string>("30d");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showBoardSelector, setShowBoardSelector] = useState(false);

  // Data fetching hooks
  const { data: status, isLoading, error } = useJiraStatus();
  const { data: projectsData, isLoading: projectsLoading } = useJiraProjects();
  const { data: boardsData, isLoading: boardsLoading } = useJiraBoards();
  const syncMutation = useJiraSync();
  const disconnectMutation = useJiraDisconnect();
  const updateProjectsMutation = useUpdateJiraProjects();

  // Computed values
  const selectedProjectKeys = useMemo(() => Array.from(selectedProjects.keys()), [selectedProjects]);

  // Filter boards based on selected projects
  const availableBoards = useMemo(() => {
    if (!boardsData?.boards) return [];
    if (selectedProjectKeys.length === 0) return boardsData.boards;
    return boardsData.boards.filter(
      (board) => board.projectKey && selectedProjectKeys.includes(board.projectKey)
    );
  }, [boardsData?.boards, selectedProjectKeys]);

  // Separate boards by type
  const scrumBoards = useMemo(() => availableBoards.filter((b) => b.type === "scrum"), [availableBoards]);
  const kanbanBoards = useMemo(() => availableBoards.filter((b) => b.type === "kanban"), [availableBoards]);

  // Initialize selected projects from API data
  useEffect(() => {
    if (projectsData?.projects) {
      const selected = new Map<string, JiraProject>();
      projectsData.projects
        .filter((p) => p.syncEnabled)
        .forEach((p) => selected.set(p.key, p));
      setSelectedProjects(selected);
    }
  }, [projectsData]);

  const isConnected = status?.connected ?? false;
  const siteName = status?.siteName || "JIRA";
  const siteUrl = status?.siteUrl || "";

  const handleConnect = () => {
    window.location.href = "/api/jira/auth";
  };

  const handleSync = async (fullSync: boolean = false) => {
    const projectKeys = Array.from(selectedProjects.keys());

    if (projectKeys.length === 0) {
      toast.error("No projects selected", "Please select at least one project to sync");
      setShowProjectSelector(true);
      return;
    }

    const syncOptions: SyncOptions = {
      fullSync,
      projectKeys,
      issueTypes: Array.from(selectedIssueTypes),
      dateRange: {
        preset: dateRangePreset as "7d" | "30d" | "90d" | "all",
      },
    };

    if (selectedBoards.size > 0) {
      syncOptions.boardIds = Array.from(selectedBoards.keys());
    }

    try {
      const result = await syncMutation.mutateAsync(syncOptions);
      toast.success(
        "Sync complete",
        `Synced ${result.stories?.synced ?? 0} items from ${result.projectsSynced ?? projectKeys.length} project(s)`
      );
    } catch (err) {
      toast.error("Sync failed", err instanceof Error ? err.message : "Unknown error");
    }
  };

  // Project selection handlers
  const handleToggleProject = (project: JiraProject) => {
    setSelectedProjects((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(project.key)) {
        newMap.delete(project.key);
      } else {
        newMap.set(project.key, { ...project, syncEnabled: true });
      }
      return newMap;
    });
  };

  const handleSelectAllProjects = () => {
    if (!projectsData?.projects) return;
    const filtered = filteredProjects;
    const newMap = new Map(selectedProjects);
    filtered.forEach((p) => newMap.set(p.key, { ...p, syncEnabled: true }));
    setSelectedProjects(newMap);
  };

  const handleClearAllProjects = () => {
    setSelectedProjects(new Map());
  };

  const handleRemoveProject = (projectKey: string) => {
    setSelectedProjects((prev) => {
      const newMap = new Map(prev);
      newMap.delete(projectKey);
      return newMap;
    });
  };

  // Board selection handlers
  const handleToggleBoard = (board: JiraBoard) => {
    setSelectedBoards((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(board.id)) {
        newMap.delete(board.id);
      } else {
        newMap.set(board.id, board);
      }
      return newMap;
    });
  };

  const handleSelectAllBoards = (type?: "scrum" | "kanban") => {
    const boards = type ? availableBoards.filter((b) => b.type === type) : filteredBoards;
    const newMap = new Map(selectedBoards);
    boards.forEach((b) => newMap.set(b.id, b));
    setSelectedBoards(newMap);
  };

  const handleClearAllBoards = () => {
    setSelectedBoards(new Map());
  };

  const handleRemoveBoard = (boardId: number) => {
    setSelectedBoards((prev) => {
      const newMap = new Map(prev);
      newMap.delete(boardId);
      return newMap;
    });
  };

  // Issue type handlers
  const handleToggleIssueType = (issueType: string) => {
    setSelectedIssueTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(issueType)) {
        newSet.delete(issueType);
      } else {
        newSet.add(issueType);
      }
      return newSet;
    });
  };

  const handleSelectAllIssueTypes = () => {
    setSelectedIssueTypes(new Set(ALL_ISSUE_TYPES.map((t) => t.value)));
  };

  const handleClearIssueTypes = () => {
    setSelectedIssueTypes(new Set());
  };

  const handleSaveProjectSelection = async () => {
    const projects = Array.from(selectedProjects.values()).map((p) => ({
      key: p.key,
      name: p.name,
      syncEnabled: true,
      autoScore: p.autoScore ?? true,
    }));

    try {
      await updateProjectsMutation.mutateAsync(projects);
      toast.success("Projects saved", `${projects.length} project(s) selected for sync`);
      setShowProjectSelector(false);
    } catch (err) {
      toast.error("Failed to save", err instanceof Error ? err.message : "Unknown error");
    }
  };

  // Filtered lists
  const filteredProjects = useMemo(() => {
    if (!projectsData?.projects) return [];
    if (!projectSearchQuery) return projectsData.projects;
    const query = projectSearchQuery.toLowerCase();
    return projectsData.projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.key.toLowerCase().includes(query)
    );
  }, [projectsData?.projects, projectSearchQuery]);

  const filteredBoards = useMemo(() => {
    if (!boardSearchQuery) return availableBoards;
    const query = boardSearchQuery.toLowerCase();
    return availableBoards.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        (b.projectKey && b.projectKey.toLowerCase().includes(query))
    );
  }, [availableBoards, boardSearchQuery]);

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      setShowDisconnectDialog(false);
      toast.success("Disconnected", "JIRA connection has been removed");
    } catch (err) {
      toast.error("Failed to disconnect", err instanceof Error ? err.message : "Unknown error");
    }
  };

  if (isLoading) {
    return (
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-6" />
        <div className="max-w-2xl space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Settings
        </Button>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-coral mb-4" />
          <p className="text-text-secondary">Failed to load JIRA status</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Settings
      </Button>

      <PageHeaderCompact
        title="JIRA Integration"
        subtitle="Connect and sync your JIRA projects, boards, and issues"
      />

      {isConnected ? (
        <div className="max-w-2xl space-y-6">
          {/* Connection Status */}
          <div className="bg-surface-01 border border-border rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-md bg-jade-dim">
                  <CheckCircle2 className="w-5 h-5 text-jade" />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">Connected to JIRA</div>
                  <div className="text-xs text-text-secondary mt-0.5">{siteName}</div>
                </div>
              </div>
              <Badge variant="excellent">Connected</Badge>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-text-tertiary">Last synced</div>
                  <div className="text-text-primary font-medium">
                    {status?.lastSyncAt
                      ? formatDistanceToNow(new Date(status.lastSyncAt), { addSuffix: true })
                      : "Never"}
                  </div>
                </div>
                <div>
                  <div className="text-text-tertiary">Items synced</div>
                  <div className="text-text-primary font-medium">{status?.storiesSynced || 0}</div>
                </div>
                <div>
                  <div className="text-text-tertiary">Projects</div>
                  <div className="text-text-primary font-medium">{selectedProjects.size}</div>
                </div>
                <div>
                  <div className="text-text-tertiary">Boards</div>
                  <div className="text-text-primary font-medium">
                    {selectedBoards.size || "All"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Selection */}
          <div className="bg-surface-01 border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-text-tertiary" />
                <h3 className="text-sm font-semibold text-text-primary">Projects</h3>
                {selectedProjects.size > 0 && (
                  <Badge variant="default" className="text-xs">
                    {selectedProjects.size} selected
                  </Badge>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowProjectSelector(!showProjectSelector)}
              >
                {showProjectSelector ? "Done" : "Manage Projects"}
              </Button>
            </div>

            {/* Selected Projects Tags */}
            {selectedProjects.size > 0 && (
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedProjects.values()).map((project) => (
                  <Badge
                    key={project.key}
                    variant="default"
                    className="text-xs pr-1 flex items-center gap-1"
                  >
                    {project.key}
                    <button
                      onClick={() => handleRemoveProject(project.key)}
                      className="ml-1 p-0.5 hover:bg-surface-03 rounded transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {selectedProjects.size > 1 && (
                  <button
                    onClick={handleClearAllProjects}
                    className="text-xs text-coral hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {selectedProjects.size === 0 && !showProjectSelector && (
              <p className="text-sm text-text-secondary">
                No projects selected. Click &quot;Manage Projects&quot; to choose which JIRA projects to sync.
              </p>
            )}

            {showProjectSelector && (
              <div className="space-y-3 pt-2 border-t border-border">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <Input
                    placeholder="Search projects..."
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSelectAllProjects}
                      className="text-xs text-iris hover:underline flex items-center gap-1"
                    >
                      <CheckSquare className="w-3 h-3" />
                      Select all {filteredProjects.length > 0 && `(${filteredProjects.length})`}
                    </button>
                    <button
                      onClick={handleClearAllProjects}
                      className="text-xs text-text-tertiary hover:underline flex items-center gap-1"
                    >
                      <Square className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                  <span className="text-xs text-text-tertiary">
                    {projectsData?.total || 0} total projects
                  </span>
                </div>

                {/* Project List */}
                <div className="max-h-64 overflow-y-auto border border-border rounded-md divide-y divide-border">
                  {projectsLoading ? (
                    <div className="p-4 text-center text-text-secondary">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading projects...
                    </div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="p-4 text-center text-text-secondary">
                      {projectSearchQuery ? "No projects match your search" : "No projects found"}
                    </div>
                  ) : (
                    filteredProjects.map((project) => (
                      <label
                        key={project.key}
                        className="flex items-center gap-3 p-3 hover:bg-surface-02 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedProjects.has(project.key)}
                          onCheckedChange={() => handleToggleProject(project)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-text-primary">{project.name}</div>
                          <div className="text-xs text-text-secondary">
                            {project.key} • {project.projectTypeKey}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end pt-2">
                  <Button
                    onClick={handleSaveProjectSelection}
                    isLoading={updateProjectsMutation.isPending}
                    size="sm"
                  >
                    Save Selection
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Board Selection */}
          <div className="bg-surface-01 border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-text-tertiary" />
                <h3 className="text-sm font-semibold text-text-primary">Boards</h3>
                {selectedBoards.size > 0 && (
                  <Badge variant="default" className="text-xs">
                    {selectedBoards.size} selected
                  </Badge>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBoardSelector(!showBoardSelector)}
              >
                {showBoardSelector ? "Done" : "Manage Boards"}
              </Button>
            </div>

            {/* Board Summary */}
            {!showBoardSelector && (
              <div className="space-y-2">
                {selectedBoards.size > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedBoards.values()).map((board) => (
                      <Badge
                        key={board.id}
                        variant={board.type === "kanban" ? "info" : "default"}
                        className="text-xs pr-1 flex items-center gap-1"
                      >
                        {board.type === "kanban" ? (
                          <Kanban className="w-3 h-3" />
                        ) : (
                          <ListTodo className="w-3 h-3" />
                        )}
                        {board.name}
                        <button
                          onClick={() => handleRemoveBoard(board.id)}
                          className="ml-1 p-0.5 hover:bg-surface-03 rounded transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    {selectedBoards.size > 1 && (
                      <button
                        onClick={handleClearAllBoards}
                        className="text-xs text-coral hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">
                    All boards synced. Select specific boards to filter data by board type.
                  </p>
                )}

                {/* Board Stats */}
                {availableBoards.length > 0 && (
                  <div className="flex items-center gap-4 text-xs text-text-tertiary pt-2">
                    <span className="flex items-center gap-1">
                      <ListTodo className="w-3 h-3" />
                      {scrumBoards.length} Scrum
                    </span>
                    <span className="flex items-center gap-1">
                      <Kanban className="w-3 h-3" />
                      {kanbanBoards.length} Kanban
                    </span>
                  </div>
                )}
              </div>
            )}

            {showBoardSelector && (
              <div className="space-y-3 pt-2 border-t border-border">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <Input
                    placeholder="Search boards..."
                    value={boardSearchQuery}
                    onChange={(e) => setBoardSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSelectAllBoards()}
                      className="text-xs text-iris hover:underline flex items-center gap-1"
                    >
                      <CheckSquare className="w-3 h-3" />
                      Select all
                    </button>
                    <button
                      onClick={() => handleSelectAllBoards("scrum")}
                      className="text-xs text-text-secondary hover:text-iris flex items-center gap-1"
                    >
                      <ListTodo className="w-3 h-3" />
                      All Scrum
                    </button>
                    <button
                      onClick={() => handleSelectAllBoards("kanban")}
                      className="text-xs text-text-secondary hover:text-iris flex items-center gap-1"
                    >
                      <Kanban className="w-3 h-3" />
                      All Kanban
                    </button>
                    <button
                      onClick={handleClearAllBoards}
                      className="text-xs text-text-tertiary hover:underline flex items-center gap-1"
                    >
                      <Square className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                </div>

                {/* Board List */}
                <div className="max-h-64 overflow-y-auto border border-border rounded-md divide-y divide-border">
                  {boardsLoading ? (
                    <div className="p-4 text-center text-text-secondary">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading boards...
                    </div>
                  ) : filteredBoards.length === 0 ? (
                    <div className="p-4 text-center text-text-secondary">
                      {boardSearchQuery
                        ? "No boards match your search"
                        : selectedProjects.size > 0
                        ? "No boards found for selected projects"
                        : "No boards found"}
                    </div>
                  ) : (
                    filteredBoards.map((board) => (
                      <label
                        key={board.id}
                        className="flex items-center gap-3 p-3 hover:bg-surface-02 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedBoards.has(board.id)}
                          onCheckedChange={() => handleToggleBoard(board)}
                        />
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          {board.type === "kanban" ? (
                            <Kanban className="w-4 h-4 text-iris" />
                          ) : (
                            <ListTodo className="w-4 h-4 text-jade" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-text-primary">{board.name}</div>
                            <div className="text-xs text-text-secondary">
                              {board.projectKey && `${board.projectKey} • `}
                              {board.type} board
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={board.type === "kanban" ? "info" : "default"}
                          className="text-xs"
                        >
                          {board.type}
                        </Badge>
                      </label>
                    ))
                  )}
                </div>

                <p className="text-xs text-text-tertiary">
                  Scrum boards sync to Quality Gate & Horizon. Kanban boards sync to Kanban view.
                </p>
              </div>
            )}
          </div>

          {/* Sync Filters */}
          <div className="bg-surface-01 border border-border rounded-lg p-5 space-y-4">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-tertiary" />
                <h3 className="text-sm font-semibold text-text-primary">Sync Filters</h3>
              </div>
              {showAdvancedFilters ? (
                <ChevronUp className="w-4 h-4 text-text-tertiary" />
              ) : (
                <ChevronDown className="w-4 h-4 text-text-tertiary" />
              )}
            </button>

            {/* Quick Summary */}
            {!showAdvancedFilters && (
              <div className="text-sm text-text-secondary">
                {selectedIssueTypes.size} issue types • {DATE_RANGE_PRESETS.find((p) => p.value === dateRangePreset)?.label}
              </div>
            )}

            {showAdvancedFilters && (
              <div className="space-y-4 pt-2 border-t border-border">
                {/* Issue Types */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-text-primary">Issue Types</label>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSelectAllIssueTypes}
                        className="text-xs text-iris hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        onClick={handleClearIssueTypes}
                        className="text-xs text-text-tertiary hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ALL_ISSUE_TYPES.map((type) => (
                      <label
                        key={type.value}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                          cursor-pointer transition-colors border
                          ${
                            selectedIssueTypes.has(type.value)
                              ? "bg-iris-dim border-iris text-iris"
                              : "bg-surface-02 border-border text-text-secondary hover:border-text-tertiary"
                          }
                        `}
                      >
                        <Checkbox
                          checked={selectedIssueTypes.has(type.value)}
                          onCheckedChange={() => handleToggleIssueType(type.value)}
                          className="w-3 h-3"
                        />
                        {type.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">
                    Date Range
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-text-tertiary" />
                    <Select value={dateRangePreset} onValueChange={setDateRangePreset}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_RANGE_PRESETS.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    Only sync items updated within this time range
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sync Actions */}
          <div className="bg-surface-01 border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Sync Actions</h3>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-text-primary">Automatic sync</div>
                <div className="text-xs text-text-secondary">Sync every 15 minutes</div>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>

            <div className="pt-4 border-t border-border flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => handleSync(false)}
                isLoading={syncMutation.isPending}
                leftIcon={
                  syncMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )
                }
              >
                {syncMutation.isPending ? "Syncing..." : "Sync with Filters"}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSync(true)}
                isLoading={syncMutation.isPending}
                leftIcon={
                  syncMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )
                }
              >
                {syncMutation.isPending ? "Syncing..." : "Full Sync"}
              </Button>
              {siteUrl && (
                <Button
                  variant="ghost"
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                  onClick={() => window.open(siteUrl, "_blank")}
                >
                  Open JIRA
                </Button>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-surface-01 border border-coral/30 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-coral mb-2">Danger Zone</h3>
            <p className="text-xs text-text-secondary mb-4">
              Disconnecting will stop syncing and remove stored JIRA credentials. Your data in FORGE
              will not be deleted.
            </p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDisconnectDialog(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Disconnect JIRA
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-xl">
          <div className="bg-surface-01 border border-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-03 flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Connect to JIRA</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">
              Connect your Atlassian JIRA instance to automatically sync stories, tasks, objectives,
              and enable AI-powered quality scoring.
            </p>
            <Button onClick={handleConnect}>
              <Link2 className="w-4 h-4 mr-1" />
              Connect JIRA Account
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
        title="Disconnect JIRA?"
        description="This will stop syncing and remove your JIRA credentials. Your existing data in FORGE will not be deleted."
        confirmLabel="Disconnect"
        variant="danger"
        onConfirm={handleDisconnect}
      />
    </motion.div>
  );
}
