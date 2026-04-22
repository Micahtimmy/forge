import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getJiraAuthUrl } from "@/lib/jira/auth";
import { nanoid } from "nanoid";

// Initiate JIRA OAuth flow
export async function GET(req: NextRequest) {
  try {
    // Get user session
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?redirect=/settings/jira", req.url)
      );
    }

    // Get user's workspace - try workspace_members first, fall back to users table
    let workspaceId: string | null = null;

    // Try workspace_members table first
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .single();

    if (membership?.workspace_id) {
      workspaceId = membership.workspace_id;
    } else {
      // Fall back to users table
      const { data: userProfile } = await supabase
        .from("users")
        .select("workspace_id")
        .eq("id", user.id)
        .single();

      if (userProfile?.workspace_id) {
        workspaceId = userProfile.workspace_id;

        // Auto-create workspace membership for users who onboarded before this fix
        await supabase
          .from("workspace_members")
          .upsert({
            workspace_id: userProfile.workspace_id,
            user_id: user.id,
            role: "owner",
          }, {
            onConflict: "workspace_id,user_id",
          });
      }
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "No workspace found. Please complete onboarding first." },
        { status: 400 }
      );
    }

    // Generate state token for CSRF protection
    const state = nanoid(32);

    // Store state in cookie for verification
    const response = NextResponse.redirect(getJiraAuthUrl(state));
    response.cookies.set("jira_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });
    response.cookies.set("jira_workspace_id", workspaceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("JIRA auth initiation error:", error);
    return NextResponse.redirect(
      new URL("/settings/jira?error=auth_failed", req.url)
    );
  }
}
