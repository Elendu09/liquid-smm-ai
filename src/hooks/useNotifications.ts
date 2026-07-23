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

      if (!uid) {
        setDemoMode(true);
        setNotifications(demoNotifications);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setDemoMode(true);
        setNotifications(demoNotifications);
      } else {
        setDemoMode(false);
        setNotifications(data.map(fromRow));
      }
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

  return {
    notifications,
    unreadCount,
    demoMode,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    snooze,
    pin,
    getNotificationsByType,
  };
}
