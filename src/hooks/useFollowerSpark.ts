import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isGuestSession } from "@/hooks/useGuest";

/**
 * Live follower spark — total followers per day across every connected
 * account, refreshed whenever `account_metrics_daily` changes.
 */
export function useFollowerSpark(days = 14) {
  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || isGuestSession()) {
      setPoints([]);
      return;
    }
    let cancelled = false;

    const load = async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;
      const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("account_metrics_daily")
        .select("day, followers")
        .gte("day", since)
        .order("day", { ascending: true });
      if (cancelled) return;
      const byDay = new Map<string, number>();
      for (const r of (data ?? []) as { day: string; followers: number | null }[]) {
        byDay.set(r.day, (byDay.get(r.day) ?? 0) + (r.followers ?? 0));
      }
      setPoints([...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v));
      return uid;
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;
    void load().then((uid) => {
      if (cancelled || !uid) return;
      channel = supabase
        .channel(`follower-spark:${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "account_metrics_daily", filter: `user_id=eq.${uid}` },
          () => void load(),
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [days]);

  return points;
}
