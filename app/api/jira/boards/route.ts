import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getJiraClientForWorkspace } from "@/lib/jira/auth";

// Get ALL JIRA boards the user has access to
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const adminClient = createSupabaseAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's workspace
    let workspaceId: string | null = null;

    const { data: membership } = await adminClient
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .single();

    if (membership?.workspace_id) {
      workspaceId = membership.workspace_id;
    } else {
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
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 400 }
      );
    }

    // Get JIRA client
    const client = await getJiraClientForWorkspace(workspaceId);
    if (!client) {
      return NextResponse.json(
        { error: "JIRA not connected" },
        { status: 400 }
      );
    }

    // Fetch ALL boards
    console.log("Fetching all JIRA boards...");
    const boards = await client.getBoards();

    const allBoards = boards.map((board) => ({
      id: board.id,
      name: board.name,
      type: board.type,
      projectKey: board.location?.projectKey || null,
      projectName: board.location?.projectName || null,
    }));

    console.log(`Found ${allBoards.length} boards total`);

    return NextResponse.json({
      boards: allBoards,
      total: allBoards.length,
    });
  } catch (error) {
    console.error("Failed to fetch JIRA boards:", error);
    Sentry.captureException(error, { tags: { api: "jira-boards" } });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch boards",
      },
      { status: 500 }
    );
  }
}
