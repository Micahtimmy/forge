/**
 * Notification Integration Status API
 * GET /api/notifications/status
 */

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api/auth';
import { createUntypedAdminClient } from '@/lib/db/client';

export async function GET() {
  try {
    const auth = await authenticateRequest();
    if (!auth.success) return auth.response;

    const { workspaceId } = auth.context;
    const supabase = createUntypedAdminClient();

    // Fetch Slack integration
    const { data: slack } = await supabase
      .from('slack_integrations')
      .select('team_name, default_channel_name, installed_at')
      .eq('workspace_id', workspaceId)
      .single();

    // Fetch Teams integration
    const { data: teams } = await supabase
      .from('teams_integrations')
      .select('team_name, default_channel_name, installed_at')
      .eq('workspace_id', workspaceId)
      .single();

    return NextResponse.json({
      slack: {
        connected: !!slack,
        teamName: slack?.team_name,
        defaultChannel: slack?.default_channel_name,
        installedAt: slack?.installed_at,
      },
      teams: {
        connected: !!teams,
        teamName: teams?.team_name,
        defaultChannel: teams?.default_channel_name,
        installedAt: teams?.installed_at,
      },
    });
  } catch (error) {
    console.error('Integration status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration status' },
      { status: 500 }
    );
  }
}
