import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createUntypedServerClient } from "@/lib/db/client";
import { getUserWorkspace } from "@/lib/db/queries/dashboard";
import {
  sendEmail,
  getTeamInviteEmailHtml,
  getTeamInviteEmailText,
} from "@/lib/email/resend";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member", "viewer"]),
});

interface InvitationRecord {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const untypedSupabase = createUntypedServerClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get workspace
    const workspace = await getUserWorkspace(user.id);

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "No workspace found" },
        { status: 404 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validated = inviteSchema.parse(body);

    // Get inviter's name
    const { data: inviterProfile } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const inviterName = inviterProfile?.full_name || user.email || "A team member";

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("users")
      .select("id")
      .eq("email", validated.email)
      .eq("workspace_id", workspace.workspaceId)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: "User is already a member of this workspace" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const { data: existingInvite } = await untypedSupabase
      .from("team_invitations")
      .select("id, created_at")
      .eq("email", validated.email)
      .eq("workspace_id", workspace.workspaceId)
      .eq("status", "pending")
      .single() as { data: { id: string; created_at: string } | null; error: unknown };

    if (existingInvite) {
      // Check if invite is recent (within 24 hours)
      const inviteAge = Date.now() - new Date(existingInvite.created_at).getTime();
      if (inviteAge < 24 * 60 * 60 * 1000) {
        return NextResponse.json(
          { success: false, error: "An invitation was recently sent to this email" },
          { status: 400 }
        );
      }

      // Delete old invitation
      await untypedSupabase
        .from("team_invitations")
        .delete()
        .eq("id", existingInvite.id);
    }

    // Generate invite token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create invitation record
    const { data: invitation, error: inviteError } = await untypedSupabase
      .from("team_invitations")
      .insert({
        workspace_id: workspace.workspaceId,
        email: validated.email,
        role: validated.role,
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: "pending",
      })
      .select()
      .single() as { data: InvitationRecord | null; error: unknown };

    if (inviteError || !invitation) {
      console.error("Failed to create invitation:", inviteError);
      return NextResponse.json(
        { success: false, error: "Failed to create invitation" },
        { status: 500 }
      );
    }

    // Generate invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    // Send invitation email
    try {
      await sendEmail({
        to: validated.email,
        subject: `${inviterName} invited you to join ${workspace.workspaceName} on FORGE`,
        html: getTeamInviteEmailHtml({
          inviterName,
          workspaceName: workspace.workspaceName,
          inviteUrl,
          role: validated.role.charAt(0).toUpperCase() + validated.role.slice(1),
        }),
        text: getTeamInviteEmailText({
          inviterName,
          workspaceName: workspace.workspaceName,
          inviteUrl,
          role: validated.role.charAt(0).toUpperCase() + validated.role.slice(1),
        }),
      });
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Don't fail the request - invitation is created, email just didn't send
      // In production, you might want to retry via background job
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error("Team invite error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

// Resend an invitation
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const untypedSupabase = createUntypedServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const workspace = await getUserWorkspace(user.id);

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "No workspace found" },
        { status: 404 }
      );
    }

    const { invitationId } = await req.json();

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: "Invitation ID required" },
        { status: 400 }
      );
    }

    // Get invitation
    const { data: invitation, error: fetchError } = await untypedSupabase
      .from("team_invitations")
      .select("id, email, role")
      .eq("id", invitationId)
      .eq("workspace_id", workspace.workspaceId)
      .eq("status", "pending")
      .single() as { data: { id: string; email: string; role: string } | null; error: unknown };

    if (fetchError || !invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Get inviter's name
    const { data: inviterProfile } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const inviterName = inviterProfile?.full_name || user.email || "A team member";

    // Regenerate token and extend expiry
    const newToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: updateError } = await untypedSupabase
      .from("team_invitations")
      .update({
        token: newToken,
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", invitationId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update invitation" },
        { status: 500 }
      );
    }

    // Send new email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${newToken}`;

    try {
      await sendEmail({
        to: invitation.email,
        subject: `Reminder: ${inviterName} invited you to join ${workspace.workspaceName} on FORGE`,
        html: getTeamInviteEmailHtml({
          inviterName,
          workspaceName: workspace.workspaceName,
          inviteUrl,
          role: invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1),
        }),
        text: getTeamInviteEmailText({
          inviterName,
          workspaceName: workspace.workspaceName,
          inviteUrl,
          role: invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1),
        }),
      });
    } catch (emailError) {
      console.error("Failed to resend invitation email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Invitation resent",
    });
  } catch (error) {
    console.error("Resend invite error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend invitation" },
      { status: 500 }
    );
  }
}
