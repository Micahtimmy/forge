import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from "@/lib/api/auth";
import { getJiraAuthUrl } from "@/lib/jira/auth";
import { nanoid } from "nanoid";

// Initiate JIRA OAuth flow
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) {
      // Redirect to login for GET requests instead of returning JSON
      return NextResponse.redirect(
        new URL("/login?redirect=/settings/jira", req.url)
      );
    }
    const { workspaceId } = auth.context;

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
    Sentry.captureException(error, { tags: { api: "jira-auth" } });
    return NextResponse.redirect(
      new URL("/settings/jira?error=auth_failed", req.url)
    );
  }
}
