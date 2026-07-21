import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGuest } from "@/hooks/useGuest";

export interface BestSlot {
  dow: number;      // 0=Sun..6=Sat
  hour: number;     // 0..23
  score: number;    // 0..100
  samples: number;  // real posts backing this slot (0 => baseline)
  avgEngagement: number;
  source: "learned" | "baseline";
}

// Platform-agnostic baseline (used when we have zero samples in a slot).
const BASELINE: Record<number, number[]> = {
  0: [11, 15, 19],
  1: [8, 12, 17],
  2: [8, 12, 17],
  3: [9, 12, 18],
  4: [9, 13, 18],
  5: [10, 14, 16],
  6: [11, 14, 20],
};

/**
 * Real "best time to post" scoring for signed-in users.
 * Joins completed scheduled_posts with their latest post_metrics snapshot and
 * scores each weekday×hour slot using engagement (50%), reach (30%), and
 * shares+saves (20%). Slots with no observed posts fall back to a baseline.
 */
export function useBestTimeScoring(days = 90) {
  const { isGuest } = useGuest();
  const [rows, setRows] = useState<Array<{
    dow: number; hour: number; engagement: number; reach: number; virality: number;
  }> | null>(null);
  const [loading, setLoading] = useState(!isGuest);

  useEffect(() => {
    if (isGuest) { setRows(null); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - days * 86_400_000).toISOString();
      const { data: posts } = await supabase
        .from("scheduled_posts")
        .select("id, sent_at, scheduled_at, status")
        .eq("status", "completed")
        .gte("scheduled_at", since);
      if (cancelled) return;
      const ids = (posts ?? []).map((p: any) => p.id);
      if (ids.length === 0) { setRows([]); setLoading(false); return; }

      const { data: metrics } = await supabase
        .from("post_metrics")
        .select("post_id, captured_at, likes, comments, shares, saves, reach")
        .in("post_id", ids)
        .order("captured_at", { ascending: false });

      const latest = new Map<string, any>();
      for (const m of metrics ?? []) {
        if (!latest.has(m.post_id)) latest.set(m.post_id, m);
      }

      const out: Array<{ dow: number; hour: number; engagement: number; reach: number; virality: number }> = [];
      for (const p of posts ?? []) {
        const m = latest.get(p.id);
        if (!m) continue;
        const dt = new Date(p.sent_at ?? p.scheduled_at);
        const reach = m.reach ?? 0;
        const likes = m.likes ?? 0;
        const comments = m.comments ?? 0;
        const shares = m.shares ?? 0;
        const saves = m.saves ?? 0;
        const engagement = reach > 0
          ? ((likes + comments * 2 + shares * 3 + saves * 2) / reach) * 100
          : 0;
        out.push({
          dow: dt.getDay(),
          hour: dt.getHours(),
          engagement,
          reach,
          virality: shares + saves,
        });
      }
      setRows(out);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [isGuest, days]);

  return useMemo(() => {
    // Build per-slot aggregates.
    const buckets = new Map<string, { engagements: number[]; reaches: number[]; virs: number[]; count: number }>();
    for (const r of rows ?? []) {
      const k = `${r.dow}-${r.hour}`;
      const cur = buckets.get(k) ?? { engagements: [], reaches: [], virs: [], count: 0 };
      cur.engagements.push(r.engagement);
      cur.reaches.push(r.reach);
      cur.virs.push(r.virality);
      cur.count += 1;
      buckets.set(k, cur);
    }
    const maxReach = Math.max(1, ...Array.from(buckets.values()).flatMap((b) => b.reaches));
    const maxVir = Math.max(1, ...Array.from(buckets.values()).flatMap((b) => b.virs));

    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    const meta: BestSlot[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, (_, h) => ({
        dow: 0, hour: h, score: 0, samples: 0, avgEngagement: 0, source: "baseline" as const,
      })),
    );

    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const b = buckets.get(`${d}-${h}`);
        if (b && b.count > 0) {
          const avgEng = b.engagements.reduce((s, v) => s + v, 0) / b.count;
          const avgReach = b.reaches.reduce((s, v) => s + v, 0) / b.count;
          const avgVir = b.virs.reduce((s, v) => s + v, 0) / b.count;
          // engagement is already a percentage; normalise vs. 15% ceiling.
          const engScore = Math.min(1, avgEng / 15);
          const reachScore = avgReach / maxReach;
          const virScore = avgVir / maxVir;
          const raw = engScore * 0.5 + reachScore * 0.3 + virScore * 0.2;
          grid[d][h] = Math.round(raw * 100);
          meta[d][h] = { dow: d, hour: h, score: grid[d][h], samples: b.count, avgEngagement: +avgEng.toFixed(2), source: "learned" };
        } else if (BASELINE[d]?.includes(h)) {
          const rank = BASELINE[d].indexOf(h);
          grid[d][h] = 40 - rank * 8; // 40/32/24 baseline weights
          meta[d][h] = { dow: d, hour: h, score: grid[d][h], samples: 0, avgEngagement: 0, source: "baseline" };
        }
      }
    }

    const topSlots: BestSlot[] = [];
    for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) if (grid[d][h] > 0) topSlots.push(meta[d][h]);
    topSlots.sort((a, b) => b.score - a.score);

    const byDow: Record<number, number[]> = {};
    for (let d = 0; d < 7; d++) {
      byDow[d] = meta[d]
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((s) => s.hour);
    }

    const isBestSlot = (date: Date) => {
      const s = meta[date.getDay()][date.getHours()];
      return s && s.score >= 40;
    };
    const isBestDay = (date: Date) => (byDow[date.getDay()]?.length ?? 0) > 0;

    return {
      grid,
      meta,
      topSlots: topSlots.slice(0, 8),
      byDow,
      isBestSlot,
      isBestDay,
      loading,
      hasRealData: (rows?.length ?? 0) > 0,
    };
  }, [rows, loading]);
}
