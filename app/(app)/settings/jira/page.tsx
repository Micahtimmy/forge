"use client";

import { useState } from "react";
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
import { useJiraStatus, useJiraSync, useJiraDisconnect } from "@/hooks/use-jira";
import { fadeIn } from "@/lib/motion/variants";

export default function JiraSettingsPage() {
  const router = useRouter();
  const toast = useToastActions();

  const { data: status, isLoading, error } = useJiraStatus();
  const syncMutation = useJiraSync();
  const disconnectMutation = useJiraDisconnect();

  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const isConnected = status?.connected ?? false;
  const siteName = status?.siteName || "JIRA";
  const siteUrl = status?.siteUrl || "";

  const handleConnect = () => {
    window.location.href = "/api/jira/auth";
  };

  const handleSync = async (fullSync: boolean = false) => {
    try {
      const result = await syncMutation.mutateAsync(fullSync);
      toast.success("Sync complete", `Synced ${result.stories?.synced ?? 0} stories from JIRA`);
    } catch (err) {
      toast.error("Sync failed", err instanceof Error ? err.message : "Unknown error");
    }
  };

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
