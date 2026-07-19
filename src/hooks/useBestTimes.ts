import { useMemo } from "react";
import { useScheduledPosts } from "./useScheduledPosts";

/**
 * Suggest best posting hours per weekday.
 * Blends observed history (completed sends) with sensible platform defaults so
 * new accounts still get useful hints on day one.
 *
 * Returns a map keyed by day-of-week (0=Sun..6=Sat) with the top hours (0-23)
 * sorted by descending score, plus a helper `isBestSlot(date)` for the overlay.
 */
export interface BestTimesResult {
  byDow: Record<number, number[]>;
  isBestDay: (date: Date) => boolean;
  isBestSlot: (date: Date) => boolean;
  topHoursFor: (dow: number, limit?: number) => number[];
}

// Platform-agnostic sensible defaults (per weekday → hours).
// Lightly tuned to real-world engagement research.
const DEFAULTS: Record<number, number[]> = {
  0: [11, 15, 19], // Sun
  1: [8, 12, 17], // Mon
  2: [8, 12, 17], // Tue
  3: [9, 12, 18], // Wed
  4: [9, 13, 18], // Thu
  5: [10, 14, 16], // Fri
  6: [11, 14, 20], // Sat
};

export function useBestTimes(): BestTimesResult {
  const { posts } = useScheduledPosts();

  const byDow = useMemo(() => {
    const buckets: Record<number, Record<number, number>> = {};
    for (let d = 0; d < 7; d++) buckets[d] = {};

    for (const p of posts) {
      if (p.status !== "completed") continue;
      const dt = new Date(p.sentAt ?? p.scheduledAt);
      const dow = dt.getDay();
      const hour = dt.getHours();
      buckets[dow][hour] = (buckets[dow][hour] ?? 0) + 1;
    }

    const result: Record<number, number[]> = {};
    for (let d = 0; d < 7; d++) {
      const observed = Object.entries(buckets[d])
        .sort((a, b) => b[1] - a[1])
        .map(([h]) => Number(h));
      // Merge observed (weighted) with defaults, preserving order + dedup.
      const merged: number[] = [];
      const seen = new Set<number>();
      for (const h of [...observed, ...DEFAULTS[d]]) {
        if (seen.has(h)) continue;
        seen.add(h);
        merged.push(h);
        if (merged.length >= 3) break;
      }
      result[d] = merged;
    }
    return result;
  }, [posts]);

  const topHoursFor = (dow: number, limit = 3) => (byDow[dow] ?? []).slice(0, limit);
  const isBestDay = (date: Date) => (byDow[date.getDay()]?.length ?? 0) > 0;
  const isBestSlot = (date: Date) => {
    const hours = byDow[date.getDay()] ?? [];
    return hours.includes(date.getHours());
  };

  return { byDow, isBestDay, isBestSlot, topHoursFor };
}
