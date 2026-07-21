import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGuest } from "@/hooks/useGuest";
import { useAccounts } from "@/contexts/AccountContext";
import { resolveMetric, type MetricId } from "@/hooks/useCustomReports";

export type RangeKey = "7D" | "30D" | "90D" | "1Y";
export const RANGE_DAYS: Record<RangeKey, number> = { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 };

export type SeriesPoint = { date: string; value: number };
export type SeriesResult = {
  series: SeriesPoint[];
  total: number;
  latest: number;
  first: number;
  delta: number;
  loading: boolean;
  isDemo: boolean;
};

type Row = {
  day: string;
  account_id: string;
  followers: number | null;
  following: number | null;
  posts: number | null;
  engagement: number | null;
  reach: number | null;
  impressions: number | null;
};

// Guest / demo synth seed strength derived from the connected accounts.
function guestSeed(followerTotal: number) {
  return Math.max(1000, followerTotal || 4200);
}

function isoDay(d: Date) {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  return nd.toISOString().slice(0, 10);
}

function fillGaps(rows: Row[], days: number): Row[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out: Row[] = [];
  const now = new Date();
  let last: Row | null = null;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = isoDay(d);
    const r = byDay.get(key);
    if (r) {
      out.push(r);
      last = r;
    } else if (last) {
      // Carry forward last known followers / cumulative counters; zero for flow metrics.
      out.push({ ...last, day: key, reach: 0, impressions: 0, posts: 0 });
    } else {
      out.push({
        day: key,
        account_id: "",
        followers: null,
        following: null,
        posts: 0,
        engagement: null,
        reach: 0,
        impressions: 0,
      });
    }
  }
  return out;
}

function pickMetric(row: Row, metric: MetricId): number {
  switch (metric) {
    case "followers": return row.followers ?? 0;
    case "engagement": return Number(row.engagement ?? 0);
    case "reach": return row.reach ?? 0;
    case "impressions": return row.impressions ?? 0;
    case "replies": {
      const r = row as Row & { raw?: { replies?: number; comments?: number } };
      return Number(r.raw?.replies ?? r.raw?.comments ?? 0);
    }
    case "ctr": {
      const r = row as Row & { raw?: { ctr?: number; clicks?: number } };
      const clicks = Number(r.raw?.clicks ?? 0);
      const imps = row.impressions ?? 0;
      if (r.raw?.ctr != null) return Number(r.raw.ctr);
      return imps > 0 ? (clicks / imps) * 100 : 0;
    }
    default: return 0;
  }
}

/**
 * Aggregate a metric across the caller's connected accounts for the given range.
 * Falls back to the local synth in guest mode so the marketing demo stays lively.
 */
export function useAnalyticsSeries(metric: MetricId, range: RangeKey, accountIds?: string[]): SeriesResult {
  const guest = useGuest();
  const { accounts } = useAccounts();
  const days = RANGE_DAYS[range];
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(!guest);

  const scope = useMemo(() => accountIds?.slice().sort().join(",") ?? "", [accountIds]);

  useEffect(() => {
    if (guest) { setRows(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - (days - 1));
      let q = supabase
        .from("account_metrics_daily")
        .select("day,account_id,followers,following,posts,engagement,reach,impressions,raw")
        .gte("day", isoDay(since))
        .order("day", { ascending: true });
      if (accountIds && accountIds.length) q = q.in("account_id", accountIds);
      const { data, error } = await q;
      if (cancelled) return;
      if (error) { setRows([]); setLoading(false); return; }
      setRows((data ?? []) as unknown as Row[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [guest, days, scope]);

  return useMemo<SeriesResult>(() => {
    // Guest / demo → synth. Signed-in users NEVER see synth; empty until real rows arrive.
    if (guest) {
      const followerTotal = accounts.reduce((s, a) => s + (a.followers || 0), 0);
      const series = resolveMetric(metric, days, guestSeed(followerTotal));
      const first = series[0]?.value ?? 0;
      const latest = series[series.length - 1]?.value ?? 0;
      const total = series.reduce((s, p) => s + p.value, 0);
      const delta = first ? ((latest - first) / first) * 100 : 0;
      return { series, total, latest, first, delta, loading: false, isDemo: true };
    }
    if (!rows) {
      return { series: [], total: 0, latest: 0, first: 0, delta: 0, loading, isDemo: false };
    }

    // Aggregate per day across accounts.
    const byDay = new Map<string, Row[]>();
    for (const r of rows) {
      const list = byDay.get(r.day) ?? [];
      list.push(r);
      byDay.set(r.day, list);
    }
    const aggregated: Row[] = Array.from(byDay.entries()).map(([day, list]) => {
      const sum = (fn: (x: Row) => number) => list.reduce((s, r) => s + (fn(r) || 0), 0);
      const avg = (fn: (x: Row) => number) => {
        const vals = list.map(fn).filter((v) => v > 0);
        return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      };
      return {
        day,
        account_id: "agg",
        followers: sum((r) => r.followers ?? 0),
        following: sum((r) => r.following ?? 0),
        posts: sum((r) => r.posts ?? 0),
        engagement: avg((r) => Number(r.engagement ?? 0)),
        reach: sum((r) => r.reach ?? 0),
        impressions: sum((r) => r.impressions ?? 0),
      };
    }).sort((a, b) => a.day.localeCompare(b.day));

    const filled = fillGaps(aggregated, days);
    const series: SeriesPoint[] = filled.map((r) => ({
      date: r.day.slice(5),
      value: +pickMetric(r, metric).toFixed(2),
    }));
    const first = series[0]?.value ?? 0;
    const latest = series[series.length - 1]?.value ?? 0;
    const total = series.reduce((s, p) => s + p.value, 0);
    const delta = first ? ((latest - first) / first) * 100 : 0;
    return { series, total, latest, first, delta, loading, isDemo: false };
  }, [rows, guest, loading, metric, days, accounts]);
}

/**
 * Per-account daily series for a metric (used by PlatformBreakdown).
 */
export function useAccountSeries(metric: MetricId, range: RangeKey) {
  const guest = useGuest();
  const { accounts } = useAccounts();
  const days = RANGE_DAYS[range];
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(!guest);

  useEffect(() => {
    if (guest) { setRows(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - (days - 1));
      const { data, error } = await supabase
        .from("account_metrics_daily")
        .select("day,account_id,followers,following,posts,engagement,reach,impressions,raw")
        .gte("day", isoDay(since))
        .order("day", { ascending: true });
      if (cancelled) return;
      if (error) { setRows([]); setLoading(false); return; }
      setRows((data ?? []) as unknown as Row[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [guest, days]);

  return useMemo(() => {
    return accounts.map((a) => {
      let trend: SeriesPoint[];
      if (guest || !rows) {
        trend = resolveMetric(metric, days, Math.max(500, (a.followers || 500) / 10));
      } else {
        const mine = rows.filter((r) => r.account_id === a.id);
        const filled = fillGaps(mine, days);
        trend = filled.map((r) => ({ date: r.day.slice(5), value: +pickMetric(r, metric).toFixed(2) }));
      }
      const first = trend[0]?.value ?? 0;
      const latest = trend[trend.length - 1]?.value ?? 0;
      const delta = first ? ((latest - first) / first) * 100 : 0;
      return { account: a, trend, delta, latest };
    });
  }, [rows, guest, metric, days, accounts]);
}

/**
 * Series for a single chart card. Accepts raw `days` (7/14/30/90) and an
 * optional platform id (matches `social_accounts.platform`). Real data comes
 * from `account_metrics_daily`; guests fall back to the local synth.
 */
export function useCardSeries(metric: MetricId, days: number, platformId?: string): SeriesResult {
  const guest = useGuest();
  const { accounts } = useAccounts();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(!guest);

  const accountIds = useMemo(() => {
    if (!platformId) return null;
    return accounts.filter((a) => a.platformId === platformId).map((a) => a.id);
  }, [accounts, platformId]);
  const scope = accountIds?.slice().sort().join(",") ?? "";

  useEffect(() => {
    if (guest) { setRows(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - (days - 1));
      let q = supabase
        .from("account_metrics_daily")
        .select("day,account_id,followers,following,posts,engagement,reach,impressions,raw")
        .gte("day", isoDay(since))
        .order("day", { ascending: true });
      if (accountIds && accountIds.length) q = q.in("account_id", accountIds);
      const { data, error } = await q;
      if (cancelled) return;
      if (error) { setRows([]); setLoading(false); return; }
      setRows((data ?? []) as unknown as Row[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [guest, days, scope]);

  return useMemo<SeriesResult>(() => {
    if (guest || !rows) {
      const followerTotal = accounts.reduce((s, a) => s + (a.followers || 0), 0);
      const series = resolveMetric(metric, days, guestSeed(followerTotal));
      const first = series[0]?.value ?? 0;
      const latest = series[series.length - 1]?.value ?? 0;
      const total = series.reduce((s, p) => s + p.value, 0);
      const delta = first ? ((latest - first) / first) * 100 : 0;
      return { series, total, latest, first, delta, loading: !guest && loading, isDemo: true };
    }
    const byDay = new Map<string, Row[]>();
    for (const r of rows) {
      const list = byDay.get(r.day) ?? [];
      list.push(r);
      byDay.set(r.day, list);
    }
    const aggregated: Row[] = Array.from(byDay.entries()).map(([day, list]) => {
      const sum = (fn: (x: Row) => number) => list.reduce((s, r) => s + (fn(r) || 0), 0);
      const avg = (fn: (x: Row) => number) => {
        const vals = list.map(fn).filter((v) => v > 0);
        return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      };
      return {
        day,
        account_id: "agg",
        followers: sum((r) => r.followers ?? 0),
        following: sum((r) => r.following ?? 0),
        posts: sum((r) => r.posts ?? 0),
        engagement: avg((r) => Number(r.engagement ?? 0)),
        reach: sum((r) => r.reach ?? 0),
        impressions: sum((r) => r.impressions ?? 0),
      };
    }).sort((a, b) => a.day.localeCompare(b.day));
    const filled = fillGaps(aggregated, days);
    const series: SeriesPoint[] = filled.map((r) => ({
      date: r.day.slice(5),
      value: +pickMetric(r, metric).toFixed(2),
    }));
    const first = series[0]?.value ?? 0;
    const latest = series[series.length - 1]?.value ?? 0;
    const total = series.reduce((s, p) => s + p.value, 0);
    const delta = first ? ((latest - first) / first) * 100 : 0;
    return { series, total, latest, first, delta, loading, isDemo: false };
  }, [rows, guest, loading, metric, days, accounts]);
}
