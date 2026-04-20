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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeaderCompact } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToastActions } from "@/components/ui/toast";
import { fadeIn } from "@/lib/motion/variants";

export default function JiraSettingsPage() {
  const router = useRouter();
  const toast = useToastActions();

  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  const handleConnect = () => {
    // In real app, this would initiate OAuth flow
    window.location.href = "/api/jira/auth";
  };

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate sync
    await new Promise((r) => setTimeout(r, 2000));
    setIsSyncing(false);
    toast.success("Sync complete", "Synced 47 stories from JIRA");
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setShowDisconnectDialog(false);
    toast.success("Disconnected", "JIRA connection has been removed");
  };

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
                    acme-corp.atlassian.net
                  </div>
                </div>
              </div>
              <Badge variant="excellent">Connected</Badge>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-text-tertiary">Last synced</div>
                  <div className="text-text-primary font-medium">2 minutes ago</div>
                </div>
                <div>
                  <div className="text-text-tertiary">Stories synced</div>
                  <div className="text-text-primary font-medium">47 stories</div>
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
                onClick={handleSync}
                isLoading={isSyncing}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Sync Now
              </Button>
              <Button
                variant="ghost"
                leftIcon={<ExternalLink className="w-4 h-4" />}
                onClick={() => window.open("https://acme-corp.atlassian.net", "_blank")}
              >
                Open JIRA
              </Button>
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
