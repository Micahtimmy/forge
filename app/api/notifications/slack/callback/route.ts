/**
 * Slack OAuth - Callback handler
 * GET /api/notifications/slack/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUntypedAdminClient } from '@/lib/db/client';

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/slack/callback`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SlackOAuthResponse {
  ok: boolean;
  error?: string;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: {
    id: string;
    name: string;
  };
  authed_user: {
    id: string;
  };
  incoming_webhook?: {
    channel: string;
    channel_id: string;
    configuration_url: string;
    url: string;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle user denial
  if (error) {
    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?error=slack_denied&message=${encodeURIComponent(error)}`
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
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID!,
        client_secret: SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: SLACK_REDIRECT_URI,
      }),
    });

    const tokenData: SlackOAuthResponse = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error('Slack OAuth error:', tokenData.error);
      return NextResponse.redirect(
        `${APP_URL}/settings/integrations?error=slack_oauth_failed&message=${encodeURIComponent(tokenData.error || 'Unknown error')}`
      );
    }

    const supabase = createUntypedAdminClient();

    // Upsert Slack integration
    const { error: dbError } = await supabase
      .from('slack_integrations')
      .upsert(
        {
          workspace_id: workspaceId,
          team_id: tokenData.team.id,
          team_name: tokenData.team.name,
          access_token: tokenData.access_token,
          bot_user_id: tokenData.bot_user_id,
          default_channel_id: tokenData.incoming_webhook?.channel_id || null,
          default_channel_name: tokenData.incoming_webhook?.channel || null,
          webhook_url: tokenData.incoming_webhook?.url || null,
          scopes: tokenData.scope.split(','),
          installed_by: userId,
          installed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id' }
      );

    if (dbError) {
      console.error('Failed to save Slack integration:', dbError);
      return NextResponse.redirect(
        `${APP_URL}/settings/integrations?error=save_failed`
      );
    }

    // Try to map the installing user to their Slack ID
    try {
      const userInfoResponse = await fetch(
        `https://slack.com/api/users.info?user=${tokenData.authed_user.id}`,
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );
      const userInfo = await userInfoResponse.json();

      if (userInfo.ok && userInfo.user) {
        await supabase.from('user_slack_mappings').upsert(
          {
            workspace_id: workspaceId,
            user_id: userId,
            slack_user_id: tokenData.authed_user.id,
            slack_username: userInfo.user.name,
          },
          { onConflict: 'workspace_id,user_id' }
        );
      }
    } catch {
      // Non-critical, continue without user mapping
    }

    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?success=slack_connected&team=${encodeURIComponent(tokenData.team.name)}`
    );
  } catch (error) {
    console.error('Slack callback error:', error);
    return NextResponse.redirect(
      `${APP_URL}/settings/integrations?error=callback_failed`
    );
  }
}
