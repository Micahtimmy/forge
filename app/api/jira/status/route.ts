import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { getJiraConnectionStatus } from "@/lib/jira/auth";
import { getJiraSyncStatus } from "@/lib/jira/sync";

// Get JIRA connection status
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      return auth.response;
    }
    const { workspaceId } = auth.context;

    // Get connection and sync status
    const [connectionStatus, syncStatus] = await Promise.all([
      getJiraConnectionStatus(workspaceId),
      getJiraSyncStatus(workspaceId),
    ]);

    return NextResponse.json({
      connected: connectionStatus.connected,
      siteName: connectionStatus.siteName,
      siteUrl: connectionStatus.siteUrl,
      connectedAt: connectionStatus.connectedAt?.toISOString() || null,
      lastSyncAt: syncStatus?.lastSyncAt?.toISOString() || null,
      lastSyncStatus: syncStatus?.lastSyncStatus || null,
      lastSyncError: syncStatus?.lastSyncError || null,
      storiesSynced: syncStatus?.storiesSynced || 0,
    });
  } catch (error) {
    console.error("JIRA status error:", error);
    Sentry.captureException(error, { tags: { api: "jira-status" } });
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
