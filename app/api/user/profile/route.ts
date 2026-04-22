import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Try with user client first
    let { data: profile, error: profileError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        display_name,
        role,
        workspace_id,
        workspaces (
          id,
          name
        )
      `)
      .eq("id", user.id)
      .single();

    // If RLS blocks the query, try with admin client
    if (profileError && profileError.code !== "PGRST116") {
      const adminClient = createSupabaseAdminClient();
      const result = await adminClient
        .from("users")
        .select(`
          id,
          email,
          display_name,
          role,
          workspace_id,
          workspaces (
            id,
            name
          )
        `)
        .eq("id", user.id)
        .single();

      profile = result.data;
      profileError = result.error;
    }

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found", debug: { userId: user.id, error: profileError?.message } },
        { status: 404 }
      );
    }

    const workspace = profile.workspaces as { id: string; name: string } | null;

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      role: profile.role || "pm",
      workspaceId: profile.workspace_id,
      workspaceName: workspace?.name || "Workspace",
    });
  } catch (error) {
    console.error("User profile API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
