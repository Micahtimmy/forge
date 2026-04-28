/**
 * Team Management Database Queries
 * Handles workspace members, invitations, and team structure
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

/**
 * Get all members of a workspace with their user details
 */
export async function getWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMember[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      `
      id,
      user_id,
      role,
      created_at,
      users (
        id,
        email,
        full_name,
        display_name,
        avatar_url
      )
    `
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Team] Failed to fetch workspace members:", error);
    throw new Error(`Failed to fetch team members: ${error.message}`);
  }

  return (data || []).map((member) => {
    // TypeScript doesn't know the shape of the joined users table
    const user = member.users as {
      id: string;
      email: string;
      full_name: string | null;
      display_name: string | null;
      avatar_url: string | null;
    } | null;

    return {
      id: member.id,
      userId: member.user_id,
      role: member.role as WorkspaceMember["role"],
      joinedAt: member.created_at,
      user: {
        id: user?.id || member.user_id,
        email: user?.email || "Unknown",
        fullName: user?.full_name || null,
        displayName: user?.display_name || null,
        avatarUrl: user?.avatar_url || null,
      },
    };
  });
}

/**
 * Update a member's role in the workspace
 */
export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: "admin" | "member" | "viewer"
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Verify the member belongs to this workspace
  const { data: member, error: fetchError } = await supabase
    .from("workspace_members")
    .select("id, role")
    .eq("id", memberId)
    .eq("workspace_id", workspaceId)
    .single();

  if (fetchError || !member) {
    throw new Error("Member not found in this workspace");
  }

  // Cannot change owner role via this function
  if (member.role === "owner") {
    throw new Error("Cannot change owner role");
  }

  const { error: updateError } = await supabase
    .from("workspace_members")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("workspace_id", workspaceId);

  if (updateError) {
    console.error("[Team] Failed to update member role:", updateError);
    throw new Error(`Failed to update role: ${updateError.message}`);
  }
}

/**
 * Remove a member from the workspace
 */
export async function removeMember(
  workspaceId: string,
  memberId: string
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Verify the member belongs to this workspace and is not the owner
  const { data: member, error: fetchError } = await supabase
    .from("workspace_members")
    .select("id, role, user_id")
    .eq("id", memberId)
    .eq("workspace_id", workspaceId)
    .single();

  if (fetchError || !member) {
    throw new Error("Member not found in this workspace");
  }

  if (member.role === "owner") {
    throw new Error("Cannot remove workspace owner");
  }

  // Remove the membership
  const { error: deleteError } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId)
    .eq("workspace_id", workspaceId);

  if (deleteError) {
    console.error("[Team] Failed to remove member:", deleteError);
    throw new Error(`Failed to remove member: ${deleteError.message}`);
  }

  // Also clear their workspace_id in the users table
  await supabase
    .from("users")
    .update({ workspace_id: null })
    .eq("id", member.user_id);
}

/**
 * Get the count of members in a workspace
 */
export async function getMemberCount(workspaceId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();

  const { count, error } = await supabase
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("[Team] Failed to count members:", error);
    return 0;
  }

  return count || 0;
}
