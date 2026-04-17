import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createUntypedServerClient } from "@/lib/db/client";

interface InvitationRow {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  invited_by: string;
  workspace_id: string;
  workspaces: { name: string } | null;
  users: { full_name: string | null } | null;
}

// GET - Validate invite token
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token required" },
        { status: 400 }
      );
    }

    // Use untyped client since team_invitations may not be in types
    const supabase = createUntypedServerClient();

    // Find invitation
    const { data: invitation, error } = await supabase
      .from("team_invitations")
      .select(`
        id,
        email,
        role,
        status,
        expires_at,
        invited_by,
        workspace_id,
        workspaces (name),
        users!team_invitations_invited_by_fkey (full_name)
      `)
      .eq("token", token)
      .single() as { data: InvitationRow | null; error: unknown };

    if (error || !invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "This invitation has expired" },
        { status: 410 }
      );
    }

    // Check if already accepted
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "This invitation has already been used" },
        { status: 410 }
      );
    }

    const workspace = invitation.workspaces;
    const inviter = invitation.users;

    return NextResponse.json({
      success: true,
      invite: {
        email: invitation.email,
        role: invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1),
        workspaceName: workspace?.name || "Unknown Workspace",
        inviterName: inviter?.full_name || "A team member",
      },
    });
  } catch (error) {
    console.error("Validate invite error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate invitation" },
      { status: 500 }
    );
  }
}

interface InvitationBasicRow {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  workspace_id: string;
}

// POST - Accept invite
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const untypedSupabase = createUntypedServerClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Please sign in to accept this invitation" },
        { status: 401 }
      );
    }

    // Find invitation
    const { data: invitation, error: inviteError } = await untypedSupabase
      .from("team_invitations")
      .select("id, email, role, status, expires_at, workspace_id")
      .eq("token", token)
      .single() as { data: InvitationBasicRow | null; error: unknown };

    if (inviteError || !invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Verify email matches
    if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: `This invitation was sent to ${invitation.email}. Please sign in with that email.`,
        },
        { status: 403 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "This invitation has expired" },
        { status: 410 }
      );
    }

    // Check if already accepted
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "This invitation has already been used" },
        { status: 410 }
      );
    }

    // Update user's workspace
    const { error: updateError } = await untypedSupabase
      .from("users")
      .update({
        workspace_id: invitation.workspace_id,
        role: invitation.role,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update user:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to join workspace" },
        { status: 500 }
      );
    }

    // Mark invitation as accepted
    await untypedSupabase
      .from("team_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    return NextResponse.json({
      success: true,
      message: "Successfully joined workspace",
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
