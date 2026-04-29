"use client";

import { useState, useEffect } from "react";
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
  useJiraStatus,
  useJiraSync,
  useJiraDisconnect,
  useJiraProjects,
  useUpdateJiraProjects,
  JiraProject,
} from "@/hooks/use-jira";
import { fadeIn } from "@/lib/motion/variants";

export default function JiraSettingsPage() {
  const router = useRouter();
  const toast = useToastActions();

  const { data: status, isLoading, error } = useJiraStatus();
  const { data: projectsData, isLoading: projectsLoading } = useJiraProjects();
  const syncMutation = useJiraSync();
  const disconnectMutation = useJiraDisconnect();
  const updateProjectsMutation = useUpdateJiraProjects();

  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<Map<string, JiraProject>>(new Map());
  const [showProjectSelector, setShowProjectSelector] = useState(false);

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
    // Get selected project keys
    const projectKeys = Array.from(selectedProjects.keys());

    if (projectKeys.length === 0) {
      toast.error("No projects selected", "Please select at least one project to sync");
      setShowProjectSelector(true);
      return;
    }

    try {
      const result = await syncMutation.mutateAsync(fullSync);
      toast.success("Sync complete", `Synced ${result.stories?.synced ?? 0} stories from JIRA`);
    } catch (err) {
      toast.error("Sync failed", err instanceof Error ? err.message : "Unknown error");
    }
  };

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

  const filteredProjects = projectsData?.projects?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
        <div className="max-w-xl space-y-6">
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
        title="JIRA Connection"
        subtitle="Connect your Atlassian JIRA instance to sync stories"
      />

      {isConnected ? (
        <div className="max-w-xl space-y-6">
          {/* Connection Status */}
          <div className="bg-surface-01 border border-border rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-md bg-jade-dim">
                  <CheckCircle2 className="w-5 h-5 text-jade" />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    Connected to JIRA
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    {siteName}
                  </div>
                </div>
              </div>
              <Badge variant="excellent">Connected</Badge>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-text-tertiary">Last synced</div>
                  <div className="text-text-primary font-medium">
                    {status?.lastSyncAt
                      ? formatDistanceToNow(new Date(status.lastSyncAt), { addSuffix: true })
                      : "Never"}
                  </div>
                </div>
                <div>
                  <div className="text-text-tertiary">Stories synced</div>
                  <div className="text-text-primary font-medium">{status?.storiesSynced || 0} stories</div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Selection */}
          <div className="bg-surface-01 border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                Projects to Sync
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowProjectSelector(!showProjectSelector)}
              >
                <FolderKanban className="w-4 h-4 mr-1" />
                {showProjectSelector ? "Hide" : "Select Projects"}
              </Button>
            </div>

            {/* Selected Projects Summary */}
            {selectedProjects.size > 0 && !showProjectSelector && (
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedProjects.values()).map((project) => (
                  <Badge key={project.key} variant="default" className="text-xs">
                    {project.key}: {project.name}
                  </Badge>
                ))}
              </div>
            )}

            {selectedProjects.size === 0 && !showProjectSelector && (
              <p className="text-sm text-text-secondary">
                No projects selected. Click &quot;Select Projects&quot; to choose which JIRA projects to sync.
              </p>
            )}

            {/* Project Selector */}
            {showProjectSelector && (
              <div className="space-y-3 pt-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
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
                      No projects found
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
                          <div className="text-sm font-medium text-text-primary">
                            {project.name}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {project.key} • {project.projectTypeKey}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                {/* Selection Summary & Save */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-text-secondary">
                    {selectedProjects.size} project(s) selected
                  </span>
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

          {/* Sync Settings */}
          <div className="bg-surface-01 border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">
              Sync Settings
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-text-primary">Automatic sync</div>
                <div className="text-xs text-text-secondary">
                  Sync stories every 15 minutes
                </div>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>

            <div className="pt-4 border-t border-border flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => handleSync(false)}
                isLoading={syncMutation.isPending}
                leftIcon={syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              >
                {syncMutation.isPending ? "Syncing..." : "Sync Recent"}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSync(true)}
                isLoading={syncMutation.isPending}
                leftIcon={syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
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
          <div className="bg-surface-01 border border-coral-border rounded-lg p-5">
            <h3 className="text-sm font-semibold text-coral mb-2">Danger Zone</h3>
            <p className="text-xs text-text-secondary mb-4">
              Disconnecting will stop syncing stories and remove stored JIRA
              credentials. Your data in FORGE will not be deleted.
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
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Connect to JIRA
            </h3>
            <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">
              Connect your Atlassian JIRA instance to automatically sync user
              stories and enable AI-powered quality scoring.
            </p>
            <Button onClick={handleConnect}>
              <Link2 className="w-4 h-4 mr-1" />
              Connect JIRA Account
            </Button>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation */}
      <ConfirmDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
        title="Disconnect JIRA?"
        description="This will stop syncing stories and remove your JIRA credentials. Your existing data in FORGE will not be deleted."
        confirmLabel="Disconnect"
        variant="danger"
        onConfirm={handleDisconnect}
      />
    </motion.div>
  );
}
