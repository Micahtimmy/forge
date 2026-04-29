import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getJiraClientForWorkspace } from "@/lib/jira/auth";

// Get available JIRA projects for the workspace
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

    // Fetch projects from JIRA
    console.log("Fetching JIRA projects for workspace:", workspaceId);
    const projects = await client.getProjects();

    // Get selected projects from database
    const { data: selectedProjects } = await adminClient
      .from("jira_selected_projects")
      .select("project_key, sync_enabled, auto_score")
      .eq("workspace_id", workspaceId);

    const selectedMap = new Map(
      (selectedProjects || []).map((p) => [p.project_key, p])
    );

    // Combine JIRA projects with selection status
    const projectsWithStatus = projects.map((project) => ({
      id: project.id,
      key: project.key,
      name: project.name,
      projectTypeKey: project.projectTypeKey,
      selected: selectedMap.has(project.key),
      syncEnabled: selectedMap.get(project.key)?.sync_enabled ?? false,
      autoScore: selectedMap.get(project.key)?.auto_score ?? true,
    }));

    return NextResponse.json({
      projects: projectsWithStatus,
      total: projects.length,
    });
  } catch (error) {
    console.error("Failed to fetch JIRA projects:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch projects",
      },
      { status: 500 }
    );
  }
}

// Update selected projects for sync
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { projects } = body as {
      projects: Array<{
        key: string;
        name: string;
        syncEnabled: boolean;
        autoScore?: boolean;
      }>;
    };

    if (!projects || !Array.isArray(projects)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Clear existing selections and insert new ones
    await adminClient
      .from("jira_selected_projects")
      .delete()
      .eq("workspace_id", workspaceId);

    if (projects.length > 0) {
      const { error } = await adminClient.from("jira_selected_projects").insert(
        projects.map((p) => ({
          workspace_id: workspaceId,
          project_key: p.key,
          project_name: p.name,
          sync_enabled: p.syncEnabled,
          auto_score: p.autoScore ?? true,
        }))
      );

      if (error) {
        console.error("Failed to save project selections:", error);
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      selectedCount: projects.filter((p) => p.syncEnabled).length,
    });
  } catch (error) {
    console.error("Failed to update JIRA projects:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update projects",
      },
      { status: 500 }
    );
  }
}
