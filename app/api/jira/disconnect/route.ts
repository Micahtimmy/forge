import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { disconnectJira } from "@/lib/jira/auth";

// Disconnect JIRA integration
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: NextRequest) {
  try {
    // Get user session
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's workspace and verify admin role
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 400 }
      );
    }

    const typedMembership = membership as { workspace_id: string; role: string };
    const { workspace_id: workspaceId, role } = typedMembership;

    // Only admins can disconnect
    if (role !== "admin" && role !== "owner") {
      return NextResponse.json(
        { error: "Only admins can disconnect JIRA" },
        { status: 403 }
      );
    }

    await disconnectJira(workspaceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("JIRA disconnect error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Disconnect failed" },
      { status: 500 }
    );
  }
}
