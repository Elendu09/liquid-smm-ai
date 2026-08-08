import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { isGuestSession } from "@/hooks/useGuest";


export type NotificationType = "engagement" | "system" | "milestone" | "alert" | "reminder";
export type NotificationSeverity = "info" | "success" | "warning" | "critical";

export interface Notification {
  id: string;
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  pinned?: boolean;
  snoozedUntil?: Date | null;
  actionUrl?: string;
  platformId?: string;
  postId?: string;
  accountId?: string;
  metric?: { value?: number; delta?: number; baseline?: number; unit?: string } | null;
  groupKey?: string;
}

const demoNotifications: Notification[] = [
  {
    id: "demo-1",
    type: "engagement",
    severity: "success",
    title: "Post went viral!",
    message: "Your Instagram reel reached 50K views in 24 hours",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    platformId: "instagram",
    actionUrl: "/dashboard/analytics",
    metric: { value: 50000, baseline: 8000, unit: "views" },
  },
  {
    id: "demo-2",
    type: "milestone",
    severity: "success",
    title: "10K Followers!",
    message: "Congratulations! You've reached 10,000 followers on TikTok",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    platformId: "tiktok",
  },
  {
    id: "demo-3",
    type: "alert",
    severity: "critical",
    title: "Account needs attention",
    message: "Your Facebook account hasn't synced in 3 days",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
    platformId: "facebook",
    actionUrl: "/dashboard/account-health",
  },
  {
    id: "demo-4",
    type: "reminder",
    severity: "info",
    title: "Scheduled post ready",
    message: "Your YouTube video is scheduled to publish in 1 hour",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    read: true,
    platformId: "youtube",
    actionUrl: "/dashboard/scheduler",
  },
  {
    id: "demo-5",
    type: "system",
    severity: "info",
    title: "New feature available",
    message: "AI Caption Generator now supports all 14 platforms",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
  {
    id: "demo-6",
    type: "engagement",
    severity: "success",
    title: "High engagement detected",
    message: "Your latest X post has 200+ replies",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    read: false,
    platformId: "twitter",
    actionUrl: "/dashboard/comment-manager",
    metric: { value: 213, baseline: 40, unit: "replies" },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(row: any): Notification {
  return {
    id: row.id,
    type: row.type,
    severity: row.severity ?? "info",
    title: row.title,
    message: row.message,
    timestamp: new Date(row.created_at),
    read: !!row.read_at,
    pinned: !!row.pinned,
    snoozedUntil: row.snoozed_until ? new Date(row.snoozed_until) : null,
    actionUrl: row.action_url ?? undefined,
    platformId: row.platform_id ?? undefined,
    postId: row.post_id ?? undefined,
    accountId: row.account_id ?? undefined,
    metric: row.metric ?? null,
    groupKey: row.group_key ?? undefined,
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const { prefs } = useNotificationPreferences();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);

      // Guest / anonymous → show demo notifications for the marketing preview.
      if (!uid) {
        if (isGuestSession()) {
          setDemoMode(true);
          setNotifications(demoNotifications);
        } else {
          setDemoMode(false);
          setNotifications([]);
        }
        return;
      }

      // Authenticated: strictly real data. Empty state until backend emits.
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (cancelled) return;
      setDemoMode(false);
      setNotifications(error || !data ? [] : data.map(fromRow));

    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep latest prefs in a ref so realtime effect doesn't re-subscribe on every prefs change.
  const prefsRef = useRef(prefs);
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`notifications:${userId}:${crypto.randomUUID()}`);
    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setDemoMode(false);
          setNotifications((prev) => {
            if (payload.eventType === "INSERT") {
              const n = fromRow(payload.new);
              // Toast on new (respect user pref)
              const ch = prefsRef.current.channels?.[n.type];
              if (ch?.toast !== false) {
                const fn =
                  n.severity === "critical" || n.severity === "warning"
                    ? toast.error
                    : n.severity === "success"
                    ? toast.success
                    : toast;
                fn(n.title, {
                  description: n.message,
                  action: n.actionUrl
                    ? { label: "View", onClick: () => (window.location.href = n.actionUrl!) }
                    : undefined,
                });
              }
              return [n, ...prev].slice(0, 200);
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((n) => (n.id === (payload.new as { id: string }).id ? fromRow(payload.new) : n));
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((n) => n.id !== (payload.old as { id: string }).id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);


  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const trackEvent = useCallback(
    async (id: string, event: "read" | "clicked" | "dismissed" | "snoozed", type?: NotificationType, severity?: NotificationSeverity) => {
      if (demoMode || !userId || id.startsWith("demo-")) return;
      await supabase.from("notification_events").insert({
        user_id: userId,
        notification_id: id,
        event,
        notif_type: type,
        notif_severity: severity,
      });
    },
    [demoMode, userId],
  );

  const markAsRead = useCallback(
    async (id: string) => {
      const n = notifications.find((x) => x.id === id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      if (demoMode || !userId || id.startsWith("demo-")) return;
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
      trackEvent(id, "read", n?.type, n?.severity);
    },
    [demoMode, userId, notifications, trackEvent],
  );

  const markAsUnread = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
      if (demoMode || !userId || id.startsWith("demo-")) return;
      await supabase.from("notifications").update({ read_at: null }).eq("id", id);
    },
    [demoMode, userId],
  );

  const bulkMarkRead = useCallback(
    async (ids: string[]) => {
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
      if (demoMode || !userId) return;
      const real = ids.filter((id) => !id.startsWith("demo-"));
      if (real.length) await supabase.from("notifications").update({ read_at: now }).in("id", real);
    },
    [demoMode, userId],
  );

  const bulkMarkUnread = useCallback(
    async (ids: string[]) => {
      setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: false } : n)));
      if (demoMode || !userId) return;
      const real = ids.filter((id) => !id.startsWith("demo-"));
      if (real.length) await supabase.from("notifications").update({ read_at: null }).in("id", real);
    },
    [demoMode, userId],
  );

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      const set = new Set(ids);
      setNotifications((prev) => prev.filter((n) => !set.has(n.id)));
      if (demoMode || !userId) return;
      const real = ids.filter((id) => !id.startsWith("demo-"));
      if (real.length) await supabase.from("notifications").delete().in("id", real);
    },
    [demoMode, userId],
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (demoMode || !userId) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null)
      .eq("user_id", userId);
  }, [demoMode, userId]);

  const deleteNotification = useCallback(
    async (id: string) => {
      const n = notifications.find((x) => x.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (demoMode || !userId || id.startsWith("demo-")) return;
      trackEvent(id, "dismissed", n?.type, n?.severity);
      await supabase.from("notifications").delete().eq("id", id);
    },
    [demoMode, userId, notifications, trackEvent],
  );

  const snooze = useCallback(
    async (id: string, minutes: number) => {
      const until = new Date(Date.now() + minutes * 60_000);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, snoozedUntil: until } : n)));
      if (demoMode || !userId || id.startsWith("demo-")) return;
      await supabase.from("notifications").update({ snoozed_until: until.toISOString() }).eq("id", id);
    },
    [demoMode, userId],
  );

  const pin = useCallback(
    async (id: string, pinned = true) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, pinned } : n)));
      if (demoMode || !userId || id.startsWith("demo-")) return;
      await supabase.from("notifications").update({ pinned }).eq("id", id);
    },
    [demoMode, userId],
  );

  const getNotificationsByType = useCallback(
    (type: NotificationType) => notifications.filter((n) => n.type === type),
    [notifications],
  );

  /**
   * Push a new notification. Always writes to the local cache so the bell
   * updates instantly; persists remotely for signed-in users. Used by every
   * publish path (3.2) so a successful or failed post is never silent.
   */
  const push = useCallback(
    async (input: {
      type?: NotificationType;
      severity?: NotificationSeverity;
      title: string;
      message: string;
      actionUrl?: string;
      platformId?: string;
      postId?: string;
      accountId?: string;
      groupKey?: string;
      /** Show a toast alongside the persisted notification. Default true. */
      toast?: boolean;
    }) => {
      const id = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const type = input.type ?? "system";
      const severity = input.severity ?? "info";
      const n: Notification = {
        id,
        type,
        severity,
        title: input.title,
        message: input.message,
        timestamp: new Date(),
        read: false,
        actionUrl: input.actionUrl,
        platformId: input.platformId,
        postId: input.postId,
        accountId: input.accountId,
        groupKey: input.groupKey,
      };
      setNotifications((prev) => [n, ...prev].slice(0, 200));
      // Surface the toast immediately (respecting user pref).
      if (input.toast !== false) {
        const ch = prefsRef.current.channels?.[type];
        if (ch?.toast !== false) {
          const fn = severity === "critical" || severity === "warning" ? toast.error : severity === "success" ? toast.success : toast;
          fn(n.title, {
            description: n.message,
            action: n.actionUrl ? { label: "View", onClick: () => (window.location.href = n.actionUrl) } : undefined,
          });
        }
      }
      if (demoMode || !userId) return;
      try {
        await supabase.from("notifications").insert({
          id,
          user_id: userId,
          type,
          severity,
          title: input.title,
          message: input.message,
          action_url: input.actionUrl ?? null,
          platform_id: input.platformId ?? null,
          post_id: input.postId ?? null,
          account_id: input.accountId ?? null,
          group_key: input.groupKey ?? null,
        });
      } catch {
        // Local cache is the source of truth for this turn; we don't drop the row.
      }
    },
    [demoMode, userId],
  );

  return {
    notifications,
    unreadCount,
    demoMode,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    bulkMarkRead,
    bulkMarkUnread,
    bulkDelete,
    snooze,
    pin,
    getNotificationsByType,
    push,
  };
}
