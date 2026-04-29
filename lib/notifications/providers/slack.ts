/**
 * Slack Notification Provider
 * Handles all Slack-specific notification delivery
 */

import { createUntypedAdminClient } from '@/lib/db/client';
import type {
  NotificationProvider,
  NotificationPayload,
  NotificationResult,
  SlackConfig,
  SlackBlock,
} from '../types';

export class SlackProvider implements NotificationProvider {
  channel = 'slack' as const;

  async isConfigured(workspaceId: string): Promise<boolean> {
    const config = await this.getConfig(workspaceId);
    return config !== null && !!config.accessToken;
  }

  private async getConfig(workspaceId: string): Promise<SlackConfig | null> {
    const supabase = createUntypedAdminClient();

    const { data, error } = await supabase
      .from('slack_integrations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !data) return null;

    return {
      workspaceId: data.workspace_id,
      teamId: data.team_id,
      teamName: data.team_name,
      accessToken: data.access_token,
      botUserId: data.bot_user_id,
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
        channel: 'slack',
        error: 'Slack not configured for this workspace',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const blocks = this.buildBlocks(payload);

      // Try webhook first (faster), fall back to API
      if (config.webhookUrl) {
        return await this.sendViaWebhook(config.webhookUrl, payload, blocks);
      }

      return await this.sendViaApi(config, payload, blocks);
    } catch (error) {
      return {
        success: false,
        channel: 'slack',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async sendBatch(payloads: NotificationPayload[]): Promise<NotificationResult[]> {
    // Slack doesn't have a true batch API, but we can parallelize
    const results = await Promise.allSettled(
      payloads.map(payload => this.send(payload))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        success: false,
        channel: 'slack' as const,
        error: result.reason?.message || 'Batch send failed',
        timestamp: new Date().toISOString(),
      };
    });
  }

  private async sendViaWebhook(
    webhookUrl: string,
    payload: NotificationPayload,
    blocks: SlackBlock[]
  ): Promise<NotificationResult> {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: payload.title,
        blocks,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }

    return {
      success: true,
      channel: 'slack',
      timestamp: new Date().toISOString(),
    };
  }

  private async sendViaApi(
    config: SlackConfig,
    payload: NotificationPayload,
    blocks: SlackBlock[]
  ): Promise<NotificationResult> {
    const channelId = config.defaultChannelId;

    if (!channelId) {
      throw new Error('No default channel configured');
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channelId,
        text: payload.title,
        blocks,
        unfurl_links: false,
        unfurl_media: false,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return {
      success: true,
      channel: 'slack',
      messageId: data.ts,
      timestamp: new Date().toISOString(),
    };
  }

  private buildBlocks(payload: NotificationPayload): SlackBlock[] {
    const blocks: SlackBlock[] = [];

    // Header with priority indicator
    const priorityEmoji = this.getPriorityEmoji(payload.priority);
    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${priorityEmoji} ${payload.title}`,
        emoji: true,
      },
    });

    // Body section
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: payload.body,
      },
    });

    // Metadata fields if present
    if (payload.metadata && Object.keys(payload.metadata).length > 0) {
      const fields = Object.entries(payload.metadata)
        .slice(0, 10) // Slack limit
        .map(([key, value]) => ({
          type: 'mrkdwn' as const,
          text: `*${this.formatFieldName(key)}:*\n${String(value)}`,
        }));

      if (fields.length > 0) {
        blocks.push({
          type: 'section',
          fields,
        });
      }
    }

    // Action button if provided
    if (payload.actionUrl) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: payload.actionLabel || 'View in FORGE',
            },
            url: payload.actionUrl,
            action_id: `forge_action_${payload.id}`,
          },
        ],
      });
    }

    // Context footer
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn' as const,
          text: `FORGE ${this.formatCategory(payload.category)} • ${new Date().toLocaleString()}`,
        },
      ],
    });

    return blocks;
  }

  private getPriorityEmoji(priority: NotificationPayload['priority']): string {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚠️';
      case 'normal': return '📋';
      case 'low': return 'ℹ️';
      default: return '📋';
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

export const slackProvider = new SlackProvider();
