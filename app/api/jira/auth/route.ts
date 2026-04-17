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
