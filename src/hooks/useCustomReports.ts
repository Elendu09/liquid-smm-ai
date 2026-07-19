import { useCallback, useMemo } from "react";
import { useLocalCollection } from "./useLocalCollection";

export type MetricId =
  | "impressions"
  | "reach"
  | "engagement"
  | "followers"
  | "replies"
  | "ctr";

export type VizType = "line" | "bar" | "area" | "kpi";
export type RangeKey = "7d" | "14d" | "30d" | "90d";

export interface ChartCardConfig {
  id: string;
  name: string;
  metric: MetricId;
  viz: VizType;
  platformId?: string; // optional platform filter
  color?: string;
  compare?: boolean; // vs previous period
}

export interface CustomReport {
  id: string;
  name: string;
  cards: ChartCardConfig[];
  range: RangeKey;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_REPORTS: CustomReport[] = [
  {
    id: "report-default",
    name: "Weekly overview",
    cards: [
      { id: "c1", name: "Reach", metric: "reach", viz: "line", color: "hsl(var(--primary))", compare: true },
      { id: "c2", name: "Engagement", metric: "engagement", viz: "area", color: "#10b981", compare: true },
      { id: "c3", name: "Followers", metric: "followers", viz: "kpi", color: "#f59e0b" },
      { id: "c4", name: "Replies", metric: "replies", viz: "bar", color: "#ec4899" },
    ],
    range: "7d",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const METRIC_LABEL: Record<MetricId, string> = {
  impressions: "Impressions",
  reach: "Reach",
  engagement: "Engagement",
  followers: "Followers",
  replies: "Replies",
  ctr: "CTR",
};

export const METRIC_UNIT: Record<MetricId, string> = {
  impressions: "",
  reach: "",
  engagement: "%",
  followers: "",
  replies: "",
  ctr: "%",
};

export const RANGE_DAYS: Record<RangeKey, number> = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "90d": 90,
};

export function useCustomReports() {
  const col = useLocalCollection<CustomReport>("analytics", "custom-reports", DEFAULT_REPORTS);

  const add = useCallback((name = "Untitled report") => {
    const now = new Date().toISOString();
    const report: CustomReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      cards: [],
      range: "7d",
      createdAt: now,
      updatedAt: now,
    };
    col.setItems((prev) => [report, ...prev]);
    return report;
  }, [col]);

  const update = useCallback((id: string, patch: Partial<CustomReport>) => {
    col.setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r)));
  }, [col]);

  const remove = useCallback((id: string) => {
    col.setItems((prev) => prev.filter((r) => r.id !== id));
  }, [col]);

  const duplicate = useCallback((id: string) => {
    const src = col.items.find((r) => r.id === id);
    if (!src) return;
    const now = new Date().toISOString();
    const copy: CustomReport = {
      ...src,
      id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${src.name} (copy)`,
      cards: src.cards.map((c) => ({ ...c, id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })),
      createdAt: now,
      updatedAt: now,
    };
    col.setItems((prev) => [copy, ...prev]);
    return copy;
  }, [col]);

  const upsertCard = useCallback((reportId: string, card: ChartCardConfig) => {
    col.setItems((prev) => prev.map((r) => {
      if (r.id !== reportId) return r;
      const idx = r.cards.findIndex((c) => c.id === card.id);
      const cards = idx >= 0
        ? r.cards.map((c) => (c.id === card.id ? card : c))
        : [...r.cards, card];
      return { ...r, cards, updatedAt: new Date().toISOString() };
    }));
  }, [col]);

  const removeCard = useCallback((reportId: string, cardId: string) => {
    col.setItems((prev) => prev.map((r) =>
      r.id === reportId
        ? { ...r, cards: r.cards.filter((c) => c.id !== cardId), updatedAt: new Date().toISOString() }
        : r
    ));
  }, [col]);

  const reports = useMemo(() => col.items, [col.items]);

  return { reports, add, update, remove, duplicate, upsertCard, removeCard };
}

/**
 * Deterministic mock metric resolver. Reuses the follower/engagement values
 * from the active accounts and folds in a stable per-day seed so charts
 * animate but stay reproducible per (metric, platform, day). Swap this out
 * for a real SkyRank feed later without touching any UI.
 */
export function resolveMetric(
  metric: MetricId,
  days: number,
  seedBase: number,
): { date: string; value: number }[] {
  const out: { date: string; value: number }[] = [];
  const now = new Date();
  const base = Math.max(50, seedBase);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const seed = (d.getTime() / 86_400_000 + metric.length * 7) | 0;
    const noise = Math.sin(seed) * 0.5 + Math.cos(seed / 3) * 0.3;
    const growth = 1 + (days - i) * 0.012;
    let value = base * growth * (1 + noise * 0.18);
    if (metric === "engagement" || metric === "ctr") value = Math.max(0.2, Math.min(15, value / 100));
    else value = Math.max(0, Math.round(value));
    out.push({ date: d.toISOString().slice(5, 10), value: +value.toFixed(2) });
  }
  return out;
}
