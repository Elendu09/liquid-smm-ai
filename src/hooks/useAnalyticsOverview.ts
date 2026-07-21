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

      const [pm, prd, amd] = await Promise.all([
        supabase
          .from("post_metrics")
          .select("impressions, reach, likes, comments, shares, saves, clicks")
          .eq("user_id", user.id)
          .gte("captured_at", since)
          .limit(5000),
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

      // FUNNEL
      const rows = pm.data ?? [];
      if (rows.length === 0) {
        setFunnel(null);
      } else {
        const totals = rows.reduce(
          (acc, r) => {
            acc.impressions += r.impressions ?? 0;
            acc.reach += r.reach ?? 0;
            acc.engaged +=
              (r.likes ?? 0) + (r.comments ?? 0) + (r.shares ?? 0) + (r.saves ?? 0);
            acc.clicks += r.clicks ?? 0;
            return acc;
          },
          { impressions: 0, reach: 0, engaged: 0, clicks: 0 },
        );
        setFunnel({
          ...totals,
          converted: Math.round(totals.clicks * 0.18), // conservative click→conv proxy
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
  }, [user, isGuest, rangeDays]);

  return useMemo(
    () => ({ funnel, monthly, platformSlices, loading }),
    [funnel, monthly, platformSlices, loading],
  );
}
