/**
 * Microsoft Teams OAuth - Callback handler
 * GET /api/notifications/teams/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from "@sentry/nextjs";
import { createUntypedAdminClient } from '@/lib/db/client';

const TEAMS_CLIENT_ID = process.env.TEAMS_CLIENT_ID;
const TEAMS_CLIENT_SECRET = process.env.TEAMS_CLIENT_SECRET;
const TEAMS_REDIRECT_URI = process.env.TEAMS_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/teams/callback`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token: string;
  id_token?: string;
}

interface GraphUser {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName: string;
}

interface GraphTeam {
  id: string;
  displayName: string;
  description?: string;
}

interface GraphChannel {
  id: string;
  displayName: string;
  description?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle user denial or error
  if (error) {
    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?error=teams_denied&message=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?error=missing_params`
    );
  }

  try {
    // Decode and validate state
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    const { workspaceId, userId, timestamp } = stateData;

    // Check state is not too old (15 minutes)
    if (Date.now() - timestamp > 15 * 60 * 1000) {
      return NextResponse.redirect(
        `${APP_URL}/settings/integrations?error=state_expired`
      );
    }

    if (!workspaceId || !userId) {
      return NextResponse.redirect(
        `${APP_URL}/settings/integrations?error=invalid_state`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: TEAMS_CLIENT_ID!,
          client_secret: TEAMS_CLIENT_SECRET!,
          code,
          redirect_uri: TEAMS_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      }
    );

    const tokenData: TokenResponse = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Teams OAuth error:', tokenData);
      return NextResponse.redirect(
        `${APP_URL}/settings/integrations?error=teams_oauth_failed`
      );
    }

    // Get user info
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData: GraphUser = await userResponse.json();

    // Extract tenant ID from the id_token or user's domain
    let tenantId = 'common';
    if (tokenData.id_token) {
      try {
        const payload = JSON.parse(
          Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString()
        );
        tenantId = payload.tid || 'common';
      } catch {
        // Use common if we can't extract tenant
      }
    }

    // Get user's joined teams
    const teamsResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me/joinedTeams',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    const teamsData = await teamsResponse.json();
    const teams: GraphTeam[] = teamsData.value || [];

    // Default to first team if available
    let defaultTeam: GraphTeam | null = teams[0] || null;
    let defaultChannel: GraphChannel | null = null;

    // Get General channel of first team
    if (defaultTeam) {
      const channelsResponse = await fetch(
        `https://graph.microsoft.com/v1.0/teams/${defaultTeam.id}/channels`,
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );
      const channelsData = await channelsResponse.json();
      const channels: GraphChannel[] = channelsData.value || [];

      // Find General channel or use first channel
      defaultChannel =
        channels.find(c => c.displayName === 'General') ||
        channels[0] ||
        null;
    }

    const supabase = createUntypedAdminClient();

    // Calculate token expiry
    const tokenExpiresAt = new Date(
      Date.now() + tokenData.expires_in * 1000
    ).toISOString();

    // Upsert Teams integration
    const { error: dbError } = await supabase
      .from('teams_integrations')
      .upsert(
        {
          workspace_id: workspaceId,
          tenant_id: tenantId,
          team_id: defaultTeam?.id || '',
          team_name: defaultTeam?.displayName || 'Unknown Team',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: tokenExpiresAt,
          default_channel_id: defaultChannel?.id || null,
          default_channel_name: defaultChannel?.displayName || null,
          installed_by: userId,
          installed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id' }
      );

    if (dbError) {
      console.error('Failed to save Teams integration:', dbError);
      return NextResponse.redirect(
        `${APP_URL}/settings/integrations?error=save_failed`
      );
    }

    // Map the installing user to their Teams ID
    await supabase.from('user_teams_mappings').upsert(
      {
        workspace_id: workspaceId,
        user_id: userId,
        teams_user_id: userData.id,
        teams_email: userData.mail || userData.userPrincipalName,
      },
      { onConflict: 'workspace_id,user_id' }
    );

    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?success=teams_connected&team=${encodeURIComponent(defaultTeam?.displayName || 'Teams')}`
    );
  } catch (error) {
    console.error('Teams callback error:', error);
    Sentry.captureException(error, { tags: { api: "notifications-teams-callback" } });
    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?error=callback_failed`
    );
  }
}
