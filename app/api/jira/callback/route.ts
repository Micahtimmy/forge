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
    console.log("JIRA callback: exchanging code for tokens...");

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    console.log("JIRA callback: tokens received, scopes:", tokens.scope);

    // Get accessible resources (JIRA sites)
    console.log("JIRA callback: fetching accessible resources...");
    const resources = await JiraClient.getAccessibleResources(
      tokens.access_token
    );
    console.log("JIRA callback: found", resources.length, "resources");

    if (resources.length === 0) {
      return NextResponse.redirect(
        new URL("/settings/jira?error=no_sites_found", req.url)
      );
    }

    // Use first resource (in production, might show selector for multiple sites)
    const selectedResource = resources[0];
    console.log("JIRA callback: using site", selectedResource.name, selectedResource.id);

    // Store tokens
    console.log("JIRA callback: storing tokens for workspace", workspaceId);
    await storeJiraTokens(workspaceId, tokens, selectedResource);
    console.log("JIRA callback: tokens stored successfully!");

    // Clear OAuth cookies
    const response = NextResponse.redirect(
      new URL("/settings/jira?success=connected", req.url)
    );
    response.cookies.delete("jira_oauth_state");
    response.cookies.delete("jira_workspace_id");

    return response;
  } catch (error) {
    console.error("JIRA callback error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("JIRA callback error details:", errorMessage);
    return NextResponse.redirect(
      new URL(
        `/settings/jira?error=token_exchange_failed&message=${encodeURIComponent(errorMessage)}`,
        req.url
      )
    );
  }
}
