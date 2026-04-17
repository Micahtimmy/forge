import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForTokens,
  storeJiraTokens,
} from "@/lib/jira/auth";
import { JiraClient } from "@/lib/jira/client";

// Handle JIRA OAuth callback
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("JIRA OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/settings/jira?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || "")}`,
        req.url
      )
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/settings/jira?error=missing_params", req.url)
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("jira_oauth_state")?.value;
  const workspaceId = cookieStore.get("jira_workspace_id")?.value;

  // Verify state token
  if (!storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/settings/jira?error=invalid_state", req.url)
    );
  }

  if (!workspaceId) {
    return NextResponse.redirect(
      new URL("/settings/jira?error=no_workspace", req.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get accessible resources (JIRA sites)
    const resources = await JiraClient.getAccessibleResources(
      tokens.access_token
    );

    if (resources.length === 0) {
      return NextResponse.redirect(
        new URL("/settings/jira?error=no_sites_found", req.url)
      );
    }

    // Use first resource (in production, might show selector for multiple sites)
    const selectedResource = resources[0];

    // Store tokens
    await storeJiraTokens(workspaceId, tokens, selectedResource);

    // Clear OAuth cookies
    const response = NextResponse.redirect(
      new URL("/settings/jira?success=connected", req.url)
    );
    response.cookies.delete("jira_oauth_state");
    response.cookies.delete("jira_workspace_id");

    return response;
  } catch (error) {
    console.error("JIRA callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/settings/jira?error=token_exchange_failed&message=${encodeURIComponent(error instanceof Error ? error.message : "Unknown error")}`,
        req.url
      )
    );
  }
}
