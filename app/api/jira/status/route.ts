import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getJiraConnectionStatus } from "@/lib/jira/auth";
import { getJiraSyncStatus } from "@/lib/jira/sync";

// Get JIRA connection status
export async function GET(req: NextRequest) {
  try {
    // Get user session
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's workspace
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 400 }
      );
    }

    const workspaceId = (membership as { workspace_id: string }).workspace_id;

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
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
