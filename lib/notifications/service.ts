/**
 * FORGE Notification Service
 * Central orchestrator for multi-channel notification delivery
 */

import { createUntypedAdminClient } from '@/lib/db/client';
import { slackProvider } from './providers/slack';
import { teamsProvider } from './providers/teams';
import type {
  NotificationPayload,
  NotificationResult,
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
  NotificationProvider,
} from './types';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendNotificationOptions {
  workspaceId: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  recipientUserIds?: string[];
  forceChannels?: NotificationChannel[];
}

export interface NotificationTrigger {
  event: string;
  category: NotificationCategory;
  defaultPriority: NotificationPriority;
  titleTemplate: string;
  bodyTemplate: string;
}

export const NOTIFICATION_TRIGGERS: Record<string, NotificationTrigger> = {
  'sprint.at_risk': {
    event: 'sprint.at_risk',
    category: 'sprint_risk',
    defaultPriority: 'high',
    titleTemplate: 'Sprint "{sprintName}" is at risk',
    bodyTemplate: 'Sprint completion is projected at {projectedCompletion}% based on current velocity. {riskFactors}',
  },
  'sprint.failing': {
    event: 'sprint.failing',
    category: 'sprint_risk',
    defaultPriority: 'urgent',
    titleTemplate: 'Sprint "{sprintName}" is predicted to fail',
    bodyTemplate: 'ML model predicts {failureProbability}% chance of sprint failure. Top factors: {topFactors}',
  },
  'story.quality_drop': {
    event: 'story.quality_drop',
    category: 'story_quality',
    defaultPriority: 'normal',
    titleTemplate: 'Story quality below threshold: {storyKey}',
    bodyTemplate: 'Score dropped to {score}/100. Main issues: {issues}',
  },
  'story.slip_risk': {
    event: 'story.slip_risk',
    category: 'story_quality',
    defaultPriority: 'high',
    titleTemplate: 'Story at risk of slipping: {storyKey}',
    bodyTemplate: '{slipProbability}% chance of not completing in sprint. Recommendation: {recommendation}',
  },
  'decision.required': {
    event: 'decision.required',
    category: 'decision_required',
    defaultPriority: 'high',
    titleTemplate: 'Decision needed: {decisionTitle}',
    bodyTemplate: '{decisionDescription}. Deadline: {deadline}',
  },
  'decision.outcome_due': {
    event: 'decision.outcome_due',
    category: 'decision_required',
    defaultPriority: 'normal',
    titleTemplate: 'Decision outcome review due: {decisionTitle}',
    bodyTemplate: 'Decision made {daysSince} days ago. Time to evaluate the outcome.',
  },
  'signal.ready_for_review': {
    event: 'signal.ready_for_review',
    category: 'signal_update',
    defaultPriority: 'normal',
    titleTemplate: 'Signal update ready for review',
    bodyTemplate: 'AI-generated draft for {audience} is ready. Review and send when ready.',
  },
  'pi.planning_reminder': {
    event: 'pi.planning_reminder',
    category: 'pi_planning',
    defaultPriority: 'normal',
    titleTemplate: 'PI Planning reminder: {piName}',
    bodyTemplate: 'PI Planning event starts in {daysUntil} days. {actionItems}',
  },
  'pi.risk_escalation': {
    event: 'pi.risk_escalation',
    category: 'pi_planning',
    defaultPriority: 'high',
    titleTemplate: 'PI Risk escalated: {riskTitle}',
    bodyTemplate: 'Risk level increased to {riskLevel}. Impact: {impact}',
  },
  'capacity.burnout_warning': {
    event: 'capacity.burnout_warning',
    category: 'capacity_alert',
    defaultPriority: 'high',
    titleTemplate: 'Burnout risk detected: {teamName}',
    bodyTemplate: 'Team showing {burnoutProbability}% burnout probability. Factors: {factors}',
  },
  'capacity.overallocation': {
    event: 'capacity.overallocation',
    category: 'capacity_alert',
    defaultPriority: 'high',
    titleTemplate: 'Team overallocated: {teamName}',
    bodyTemplate: 'Team is at {allocationPercent}% capacity. Consider redistributing {pointsOver} story points.',
  },
  'jira.sync_complete': {
    event: 'jira.sync_complete',
    category: 'jira_sync',
    defaultPriority: 'low',
    titleTemplate: 'JIRA sync complete',
    bodyTemplate: 'Synced {storiesCount} stories and {sprintsCount} sprints. {changes}',
  },
  'jira.sync_failed': {
    event: 'jira.sync_failed',
    category: 'jira_sync',
    defaultPriority: 'high',
    titleTemplate: 'JIRA sync failed',
    bodyTemplate: 'Sync failed: {errorMessage}. Last successful sync: {lastSync}',
  },
};

class NotificationService {
  private providers: Map<NotificationChannel, NotificationProvider>;

  constructor() {
    this.providers = new Map<NotificationChannel, NotificationProvider>([
      ['slack', slackProvider],
      ['teams', teamsProvider],
    ]);
  }

  async send(options: SendNotificationOptions): Promise<NotificationResult[]> {
    const {
      workspaceId,
      category,
      priority = 'normal',
      title,
      body,
      actionUrl,
      actionLabel,
      metadata,
      recipientUserIds,
      forceChannels,
    } = options;

    // Get recipients
    const recipients = recipientUserIds
      ? await this.getRecipients(workspaceId, recipientUserIds)
      : await this.getWorkspaceRecipients(workspaceId);

    if (recipients.length === 0) {
      return [{
        success: false,
        channel: 'email',
        error: 'No recipients found',
        timestamp: new Date().toISOString(),
      }];
    }

    // Determine which channels to use
    const channels = forceChannels || await this.determineChannels(workspaceId, category, recipients);

    const payload: NotificationPayload = {
      id: crypto.randomUUID(),
      workspaceId,
      category,
      priority,
      title,
      body,
      actionUrl,
      actionLabel,
      metadata,
      recipients,
      createdAt: new Date().toISOString(),
    };

    // Send to all channels in parallel
    const results = await Promise.all(
      channels.map(channel => this.sendToChannel(channel, payload))
    );

    // Log notification
    await this.logNotification(payload, results);

    return results;
  }

  async sendFromTrigger(
    triggerKey: string,
    workspaceId: string,
    variables: Record<string, string | number>,
    options?: Partial<SendNotificationOptions>
  ): Promise<NotificationResult[]> {
    const trigger = NOTIFICATION_TRIGGERS[triggerKey];

    if (!trigger) {
      throw new Error(`Unknown notification trigger: ${triggerKey}`);
    }

    const title = this.interpolate(trigger.titleTemplate, variables);
    const body = this.interpolate(trigger.bodyTemplate, variables);

    return this.send({
      workspaceId,
      category: trigger.category,
      priority: options?.priority || trigger.defaultPriority,
      title,
      body,
      actionUrl: options?.actionUrl,
      actionLabel: options?.actionLabel,
      metadata: { ...variables, trigger: triggerKey },
      recipientUserIds: options?.recipientUserIds,
      forceChannels: options?.forceChannels,
    });
  }

  private interpolate(template: string, variables: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      return String(variables[key] ?? `{${key}}`);
    });
  }

  private async sendToChannel(
    channel: NotificationChannel,
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    if (channel === 'email') {
      return this.sendEmail(payload);
    }

    const provider = this.providers.get(channel);

    if (!provider) {
      return {
        success: false,
        channel,
        error: `Provider not found for channel: ${channel}`,
        timestamp: new Date().toISOString(),
      };
    }

    const isConfigured = await provider.isConfigured(payload.workspaceId);

    if (!isConfigured) {
      return {
        success: false,
        channel,
        error: `${channel} not configured for workspace`,
        timestamp: new Date().toISOString(),
      };
    }

    return provider.send(payload);
  }

  private async sendEmail(payload: NotificationPayload): Promise<NotificationResult> {
    const emailRecipients = payload.recipients
      .filter(r => r.email)
      .map(r => r.email!);

    if (emailRecipients.length === 0) {
      return {
        success: false,
        channel: 'email',
        error: 'No email recipients',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'FORGE <notifications@forge.dev>',
        to: emailRecipients,
        subject: payload.title,
        html: this.buildEmailHtml(payload),
        text: this.buildEmailText(payload),
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        channel: 'email',
        messageId: data?.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        channel: 'email',
        error: error instanceof Error ? error.message : 'Email send failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private buildEmailHtml(payload: NotificationPayload): string {
    const priorityColor = {
      urgent: '#ef4444',
      high: '#f59e0b',
      normal: '#6366f1',
      low: '#6b7280',
    }[payload.priority];

    let metadataHtml = '';
    if (payload.metadata && Object.keys(payload.metadata).length > 0) {
      const metadataRows = Object.entries(payload.metadata)
        .filter(([key]) => key !== 'trigger')
        .map(([key, value]) => `
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">${this.formatFieldName(key)}</td>
            <td style="padding: 8px 0; color: #e5e7eb; font-size: 14px;">${String(value)}</td>
          </tr>
        `)
        .join('');

      metadataHtml = `
        <table style="width: 100%; margin-top: 16px; border-collapse: collapse;">
          ${metadataRows}
        </table>
      `;
    }

    const actionHtml = payload.actionUrl
      ? `
        <div style="margin-top: 24px;">
          <a href="${payload.actionUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #6366f1;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
          ">${payload.actionLabel || 'View in FORGE'}</a>
        </div>
      `
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="
          margin: 0;
          padding: 0;
          background-color: #0a0a0b;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="
              background-color: #141417;
              border-radius: 12px;
              padding: 32px;
              border: 1px solid #27272a;
            ">
              <div style="
                display: inline-block;
                padding: 4px 12px;
                background-color: ${priorityColor}20;
                color: ${priorityColor};
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 16px;
              ">${payload.priority}</div>

              <h1 style="
                color: #f4f4f5;
                font-size: 24px;
                font-weight: 600;
                margin: 0 0 16px 0;
                line-height: 1.3;
              ">${payload.title}</h1>

              <p style="
                color: #a1a1aa;
                font-size: 16px;
                line-height: 1.6;
                margin: 0;
              ">${payload.body}</p>

              ${metadataHtml}
              ${actionHtml}
            </div>

            <div style="
              text-align: center;
              margin-top: 24px;
              color: #52525b;
              font-size: 12px;
            ">
              <p style="margin: 0;">
                Sent by FORGE • ${this.formatCategory(payload.category)}
              </p>
              <p style="margin: 8px 0 0 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications" style="color: #6366f1; text-decoration: none;">
                  Manage notification preferences
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private buildEmailText(payload: NotificationPayload): string {
    let text = `[${payload.priority.toUpperCase()}] ${payload.title}\n\n${payload.body}`;

    if (payload.metadata && Object.keys(payload.metadata).length > 0) {
      text += '\n\n---\n';
      Object.entries(payload.metadata)
        .filter(([key]) => key !== 'trigger')
        .forEach(([key, value]) => {
          text += `${this.formatFieldName(key)}: ${String(value)}\n`;
        });
    }

    if (payload.actionUrl) {
      text += `\n\n${payload.actionLabel || 'View in FORGE'}: ${payload.actionUrl}`;
    }

    text += `\n\n---\nSent by FORGE • ${this.formatCategory(payload.category)}`;

    return text;
  }

  private async getRecipients(
    workspaceId: string,
    userIds: string[]
  ): Promise<NotificationPayload['recipients']> {
    const supabase = createUntypedAdminClient();

    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);

    const { data: slackUsers } = await supabase
      .from('user_slack_mappings')
      .select('user_id, slack_user_id')
      .eq('workspace_id', workspaceId)
      .in('user_id', userIds);

    const { data: teamsUsers } = await supabase
      .from('user_teams_mappings')
      .select('user_id, teams_user_id')
      .eq('workspace_id', workspaceId)
      .in('user_id', userIds);

    const slackMap = new Map(slackUsers?.map(u => [u.user_id, u.slack_user_id]) || []);
    const teamsMap = new Map(teamsUsers?.map(u => [u.user_id, u.teams_user_id]) || []);

    return (users || []).map(user => ({
      userId: user.id,
      email: user.email,
      slackUserId: slackMap.get(user.id),
      teamsUserId: teamsMap.get(user.id),
    }));
  }

  private async getWorkspaceRecipients(
    workspaceId: string
  ): Promise<NotificationPayload['recipients']> {
    const supabase = createUntypedAdminClient();

    const { data: members } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId);

    if (!members || members.length === 0) return [];

    return this.getRecipients(workspaceId, members.map(m => m.user_id));
  }

  private async determineChannels(
    workspaceId: string,
    category: NotificationCategory,
    recipients: NotificationPayload['recipients']
  ): Promise<NotificationChannel[]> {
    const channels: Set<NotificationChannel> = new Set();

    // Check which integrations are configured
    const [slackConfigured, teamsConfigured] = await Promise.all([
      slackProvider.isConfigured(workspaceId),
      teamsProvider.isConfigured(workspaceId),
    ]);

    // Always include email as fallback
    channels.add('email');

    // Add configured channels
    if (slackConfigured) channels.add('slack');
    if (teamsConfigured) channels.add('teams');

    return Array.from(channels);
  }

  private async logNotification(
    payload: NotificationPayload,
    results: NotificationResult[]
  ): Promise<void> {
    const supabase = createUntypedAdminClient();

    await supabase.from('notification_logs').insert({
      id: payload.id,
      workspace_id: payload.workspaceId,
      category: payload.category,
      priority: payload.priority,
      title: payload.title,
      body: payload.body,
      metadata: payload.metadata,
      recipient_count: payload.recipients.length,
      channels_attempted: results.map(r => r.channel),
      channels_succeeded: results.filter(r => r.success).map(r => r.channel),
      created_at: payload.createdAt,
    });
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

  private formatCategory(category: NotificationCategory): string {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

export const notificationService = new NotificationService();
