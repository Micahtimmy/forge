/**
 * JIRA Webhook Automation Handler
 * Processes JIRA webhooks and triggers automated workflows
 */

import { createUntypedAdminClient } from '@/lib/db/client';
import { inngest } from '@/lib/inngest/client';
import type { NotificationPayload } from '@/lib/notifications/types';

export type JiraWebhookEvent =
  | 'jira:issue_created'
  | 'jira:issue_updated'
  | 'jira:issue_deleted'
  | 'sprint_started'
  | 'sprint_closed'
  | 'board_configuration_changed';

export interface JiraWebhookPayload {
  webhookEvent: JiraWebhookEvent;
  timestamp: number;
  user?: {
    accountId: string;
    displayName: string;
    emailAddress?: string;
  };
  issue?: {
    id: string;
    key: string;
    self: string;
    fields: {
      summary: string;
      description?: string;
      status?: { name: string };
      priority?: { name: string };
      issuetype?: { name: string };
      assignee?: { displayName: string; accountId: string };
      reporter?: { displayName: string; accountId: string };
      project?: { key: string; name: string };
      sprint?: { id: number; name: string; state: string };
      customfield_10016?: number; // Story points (varies by JIRA instance)
    };
  };
  sprint?: {
    id: number;
    name: string;
    state: 'active' | 'closed' | 'future';
    startDate?: string;
    endDate?: string;
    completeDate?: string;
  };
  changelog?: {
    id: string;
    items: Array<{
      field: string;
      fieldtype: string;
      from: string | null;
      fromString: string | null;
      to: string | null;
      toString: string | null;
    }>;
  };
}

export interface AutomationTrigger {
  id: string;
  workspaceId: string;
  name: string;
  enabled: boolean;
  event: JiraWebhookEvent;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdAt: string;
  updatedAt: string;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface AutomationAction {
  type: 'score_story' | 'notify_slack' | 'notify_teams' | 'notify_email' | 'update_signal' | 'create_risk';
  config: Record<string, unknown>;
}

export interface WebhookProcessingResult {
  processed: boolean;
  triggersExecuted: number;
  errors: string[];
}

export class JiraWebhookHandler {
  async processWebhook(
    workspaceId: string,
    payload: JiraWebhookPayload
  ): Promise<WebhookProcessingResult> {
    const result: WebhookProcessingResult = {
      processed: false,
      triggersExecuted: 0,
      errors: [],
    };

    try {
      // Get enabled triggers for this workspace and event
      const triggers = await this.getTriggers(workspaceId, payload.webhookEvent);

      if (triggers.length === 0) {
        result.processed = true;
        return result;
      }

      // Evaluate and execute triggers
      for (const trigger of triggers) {
        try {
          const conditionsMet = this.evaluateConditions(trigger.conditions, payload);

          if (conditionsMet) {
            await this.executeActions(trigger.actions, payload, workspaceId);
            result.triggersExecuted++;
          }
        } catch (error) {
          result.errors.push(
            `Trigger ${trigger.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      result.processed = true;

      // Log webhook processing
      await this.logWebhookProcessing(workspaceId, payload, result);

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  private async getTriggers(
    workspaceId: string,
    event: JiraWebhookEvent
  ): Promise<AutomationTrigger[]> {
    const supabase = createUntypedAdminClient();

    const { data, error } = await supabase
      .from('jira_automation_triggers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('event', event)
      .eq('enabled', true);

    if (error) {
      console.error('Error fetching triggers:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      enabled: row.enabled,
      event: row.event,
      conditions: row.conditions || [],
      actions: row.actions || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private evaluateConditions(
    conditions: AutomationCondition[],
    payload: JiraWebhookPayload
  ): boolean {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      const value = this.getFieldValue(condition.field, payload);

      switch (condition.operator) {
        case 'equals':
          return String(value) === String(condition.value);
        case 'not_equals':
          return String(value) !== String(condition.value);
        case 'contains':
          return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        default:
          return false;
      }
    });
  }

  private getFieldValue(field: string, payload: JiraWebhookPayload): unknown {
    const parts = field.split('.');
    let value: unknown = payload;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private async executeActions(
    actions: AutomationAction[],
    payload: JiraWebhookPayload,
    workspaceId: string
  ): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'score_story':
          await this.executeScoreStory(payload, workspaceId);
          break;
        case 'notify_slack':
          await this.executeNotifySlack(action.config, payload, workspaceId);
          break;
        case 'notify_teams':
          await this.executeNotifyTeams(action.config, payload, workspaceId);
          break;
        case 'notify_email':
          await this.executeNotifyEmail(action.config, payload, workspaceId);
          break;
        case 'update_signal':
          await this.executeUpdateSignal(action.config, payload, workspaceId);
          break;
        case 'create_risk':
          await this.executeCreateRisk(action.config, payload, workspaceId);
          break;
      }
    }
  }

  private async executeScoreStory(
    payload: JiraWebhookPayload,
    workspaceId: string
  ): Promise<void> {
    if (!payload.issue) return;

    // Find the story in our database
    const supabase = createUntypedAdminClient();
    const { data: story } = await supabase
      .from('stories')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('jira_key', payload.issue.key)
      .single();

    if (!story) return;

    // Trigger scoring via Inngest
    await inngest.send({
      name: 'forge/story.score',
      data: {
        storyId: story.id,
        workspaceId,
        triggeredBy: 'jira_webhook',
      },
    });
  }

  private async executeNotifySlack(
    config: Record<string, unknown>,
    payload: JiraWebhookPayload,
    workspaceId: string
  ): Promise<void> {
    const notification: Partial<NotificationPayload> = {
      workspaceId,
      category: 'jira_sync',
      priority: (config.priority as NotificationPayload['priority']) || 'normal',
      title: this.formatNotificationTitle(payload),
      body: this.formatNotificationBody(payload),
      actionUrl: payload.issue?.self,
      actionLabel: 'View in JIRA',
      metadata: {
        issueKey: payload.issue?.key,
        event: payload.webhookEvent,
      },
    };

    await inngest.send({
      name: 'forge/notification.send',
      data: {
        channel: 'slack',
        notification,
        workspaceId,
      },
    });
  }

  private async executeNotifyTeams(
    config: Record<string, unknown>,
    payload: JiraWebhookPayload,
    workspaceId: string
  ): Promise<void> {
    const notification: Partial<NotificationPayload> = {
      workspaceId,
      category: 'jira_sync',
      priority: (config.priority as NotificationPayload['priority']) || 'normal',
      title: this.formatNotificationTitle(payload),
      body: this.formatNotificationBody(payload),
      actionUrl: payload.issue?.self,
      actionLabel: 'View in JIRA',
    };

    await inngest.send({
      name: 'forge/notification.send',
      data: {
        channel: 'teams',
        notification,
        workspaceId,
      },
    });
  }

  private async executeNotifyEmail(
    config: Record<string, unknown>,
    payload: JiraWebhookPayload,
    workspaceId: string
  ): Promise<void> {
    const recipients = config.recipients as string[] || [];

    await inngest.send({
      name: 'forge/notification.send',
      data: {
        channel: 'email',
        notification: {
          workspaceId,
          category: 'jira_sync',
          priority: 'normal',
          title: this.formatNotificationTitle(payload),
          body: this.formatNotificationBody(payload),
        },
        recipients,
      },
    });
  }

  private async executeUpdateSignal(
    config: Record<string, unknown>,
    payload: JiraWebhookPayload,
    workspaceId: string
  ): Promise<void> {
    // Create or update a signal update based on JIRA changes
    await inngest.send({
      name: 'forge/signal.auto-update',
      data: {
        workspaceId,
        trigger: 'jira_webhook',
        event: payload.webhookEvent,
        issueKey: payload.issue?.key,
        changes: payload.changelog?.items || [],
        config,
      },
    });
  }

  private async executeCreateRisk(
    config: Record<string, unknown>,
    payload: JiraWebhookPayload,
    workspaceId: string
  ): Promise<void> {
    // Analyze the change and potentially create a risk
    const riskType = this.detectRiskType(payload);

    if (riskType) {
      const supabase = createUntypedAdminClient();

      await supabase
        .from('pi_risks')
        .insert({
          workspace_id: workspaceId,
          type: riskType,
          title: `Auto-detected: ${payload.issue?.key}`,
          description: this.formatRiskDescription(payload, riskType),
          severity: this.calculateRiskSeverity(payload, riskType),
          probability: 50,
          source: 'jira_automation',
          source_reference: payload.issue?.key,
        });
    }
  }

  private formatNotificationTitle(payload: JiraWebhookPayload): string {
    const eventNames: Record<JiraWebhookEvent, string> = {
      'jira:issue_created': 'Issue Created',
      'jira:issue_updated': 'Issue Updated',
      'jira:issue_deleted': 'Issue Deleted',
      'sprint_started': 'Sprint Started',
      'sprint_closed': 'Sprint Closed',
      'board_configuration_changed': 'Board Updated',
    };

    const eventName = eventNames[payload.webhookEvent] || 'JIRA Update';

    if (payload.issue) {
      return `${eventName}: ${payload.issue.key}`;
    }

    if (payload.sprint) {
      return `${eventName}: ${payload.sprint.name}`;
    }

    return eventName;
  }

  private formatNotificationBody(payload: JiraWebhookPayload): string {
    const parts: string[] = [];

    if (payload.issue) {
      parts.push(payload.issue.fields.summary);

      if (payload.changelog?.items.length) {
        const changes = payload.changelog.items
          .map(item => `${item.field}: ${item.fromString || 'none'} → ${item.toString || 'none'}`)
          .join(', ');
        parts.push(`Changes: ${changes}`);
      }
    }

    if (payload.sprint) {
      parts.push(`Sprint: ${payload.sprint.name}`);
      if (payload.sprint.state) {
        parts.push(`State: ${payload.sprint.state}`);
      }
    }

    if (payload.user) {
      parts.push(`By: ${payload.user.displayName}`);
    }

    return parts.join('\n');
  }

  private detectRiskType(payload: JiraWebhookPayload): string | null {
    if (!payload.changelog?.items) return null;

    for (const item of payload.changelog.items) {
      // Status moved to blocked
      if (item.field === 'status' && item.toString?.toLowerCase().includes('block')) {
        return 'dependency_blocked';
      }

      // Priority increased to high/critical
      if (item.field === 'priority') {
        const highPriorities = ['highest', 'high', 'critical', 'blocker'];
        if (highPriorities.some(p => item.toString?.toLowerCase().includes(p))) {
          return 'quality_degradation';
        }
      }

      // Story points significantly increased
      if (item.field === 'Story Points' || item.field === 'customfield_10016') {
        const from = parseFloat(item.from || '0');
        const to = parseFloat(item.to || '0');
        if (to > from * 1.5 && to - from >= 3) {
          return 'story_slip';
        }
      }
    }

    return null;
  }

  private formatRiskDescription(payload: JiraWebhookPayload, riskType: string): string {
    const descriptions: Record<string, string> = {
      dependency_blocked: `Issue ${payload.issue?.key} has been blocked. This may impact sprint completion.`,
      quality_degradation: `Issue ${payload.issue?.key} has been escalated to high priority, indicating potential quality concerns.`,
      story_slip: `Issue ${payload.issue?.key} has had its estimate significantly increased, suggesting scope creep or underestimation.`,
    };

    return descriptions[riskType] || `JIRA change detected for ${payload.issue?.key}`;
  }

  private calculateRiskSeverity(payload: JiraWebhookPayload, riskType: string): string {
    // Simple heuristics for severity
    if (riskType === 'dependency_blocked') {
      return 'high';
    }

    const priority = payload.issue?.fields.priority?.name?.toLowerCase() || '';
    if (priority.includes('critical') || priority.includes('highest')) {
      return 'critical';
    }
    if (priority.includes('high')) {
      return 'high';
    }
    if (priority.includes('medium')) {
      return 'medium';
    }

    return 'low';
  }

  private async logWebhookProcessing(
    workspaceId: string,
    payload: JiraWebhookPayload,
    result: WebhookProcessingResult
  ): Promise<void> {
    const supabase = createUntypedAdminClient();

    await supabase
      .from('jira_webhook_logs')
      .insert({
        workspace_id: workspaceId,
        event: payload.webhookEvent,
        issue_key: payload.issue?.key,
        sprint_id: payload.sprint?.id,
        triggers_executed: result.triggersExecuted,
        errors: result.errors.length > 0 ? result.errors : null,
        processed: result.processed,
        payload_summary: {
          event: payload.webhookEvent,
          issueKey: payload.issue?.key,
          sprintName: payload.sprint?.name,
          user: payload.user?.displayName,
          changedFields: payload.changelog?.items.map(i => i.field),
        },
      });
  }
}

export const webhookHandler = new JiraWebhookHandler();
