/**
 * Slack OAuth - Initiate flow
 * GET /api/notifications/slack/auth
 */

import { NextResponse } from 'next/server';
import * as Sentry from "@sentry/nextjs";
import { authenticateRequest } from '@/lib/api/auth';

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/slack/callback`;

const SLACK_SCOPES = [
  'chat:write',
  'chat:write.public',
  'channels:read',
  'groups:read',
  'users:read',
  'users:read.email',
  'incoming-webhook',
].join(',');

export async function GET() {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { user, workspaceId } = auth.context;

    if (!SLACK_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Slack integration not configured' },
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

    const authUrl = new URL('https://slack.com/oauth/v2/authorize');
    authUrl.searchParams.set('client_id', SLACK_CLIENT_ID);
    authUrl.searchParams.set('scope', SLACK_SCOPES);
    authUrl.searchParams.set('redirect_uri', SLACK_REDIRECT_URI);
    authUrl.searchParams.set('state', state);

    return NextResponse.json({ url: authUrl.toString() });
  } catch (error) {
    console.error('Slack auth error:', error);
    Sentry.captureException(error, { tags: { api: "notifications-slack-auth" } });
    return NextResponse.json(
      { error: 'Failed to initiate Slack authentication' },
      { status: 500 }
    );
  }
}
