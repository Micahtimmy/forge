import { createUntypedAdminClient } from "@/lib/db/client";

export interface NotificationEvent {
  id: string;
  workspace_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  source_type: string;
  source_id: string | null;
  importance: "low" | "normal" | "high" | "critical";
  created_at: string;
}

export interface Notification {
  id: string;
  workspace_id: string;
  user_id: string;
  event_id: string | null;
  rule_id: string | null;
  channel: "email" | "slack" | "in_app";
  title: string;
  body: string;
  action_url: string | null;
  metadata: Record<string, unknown>;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationRule {
  id: string;
  workspace_id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  event_types: string[];
  conditions: Record<string, unknown>;
  channels: string[];
  recipients: {
    type: "user" | "role" | "team" | "all";
    ids?: string[];
  };
  template_override: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  workspace_id: string;
  email_enabled: boolean;
  slack_enabled: boolean;
  in_app_enabled: boolean;
  digest_frequency: "realtime" | "hourly" | "daily" | "weekly";
  digest_time: string;
  digest_timezone: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  event_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type EventType =
  | "quality.score_dropped"
  | "quality.gate_failed"
  | "quality.score_improved"
  | "delivery.sprint_at_risk"
  | "delivery.story_blocked"
  | "delivery.sprint_completed"
  | "decision.created"
  | "decision.outcome_due"
  | "health.score_changed"
  | "health.critical"
  | "jira.sync_completed"
  | "jira.sync_failed"
  | "team.member_invited"
  | "team.member_joined"
  | "signal.update_sent";

/**
 * Emit a notification event
 */
export async function emitNotificationEvent(
  workspaceId: string,
  event: {
    type: EventType;
    data: Record<string, unknown>;
    sourceType: string;
    sourceId?: string;
    importance?: "low" | "normal" | "high" | "critical";
  }
): Promise<NotificationEvent> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("notification_events")
    .insert({
      workspace_id: workspaceId,
      event_type: event.type,
      event_data: event.data,
      source_type: event.sourceType,
      source_id: event.sourceId || null,
      importance: event.importance || "normal",
    })
    .select()
    .single();

  if (error) throw error;

  return data as NotificationEvent;
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  workspaceId: string,
  options: {
    status?: Notification["status"][];
    channel?: Notification["channel"];
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}
): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
  const supabase = createUntypedAdminClient();
  const { status, channel, limit = 20, offset = 0, unreadOnly } = options;

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (status && status.length > 0) {
    query = query.in("status", status);
  }

  if (channel) {
    query = query.eq("channel", channel);
  }

  if (unreadOnly) {
    query = query.neq("status", "read");
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  // Get unread count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .neq("status", "read");

  return {
    notifications: (data || []) as Notification[],
    total: count || 0,
    unreadCount: unreadCount || 0,
  };
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<Notification | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("notifications")
    .update({
      status: "read",
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as Notification;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(
  userId: string,
  workspaceId: string
): Promise<number> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("notifications")
    .update({
      status: "read",
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .neq("status", "read")
    .select();

  if (error) throw error;

  return data?.length || 0;
}

/**
 * Get user notification preferences
 */
export async function getUserNotificationPreferences(
  userId: string,
  workspaceId: string
): Promise<NotificationPreferences | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Return default preferences if none exist
      return {
        id: crypto.randomUUID(),
        user_id: userId,
        workspace_id: workspaceId,
        email_enabled: true,
        slack_enabled: false,
        in_app_enabled: true,
        digest_frequency: "daily",
        digest_time: "09:00",
        digest_timezone: "UTC",
        quiet_hours_enabled: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
        event_preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    throw error;
  }

  return data as NotificationPreferences;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  workspaceId: string,
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert({
      user_id: userId,
      workspace_id: workspaceId,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data as NotificationPreferences;
}

/**
 * Create notification rule
 */
export async function createNotificationRule(
  workspaceId: string,
  userId: string,
  input: {
    name: string;
    description?: string;
    event_types: string[];
    conditions?: Record<string, unknown>;
    channels: string[];
    recipients: {
      type: "user" | "role" | "team" | "all";
      ids?: string[];
    };
  }
): Promise<NotificationRule> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("notification_rules")
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      name: input.name,
      description: input.description || null,
      event_types: input.event_types,
      conditions: input.conditions || {},
      channels: input.channels,
      recipients: input.recipients,
    })
    .select()
    .single();

  if (error) throw error;

  return data as NotificationRule;
}

/**
 * List notification rules
 */
export async function listNotificationRules(
  workspaceId: string
): Promise<NotificationRule[]> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("notification_rules")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []) as NotificationRule[];
}

/**
 * Create a notification
 */
export async function createNotification(
  workspaceId: string,
  notification: {
    user_id: string;
    event_id?: string;
    rule_id?: string;
    channel: Notification["channel"];
    title: string;
    body: string;
    action_url?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<Notification> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      workspace_id: workspaceId,
      user_id: notification.user_id,
      event_id: notification.event_id || null,
      rule_id: notification.rule_id || null,
      channel: notification.channel,
      title: notification.title,
      body: notification.body,
      action_url: notification.action_url || null,
      metadata: notification.metadata || {},
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  return data as Notification;
}
