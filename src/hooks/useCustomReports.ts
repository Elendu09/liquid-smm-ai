import { useCallback } from "react";
import { createRemoteCollection } from "./_remoteCollection";

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
  platformId?: string;
  color?: string;
  compare?: boolean;
}

export interface CustomReport {
  id: string;
  name: string;
  cards: ChartCardConfig[];
  range: RangeKey;
  templateId?: string;
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

type Row = {
  id: string;
  name: string;
  cards: ChartCardConfig[] | null;
  range: string;
  template_id: string | null;
  created_at: string;
  updated_at: string;
};

const store = createRemoteCollection<CustomReport, Row>({
  table: "custom_reports",
  localKey: "smmpilot:analytics:custom-reports",
  seed: DEFAULT_REPORTS,
  orderBy: { column: "created_at", ascending: false },
  fromRow: (r) => ({
    id: r.id,
    name: r.name,
    cards: (r.cards ?? []) as ChartCardConfig[],
    range: (r.range as RangeKey) ?? "7d",
    templateId: r.template_id ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }),
  toInsertRow: (r, userId) => ({
    id: r.id,
    user_id: userId,
    name: r.name,
    cards: r.cards,
    range: r.range,
    template_id: r.templateId ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }),
  toUpdateRow: (p) => {
    const row: Record<string, unknown> = {};
    if (p.name !== undefined) row.name = p.name;
    if (p.cards !== undefined) row.cards = p.cards;
    if (p.range !== undefined) row.range = p.range;
    if (p.templateId !== undefined) row.template_id = p.templateId ?? null;
    return row;
  },
});

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function useCustomReports() {
  const reports = store.useItems();

  const add = useCallback((name = "Untitled report") => {
    const now = new Date().toISOString();
    const report: CustomReport = {
      id: newId("report"),
      name,
      cards: [],
      range: "7d",
      createdAt: now,
      updatedAt: now,
    };
    void store.add(report);
    return report;
  }, []);

  const addFromTemplate = useCallback((templateId: string, nameOverride?: string) => {
    const tpl = REPORT_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return null;
    const now = new Date().toISOString();
    const report: CustomReport = {
      id: newId("report"),
      name: nameOverride ?? tpl.name,
      range: tpl.range,
      templateId: tpl.id,
      cards: tpl.cards.map((c, i) => ({ ...c, id: `c-${crypto.randomUUID().slice(0, 8)}-${i}` })),
      createdAt: now,
      updatedAt: now,
    };
    void store.add(report);
    return report;
  }, []);

  const duplicateFromTemplate = useCallback((reportId: string) => {
    const src = store.read().find((r) => r.id === reportId);
    if (!src?.templateId) return null;
    const tpl = REPORT_TEMPLATES.find((t) => t.id === src.templateId);
    if (!tpl) return null;
    const siblings = store.read().filter((r) => r.templateId === src.templateId);
    return addFromTemplate(src.templateId, `${tpl.name} · variant ${siblings.length + 1}`);
  }, [addFromTemplate]);

  const update = useCallback((id: string, patch: Partial<CustomReport>) => {
    void store.update(id, { ...patch, updatedAt: new Date().toISOString() });
  }, []);

  const remove = useCallback((id: string) => {
    void store.remove(id);
  }, []);

  const duplicate = useCallback((id: string) => {
    const src = store.read().find((r) => r.id === id);
    if (!src) return;
    const now = new Date().toISOString();
    const copy: CustomReport = {
      ...src,
      id: newId("report"),
      name: `${src.name} (copy)`,
      cards: src.cards.map((c) => ({ ...c, id: `c-${crypto.randomUUID().slice(0, 8)}` })),
      createdAt: now,
      updatedAt: now,
    };
    void store.add(copy);
    return copy;
  }, []);

  const upsertCard = useCallback((reportId: string, card: ChartCardConfig) => {
    const src = store.read().find((r) => r.id === reportId);
    if (!src) return;
    const idx = src.cards.findIndex((c) => c.id === card.id);
    const cards = idx >= 0 ? src.cards.map((c) => (c.id === card.id ? card : c)) : [...src.cards, card];
    void store.update(reportId, { cards, updatedAt: new Date().toISOString() });
  }, []);

  const removeCard = useCallback((reportId: string, cardId: string) => {
    const src = store.read().find((r) => r.id === reportId);
    if (!src) return;
    void store.update(reportId, {
      cards: src.cards.filter((c) => c.id !== cardId),
      updatedAt: new Date().toISOString(),
    });
  }, []);

  return { reports, add, addFromTemplate, duplicateFromTemplate, update, remove, duplicate, upsertCard, removeCard };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  range: RangeKey;
  cards: Omit<ChartCardConfig, "id">[];
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "tpl-reels-growth",
    name: "Reels growth",
    description: "Track short-form reach, plays, and follower lift.",
    range: "14d",
    cards: [
      { name: "Reels reach", metric: "reach", viz: "area", color: "hsl(var(--primary))", compare: true },
      { name: "Impressions", metric: "impressions", viz: "line", color: "#8b5cf6", compare: true },
      { name: "Engagement rate", metric: "engagement", viz: "line", color: "#10b981", compare: true },
      { name: "New followers", metric: "followers", viz: "kpi", color: "#f59e0b" },
    ],
  },
  {
    id: "tpl-reply-engagement",
    name: "Reply engagement",
    description: "Conversation volume, response health, and CTR.",
    range: "7d",
    cards: [
      { name: "Replies", metric: "replies", viz: "bar", color: "#ec4899", compare: true },
      { name: "Engagement rate", metric: "engagement", viz: "area", color: "hsl(var(--primary))", compare: true },
      { name: "CTR", metric: "ctr", viz: "line", color: "#10b981", compare: true },
      { name: "Reach", metric: "reach", viz: "kpi", color: "#f59e0b" },
    ],
  },
  {
    id: "tpl-audience-growth",
    name: "Audience growth",
    description: "Follower momentum vs. reach over 30 days.",
    range: "30d",
    cards: [
      { name: "Followers", metric: "followers", viz: "line", color: "hsl(var(--primary))", compare: true },
      { name: "Reach", metric: "reach", viz: "area", color: "#8b5cf6", compare: true },
      { name: "Impressions", metric: "impressions", viz: "bar", color: "#f59e0b" },
    ],
  },
  {
    id: "tpl-content-performance",
    name: "Content performance",
    description: "Weekly snapshot of reach, engagement and CTR.",
    range: "7d",
    cards: [
      { name: "Reach", metric: "reach", viz: "kpi", color: "hsl(var(--primary))" },
      { name: "Engagement", metric: "engagement", viz: "area", color: "#10b981", compare: true },
      { name: "Impressions", metric: "impressions", viz: "line", color: "#8b5cf6", compare: true },
      { name: "CTR", metric: "ctr", viz: "bar", color: "#ec4899" },
    ],
  },
];

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
