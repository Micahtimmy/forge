import { createClient } from "@supabase/supabase-js";
import type { JiraAccessToken, JiraCloudResource } from "@/types/jira";
import { JiraClient } from "./client";
import { encryptIfConfigured, decryptIfEncrypted } from "@/lib/utils/crypto";

// OAuth 2.0 configuration
const JIRA_AUTH_URL = "https://auth.atlassian.com/authorize";
const JIRA_TOKEN_URL = "https://auth.atlassian.com/oauth/token";

// Required scopes for FORGE functionality
const JIRA_SCOPES = [
  "read:jira-work",
  "read:jira-user",
  "write:jira-work",
  "read:sprint:jira-software",
  "read:board-scope:jira-software",
  "read:project:jira",
  "offline_access", // For refresh tokens
].join(" ");

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

// Generate OAuth authorization URL
export function getJiraAuthUrl(state: string): string {
  const params = new URLSearchParams({
    audience: "api.atlassian.com",
    client_id: process.env.JIRA_CLIENT_ID!,
    scope: JIRA_SCOPES,
    redirect_uri: process.env.JIRA_REDIRECT_URI!,
    state,
    response_type: "code",
    prompt: "consent",
  });

  return `${JIRA_AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string
): Promise<TokenResponse> {
  const response = await fetch(JIRA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: process.env.JIRA_CLIENT_ID,
      client_secret: process.env.JIRA_CLIENT_SECRET,
      code,
      redirect_uri: process.env.JIRA_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
  }

  return response.json();
}

// Refresh access token
export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const response = await fetch(JIRA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: process.env.JIRA_CLIENT_ID,
      client_secret: process.env.JIRA_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
  }

  return response.json();
}

// Store JIRA tokens for a workspace
export async function storeJiraTokens(
  workspaceId: string,
  tokens: TokenResponse,
  cloudResource: JiraCloudResource
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  const { error } = await supabase.from("jira_connections").upsert(
    {
      workspace_id: workspaceId,
      cloud_id: cloudResource.id,
      site_url: cloudResource.url,
      site_name: cloudResource.name,
      access_token: encryptIfConfigured(tokens.access_token),
      refresh_token: encryptIfConfigured(tokens.refresh_token),
      expires_at: expiresAt.toISOString(),
      scopes: tokens.scope.split(" "),
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "workspace_id",
    }
  );

  if (error) {
    throw new Error(`Failed to store JIRA tokens: ${error.message}`);
  }
}

// Get valid JIRA tokens for a workspace (refresh if needed)
export async function getValidJiraTokens(
  workspaceId: string
): Promise<JiraAccessToken | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: connection, error } = await supabase
    .from("jira_connections")
    .select(
      "access_token, refresh_token, expires_at, cloud_id, site_url"
    )
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !connection) {
    return null;
  }

  const expiresAt = new Date(connection.expires_at);
  const now = new Date();

  // Decrypt tokens (handles both encrypted and plaintext for backward compatibility)
  const accessToken = decryptIfEncrypted(connection.access_token);
  const refreshToken = decryptIfEncrypted(connection.refresh_token);

  // Refresh if token expires in less than 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    try {
      const newTokens = await refreshAccessToken(refreshToken);
      const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

      // Update stored tokens (encrypted)
      await supabase
        .from("jira_connections")
        .update({
          access_token: encryptIfConfigured(newTokens.access_token),
          refresh_token: encryptIfConfigured(newTokens.refresh_token || refreshToken),
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", workspaceId);

      return {
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || refreshToken,
        expiresAt: newExpiresAt,
        cloudId: connection.cloud_id,
        siteUrl: connection.site_url,
      };
    } catch (error) {
      console.error("Failed to refresh JIRA token:", error);
      // Token might be revoked - connection should be re-established
      return null;
    }
  }

  return {
    accessToken,
    refreshToken,
    expiresAt,
    cloudId: connection.cloud_id,
    siteUrl: connection.site_url,
  };
}

// Create authenticated JIRA client for a workspace
export async function getJiraClientForWorkspace(
  workspaceId: string
): Promise<JiraClient | null> {
  const tokens = await getValidJiraTokens(workspaceId);
  if (!tokens) {
    return null;
  }

  return new JiraClient({
    accessToken: tokens.accessToken,
    cloudId: tokens.cloudId,
    siteUrl: tokens.siteUrl,
  });
}

// Remove JIRA connection for a workspace
export async function disconnectJira(workspaceId: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("jira_connections")
    .delete()
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error(`Failed to disconnect JIRA: ${error.message}`);
  }
}

// Check if workspace has JIRA connection
export async function hasJiraConnection(
  workspaceId: string
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("jira_connections")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .single();

  return !error && !!data;
}

// Get connection status
export async function getJiraConnectionStatus(
  workspaceId: string
): Promise<{
  connected: boolean;
  siteName: string | null;
  siteUrl: string | null;
  connectedAt: Date | null;
  lastSyncAt: Date | null;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: connection, error } = await supabase
    .from("jira_connections")
    .select("site_name, site_url, connected_at, last_sync_at")
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !connection) {
    return {
      connected: false,
      siteName: null,
      siteUrl: null,
      connectedAt: null,
      lastSyncAt: null,
    };
  }

  return {
    connected: true,
    siteName: connection.site_name,
    siteUrl: connection.site_url,
    connectedAt: connection.connected_at ? new Date(connection.connected_at) : null,
    lastSyncAt: connection.last_sync_at ? new Date(connection.last_sync_at) : null,
  };
}
