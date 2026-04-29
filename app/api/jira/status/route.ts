import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getJiraConnectionStatus } from "@/lib/jira/auth";
import { getJiraSyncStatus } from "@/lib/jira/sync";

// Get JIRA connection status
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    // Get user session
    const supabase = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's workspace - use admin client to bypass RLS
    let workspaceId: string | null = null;

    // Try workspace_members first
    const { data: membership } = await adminClient
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .single();

    if (membership?.workspace_id) {
      workspaceId = membership.workspace_id;
    } else {
      // Fall back to users table
      const { data: userProfile } = await adminClient
        .from("users")
        .select("workspace_id")
        .eq("id", user.id)
        .single();

      if (userProfile?.workspace_id) {
        workspaceId = userProfile.workspace_id;
      }
    }

    if (!workspaceId) {
      // Return disconnected status instead of error for better UX
      return NextResponse.json({
        connected: false,
        siteName: null,
        siteUrl: null,
        connectedAt: null,
        lastSyncAt: null,
        lastSyncStatus: null,
        lastSyncError: null,
        storiesSynced: 0,
      });
    }

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
