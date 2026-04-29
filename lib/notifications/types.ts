/**
 * FORGE Notification System Types
 * Enterprise-grade notification infrastructure for Slack, Teams, and Email
 */

export type NotificationChannel = 'slack' | 'teams' | 'email';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationCategory =
  | 'sprint_risk'
  | 'story_quality'
  | 'decision_required'
  | 'signal_update'
  | 'pi_planning'
  | 'capacity_alert'
  | 'jira_sync'
  | 'system';

export interface NotificationRecipient {
  userId: string;
  email?: string;
  slackUserId?: string;
  teamsUserId?: string;
}

export interface NotificationPayload {
  id: string;
  workspaceId: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  recipients: NotificationRecipient[];
  createdAt: string;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
  timestamp: string;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  isConfigured(workspaceId: string): Promise<boolean>;
  send(payload: NotificationPayload): Promise<NotificationResult>;
  sendBatch(payloads: NotificationPayload[]): Promise<NotificationResult[]>;
}

export interface SlackConfig {
  workspaceId: string;
  teamId: string;
  teamName: string;
  accessToken: string;
  botUserId: string;
  defaultChannelId?: string;
  webhookUrl?: string;
  installedAt: string;
  installedBy: string;
}

export interface TeamsConfig {
  workspaceId: string;
  tenantId: string;
  teamId: string;
  teamName: string;
  accessToken: string;
  refreshToken: string;
  defaultChannelId?: string;
  webhookUrl?: string;
  installedAt: string;
  installedBy: string;
}

export interface NotificationPreferences {
  userId: string;
  workspaceId: string;
  channels: {
    slack: boolean;
    teams: boolean;
    email: boolean;
  };
  categories: {
    [K in NotificationCategory]: {
      enabled: boolean;
      channels: NotificationChannel[];
      priority: NotificationPriority;
    };
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM
    end: string;   // HH:MM
    timezone: string;
  };
  digestMode?: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    time?: string; // HH:MM for daily/weekly
    dayOfWeek?: number; // 0-6 for weekly
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'userId' | 'workspaceId'> = {
  channels: {
    slack: true,
    teams: true,
    email: true,
  },
  categories: {
    sprint_risk: { enabled: true, channels: ['slack', 'teams', 'email'], priority: 'high' },
    story_quality: { enabled: true, channels: ['slack', 'email'], priority: 'normal' },
    decision_required: { enabled: true, channels: ['slack', 'teams', 'email'], priority: 'high' },
    signal_update: { enabled: true, channels: ['email'], priority: 'normal' },
    pi_planning: { enabled: true, channels: ['slack', 'teams'], priority: 'normal' },
    capacity_alert: { enabled: true, channels: ['slack', 'teams'], priority: 'high' },
    jira_sync: { enabled: false, channels: ['email'], priority: 'low' },
    system: { enabled: true, channels: ['email'], priority: 'low' },
  },
};

export interface NotificationTemplate {
  category: NotificationCategory;
  slackTemplate: SlackBlockTemplate;
  teamsTemplate: TeamsAdaptiveCardTemplate;
  emailTemplate: EmailTemplate;
}

export interface SlackBlockTemplate {
  blocks: SlackBlock[];
}

export interface SlackBlock {
  type: 'header' | 'section' | 'divider' | 'actions' | 'context';
  text?: {
    type: 'plain_text' | 'mrkdwn';
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: 'mrkdwn' | 'plain_text';
    text: string;
  }>;
  accessory?: {
    type: 'button' | 'image';
    text?: { type: 'plain_text'; text: string };
    url?: string;
    action_id?: string;
    image_url?: string;
    alt_text?: string;
  };
  elements?: Array<{
    type: 'button' | 'mrkdwn';
    text: string | { type: 'plain_text'; text: string };
    url?: string;
    action_id?: string;
  }>;
}

export interface TeamsAdaptiveCardTemplate {
  type: 'AdaptiveCard';
  version: '1.4';
  body: TeamsCardElement[];
  actions?: TeamsCardAction[];
}

export interface TeamsCardElement {
  type: 'TextBlock' | 'ColumnSet' | 'Container' | 'FactSet' | 'Image';
  text?: string;
  size?: 'small' | 'medium' | 'large' | 'extraLarge';
  weight?: 'lighter' | 'default' | 'bolder';
  color?: 'default' | 'accent' | 'attention' | 'good' | 'warning';
  wrap?: boolean;
  columns?: TeamsCardElement[];
  items?: TeamsCardElement[];
  facts?: Array<{ title: string; value: string }>;
  width?: string;
  url?: string;
  altText?: string;
}

export interface TeamsCardAction {
  type: 'Action.OpenUrl' | 'Action.Submit';
  title: string;
  url?: string;
  data?: Record<string, unknown>;
}

export interface EmailTemplate {
  subject: string;
  preheader?: string;
  bodyHtml: string;
  bodyText: string;
}
