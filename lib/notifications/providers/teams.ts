/**
 * Microsoft Teams Notification Provider
 * Handles all Teams-specific notification delivery via Adaptive Cards
 */

import { createUntypedAdminClient } from '@/lib/db/client';
import type {
  NotificationProvider,
  NotificationPayload,
  NotificationResult,
  TeamsConfig,
  TeamsAdaptiveCardTemplate,
  TeamsCardElement,
  TeamsCardAction,
} from '../types';

export class TeamsProvider implements NotificationProvider {
  channel = 'teams' as const;

  async isConfigured(workspaceId: string): Promise<boolean> {
    const config = await this.getConfig(workspaceId);
    return config !== null && (!!config.webhookUrl || !!config.accessToken);
  }

  private async getConfig(workspaceId: string): Promise<TeamsConfig | null> {
    const supabase = createUntypedAdminClient();

    const { data, error } = await supabase
      .from('teams_integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !data) return null;

    return {
      workspaceId: data.workspace_id,
      tenantId: data.tenant_id,
      teamId: data.team_id,
      teamName: data.team_name,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      defaultChannelId: data.default_channel_id,
      webhookUrl: data.webhook_url,
      installedAt: data.installed_at,
      installedBy: data.installed_by,
    };
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const config = await this.getConfig(payload.workspaceId);

    if (!config) {
      return {
        success: false,
        channel: 'teams',
        error: 'Teams not configured for this workspace',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const card = this.buildAdaptiveCard(payload);

      // Incoming Webhook is preferred (simpler, no auth refresh needed)
      if (config.webhookUrl) {
        return await this.sendViaWebhook(config.webhookUrl, card);
      }

      // Fall back to Graph API if no webhook
      return await this.sendViaGraphApi(config, payload, card);
    } catch (error) {
      return {
        success: false,
        channel: 'teams',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async sendBatch(payloads: NotificationPayload[]): Promise<NotificationResult[]> {
    // Teams also doesn't have batch API, parallelize
    const results = await Promise.allSettled(
      payloads.map(payload => this.send(payload))
    );

    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        success: false,
        channel: 'teams' as const,
        error: result.reason?.message || 'Batch send failed',
        timestamp: new Date().toISOString(),
      };
    });
  }

  private async sendViaWebhook(
    webhookUrl: string,
    card: TeamsAdaptiveCardTemplate
  ): Promise<NotificationResult> {
    // Teams Incoming Webhook expects a specific wrapper format
    const messagePayload = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: card,
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messagePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Teams webhook failed: ${response.status} - ${errorText}`);
    }

    return {
      success: true,
      channel: 'teams',
      timestamp: new Date().toISOString(),
    };
  }

  private async sendViaGraphApi(
    config: TeamsConfig,
    payload: NotificationPayload,
    card: TeamsAdaptiveCardTemplate
  ): Promise<NotificationResult> {
    if (!config.teamId || !config.defaultChannelId) {
      throw new Error('Team or channel not configured for Graph API');
    }

    // Ensure we have a valid token
    const accessToken = await this.ensureValidToken(config);

    const graphUrl = `https://graph.microsoft.com/v1.0/teams/${config.teamId}/channels/${config.defaultChannelId}/messages`;

    const response = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: {
          contentType: 'html',
          content: `<attachment id="forge-card"></attachment>`,
        },
        attachments: [
          {
            id: 'forge-card',
            contentType: 'application/vnd.microsoft.card.adaptive',
            contentUrl: null,
            content: JSON.stringify(card),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Graph API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    return {
      success: true,
      channel: 'teams',
      messageId: data.id,
      timestamp: new Date().toISOString(),
    };
  }

  private async ensureValidToken(config: TeamsConfig): Promise<string> {
    // Check if token is still valid (simplified check)
    // In production, decode JWT and check exp claim
    if (config.accessToken) {
      return config.accessToken;
    }

    // Refresh token if needed
    if (config.refreshToken) {
      return await this.refreshAccessToken(config);
    }

    throw new Error('No valid Teams token available');
  }

  private async refreshAccessToken(config: TeamsConfig): Promise<string> {
    const clientId = process.env.TEAMS_CLIENT_ID;
    const clientSecret = process.env.TEAMS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Teams OAuth credentials not configured');
    }

    const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/.default',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Teams token');
    }

    const data = await response.json();

    // Update stored tokens
    const supabase = createUntypedAdminClient();
    await supabase
      .from('teams_integrations')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token || config.refreshToken,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', config.workspaceId);

    return data.access_token;
  }

  private buildAdaptiveCard(payload: NotificationPayload): TeamsAdaptiveCardTemplate {
    const body: TeamsCardElement[] = [];
    const actions: TeamsCardAction[] = [];

    // Header with priority color
    body.push({
      type: 'TextBlock',
      text: payload.title,
      size: 'large',
      weight: 'bolder',
      color: this.getPriorityColor(payload.priority),
      wrap: true,
    });

    // Body text
    body.push({
      type: 'TextBlock',
      text: payload.body,
      wrap: true,
    });

    // Metadata as fact set
    if (payload.metadata && Object.keys(payload.metadata).length > 0) {
      const facts = Object.entries(payload.metadata)
        .slice(0, 6) // Keep it concise
        .map(([key, value]) => ({
          title: this.formatFieldName(key),
          value: String(value),
        }));

      if (facts.length > 0) {
        body.push({
          type: 'FactSet',
          facts,
        });
      }
    }

    // Category and timestamp
    body.push({
      type: 'TextBlock',
      text: `FORGE ${this.formatCategory(payload.category)} • ${new Date().toLocaleString()}`,
      size: 'small',
      color: 'default',
      wrap: true,
    });

    // Action button
    if (payload.actionUrl) {
      actions.push({
        type: 'Action.OpenUrl',
        title: payload.actionLabel || 'View in FORGE',
        url: payload.actionUrl,
      });
    }

    return {
      type: 'AdaptiveCard',
      version: '1.4',
      body,
      actions: actions.length > 0 ? actions : undefined,
    };
  }

  private getPriorityColor(priority: NotificationPayload['priority']): TeamsCardElement['color'] {
    switch (priority) {
      case 'urgent': return 'attention';
      case 'high': return 'warning';
      case 'normal': return 'default';
      case 'low': return 'default';
      default: return 'default';
    }
  }

  private formatFieldName(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private formatCategory(category: NotificationPayload['category']): string {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

export const teamsProvider = new TeamsProvider();
