"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Notification,
  NotificationPreferences,
  NotificationRule,
} from "@/lib/db/queries/notifications";

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
}

interface NotificationPreferencesResponse {
  preferences: NotificationPreferences;
}

interface NotificationRulesResponse {
  rules: NotificationRule[];
}

// ============================================
// NOTIFICATIONS
// ============================================

export function useNotifications(options: {
  unreadOnly?: boolean;
  channel?: "email" | "slack" | "in_app";
  limit?: number;
  offset?: number;
} = {}) {
  const params = new URLSearchParams();
  if (options.unreadOnly) params.set("unreadOnly", "true");
  if (options.channel) params.set("channel", options.channel);
  if (options.limit) params.set("limit", options.limit.toString());
  if (options.offset) params.set("offset", options.offset.toString());

  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", options],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch notifications");
      }
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useUnreadCount() {
  return useQuery<{ unreadCount: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?unreadOnly=true&limit=1");
      if (!res.ok) {
        throw new Error("Failed to fetch unread count");
      }
      const data = await res.json();
      return { unreadCount: data.unreadCount };
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to mark notification read");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to mark all notifications read");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export function useNotificationPreferences() {
  return useQuery<NotificationPreferencesResponse>({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/preferences");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch preferences");
      }
      return res.json();
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update preferences");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });
}

// ============================================
// NOTIFICATION RULES
// ============================================

export function useNotificationRules() {
  return useQuery<NotificationRulesResponse>({
    queryKey: ["notification-rules"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/rules");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch rules");
      }
      return res.json();
    },
  });
}

export function useCreateNotificationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: {
      name: string;
      description?: string;
      event_types: string[];
      conditions?: Record<string, unknown>;
      channels: ("email" | "slack" | "in_app")[];
      recipients: { type: "user" | "role" | "team" | "all"; ids?: string[] };
    }) => {
      const res = await fetch("/api/notifications/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create rule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-rules"] });
    },
  });
}

// ============================================
// INTEGRATION STATUS (Slack, Teams)
// ============================================

export interface IntegrationStatus {
  slack: {
    connected: boolean;
    teamName?: string;
    defaultChannel?: string;
    installedAt?: string;
  };
  teams: {
    connected: boolean;
    teamName?: string;
    defaultChannel?: string;
    installedAt?: string;
  };
}

export function useIntegrationStatus() {
  return useQuery<IntegrationStatus>({
    queryKey: ["integration-status"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/status");
      if (!res.ok) {
        throw new Error("Failed to fetch integration status");
      }
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useConnectSlack() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/slack/auth");
      if (!res.ok) {
        throw new Error("Failed to initiate Slack auth");
      }
      const { url } = await res.json();
      window.location.href = url;
    },
  });
}

export function useDisconnectSlack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/slack/disconnect", {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to disconnect Slack");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integration-status"] });
    },
  });
}

export function useConnectTeams() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/teams/auth");
      if (!res.ok) {
        throw new Error("Failed to initiate Teams auth");
      }
      const { url } = await res.json();
      window.location.href = url;
    },
  });
}

export function useDisconnectTeams() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/teams/disconnect", {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to disconnect Teams");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integration-status"] });
    },
  });
}

export function useSendTestNotification() {
  return useMutation({
    mutationFn: async (channel: "slack" | "teams" | "email") => {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send test notification");
      }

      return res.json();
    },
  });
}

export function useNotificationLogs(options?: { limit?: number; category?: string }) {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.category) params.set("category", options.category);

  return useQuery({
    queryKey: ["notification-logs", options],
    queryFn: async () => {
      const url = params.toString()
        ? `/api/notifications/logs?${params.toString()}`
        : "/api/notifications/logs";

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch notification logs");
      }

      return res.json() as Promise<{
        logs: Array<{
          id: string;
          category: string;
          priority: string;
          title: string;
          channelsAttempted: string[];
          channelsSucceeded: string[];
          createdAt: string;
        }>;
        total: number;
      }>;
    },
    staleTime: 30 * 1000,
  });
}
