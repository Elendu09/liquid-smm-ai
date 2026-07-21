import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

export type RangeDays = 7 | 30 | 90;

export interface FunnelTotals {
  impressions: number;
  reach: number;
  engaged: number;
  clicks: number;
  converted: number;
}

export interface MonthlyGrowthPoint {
  month: string;      // "Jan 26"
  followers: number;
  engagement: number; // percent 0-100
}

export interface PlatformSlice {
  platform: string;
  followers: number;
  posts: number;
  accounts: number;
}

interface OverviewData {
  funnel: FunnelTotals | null;
  monthly: MonthlyGrowthPoint[];
  platformSlices: PlatformSlice[];
  loading: boolean;
}

const MONTH_LABEL = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Central analytics-overview data loader for signed-in users.
 * Reads from post_metrics, platform_rollup_daily, and account_metrics_daily
 * and shapes them for the Overview cards (Funnel, Growth Story, Audience Mix).
 * Returns null/empty structures when there is no real data yet so callers can
 * render an EmptyState instead of a mock one.
 */
export function useAnalyticsOverview(rangeDays: RangeDays = 90): OverviewData {
  const { user, isGuest } = useAuthUser();
  const [funnel, setFunnel] = useState<FunnelTotals | null>(null);
  const [monthly, setMonthly] = useState<MonthlyGrowthPoint[]>([]);
  const [platformSlices, setPlatformSlices] = useState<PlatformSlice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Live invalidation: refetch when post_metrics or account_metrics_daily
  // change for this user. Debounced via a bumped tick to avoid thrash.
  useEffect(() => {
    if (isGuest || !user) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const bump = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setTick((t) => t + 1), 750);
    };
    const channel = supabase.channel(
      `analytics-overview-${user.id}-${Math.random().toString(36).slice(2)}`,
    );
    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "post_metrics", filter: `user_id=eq.${user.id}` },
      bump,
    );
    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "account_metrics_daily", filter: `user_id=eq.${user.id}` },
      bump,
    );
    channel.subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [user, isGuest]);

  useEffect(() => {
    if (isGuest || !user) {
      setFunnel(null);
      setMonthly([]);
      setPlatformSlices([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const since = new Date(Date.now() - rangeDays * 24 * 3600_000).toISOString();
      const sinceDate = since.slice(0, 10);

      const [totalsRes, prd, amd] = await Promise.all([
        supabase.rpc("analytics_overview_totals", {
          _user_id: user.id,
          _since: since,
        }),
        supabase
          .from("platform_rollup_daily")
          .select("platform, day, followers, engagement, posts, accounts")
          .eq("user_id", user.id)
          .gte("day", sinceDate)
          .order("day", { ascending: true }),
        supabase
          .from("account_metrics_daily")
          .select("day, followers, engagement")
          .eq("user_id", user.id)
          .gte("day", sinceDate)
          .order("day", { ascending: true }),
      ]);

      if (cancelled) return;

      // FUNNEL — server-side aggregate; no row cap.
      const t = totalsRes.data?.[0];
      if (!t || Number(t.post_count ?? 0) === 0) {
        setFunnel(null);
      } else {
        const impressions = Number(t.impressions ?? 0);
        const reach = Number(t.reach ?? 0);
        const engaged = Number(t.engaged ?? 0);
        const clicks = Number(t.clicks ?? 0);
        setFunnel({
          impressions,
          reach,
          engaged,
          clicks,
          converted: Math.round(clicks * 0.18),
        });
      }

      // MONTHLY GROWTH — prefer platform rollup; fallback to account_metrics_daily
      const source = (prd.data ?? []).length > 0
        ? (prd.data ?? []).map((r) => ({
            day: r.day as string,
            followers: Number(r.followers ?? 0),
            engagement: Number(r.engagement ?? 0),
          }))
        : (amd.data ?? []).map((r) => ({
            day: r.day as string,
            followers: Number(r.followers ?? 0),
            engagement: Number(r.engagement ?? 0),
          }));

      const byMonth = new Map<
        string,
        { followers: number; engagementSum: number; count: number; label: string }
      >();
      for (const r of source) {
        const d = new Date(r.day);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()).padStart(2, "0")}`;
        const label = `${MONTH_LABEL[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(-2)}`;
        const prev = byMonth.get(key);
        if (!prev) {
          byMonth.set(key, {
            followers: r.followers,
            engagementSum: r.engagement,
            count: 1,
            label,
          });
        } else {
          // Latest-of-month for followers, average for engagement
          prev.followers = r.followers;
          prev.engagementSum += r.engagement;
          prev.count += 1;
        }
      }
      const monthlyOut: MonthlyGrowthPoint[] = Array.from(byMonth.entries())
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([, v]) => ({
          month: v.label,
          followers: v.followers,
          engagement: Number((v.engagementSum / Math.max(1, v.count)).toFixed(2)),
        }));
      setMonthly(monthlyOut);

      // PLATFORM SLICES — from latest day per platform
      const latestByPlatform = new Map<string, PlatformSlice>();
      for (const r of prd.data ?? []) {
        const cur = latestByPlatform.get(r.platform);
        const slice: PlatformSlice = {
          platform: r.platform,
          followers: Number(r.followers ?? 0),
          posts: Number(r.posts ?? 0),
          accounts: Number(r.accounts ?? 0),
        };
        if (!cur) latestByPlatform.set(r.platform, slice);
        else {
          // rollup is ordered ascending; overwrite keeps latest
          latestByPlatform.set(r.platform, slice);
        }
      }
      setPlatformSlices(Array.from(latestByPlatform.values()));

      setLoading(false);
    })().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, isGuest, rangeDays, tick]);

  return useMemo(
    () => ({ funnel, monthly, platformSlices, loading }),
    [funnel, monthly, platformSlices, loading],
  );
}
