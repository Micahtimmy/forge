/**
 * Microsoft Teams OAuth - Initiate flow
 * GET /api/notifications/teams/auth
 */

import { NextResponse } from 'next/server';
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from '@/lib/api/auth';

const TEAMS_CLIENT_ID = process.env.TEAMS_CLIENT_ID;
const TEAMS_REDIRECT_URI = process.env.TEAMS_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/teams/callback`;

const TEAMS_SCOPES = [
  'https://graph.microsoft.com/ChannelMessage.Send',
  'https://graph.microsoft.com/Channel.ReadBasic.All',
  'https://graph.microsoft.com/Team.ReadBasic.All',
  'https://graph.microsoft.com/User.Read',
  'offline_access',
].join(' ');

export async function GET() {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { user, workspaceId } = auth.context;

    if (!TEAMS_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Teams integration not configured' },
        { status: 503 }
      );
    }

    // Generate state for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        workspaceId,
        userId: user.id,
        timestamp: Date.now(),
      })
    ).toString('base64url');

    // Use common endpoint for multi-tenant
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', TEAMS_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', TEAMS_REDIRECT_URI);
    authUrl.searchParams.set('scope', TEAMS_SCOPES);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_mode', 'query');

    return NextResponse.json({ url: authUrl.toString() });
  } catch (error) {
    console.error('Teams auth error:', error);
    Sentry.captureException(error, { tags: { api: "notifications-teams-auth" } });
    return NextResponse.json(
      { error: 'Failed to initiate Teams authentication' },
      { status: 500 }
    );
  }
}
