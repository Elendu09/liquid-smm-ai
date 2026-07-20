import { useCallback } from "react";
import { createRemoteCollection } from "./_remoteCollection";

export type RecycleCadence = "weekly" | "biweekly" | "monthly";

export interface RecyclingRule {
  id: string;
  name: string;
  caption: string;
  mediaUrl?: string;
  platformIds: string[];
  hashtags?: string[];
  cadence: RecycleCadence;
  hour: number;
  nextRunAt: string;
  enabled: boolean;
  createdAt: string;
  categoryId?: string;
}

function stepFor(cadence: RecycleCadence, from: Date) {
  const d = new Date(from);
  if (cadence === "weekly") d.setDate(d.getDate() + 7);
  else if (cadence === "biweekly") d.setDate(d.getDate() + 14);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export function computeNextRun(cadence: RecycleCadence, hour: number, from = new Date()) {
  const next = new Date(from);
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= from.getTime()) return stepFor(cadence, next).toISOString();
  return next.toISOString();
}

type Row = {
  id: string; name: string; caption: string; media_url: string | null;
  platform_ids: string[]; hashtags: string[] | null;
  cadence: RecycleCadence; hour: number; next_run_at: string;
  enabled: boolean; category_id: string | null; created_at: string;
};

const store = createRemoteCollection<RecyclingRule, Row>({
  table: "recycling_rules",
  localKey: "smmpilot:recycling-rules",
  orderBy: { column: "created_at", ascending: false },
  fromRow: (r) => ({
    id: r.id, name: r.name, caption: r.caption,
    mediaUrl: r.media_url ?? undefined,
    platformIds: r.platform_ids ?? [],
    hashtags: r.hashtags ?? undefined,
    cadence: r.cadence, hour: r.hour, nextRunAt: r.next_run_at,
    enabled: r.enabled, categoryId: r.category_id ?? undefined,
    createdAt: r.created_at,
  }),
  toInsertRow: (r, userId) => ({
    id: r.id, user_id: userId, name: r.name, caption: r.caption,
    media_url: r.mediaUrl ?? null, platform_ids: r.platformIds,
    hashtags: r.hashtags ?? null, cadence: r.cadence, hour: r.hour,
    next_run_at: r.nextRunAt, enabled: r.enabled,
    category_id: r.categoryId ?? null, created_at: r.createdAt,
  }),
  toUpdateRow: (p) => {
    const r: Record<string, unknown> = {};
    if (p.name !== undefined) r.name = p.name;
    if (p.caption !== undefined) r.caption = p.caption;
    if (p.mediaUrl !== undefined) r.media_url = p.mediaUrl ?? null;
    if (p.platformIds !== undefined) r.platform_ids = p.platformIds;
    if (p.hashtags !== undefined) r.hashtags = p.hashtags ?? null;
    if (p.cadence !== undefined) r.cadence = p.cadence;
    if (p.hour !== undefined) r.hour = p.hour;
    if (p.nextRunAt !== undefined) r.next_run_at = p.nextRunAt;
    if (p.enabled !== undefined) r.enabled = p.enabled;
    if (p.categoryId !== undefined) r.category_id = p.categoryId ?? null;
    return r;
  },
});

export function useRecyclingRules() {
  const rules = store.useItems();

  const add = useCallback(
    (rule: Omit<RecyclingRule, "id" | "createdAt" | "nextRunAt"> & { nextRunAt?: string }) => {
      const created: RecyclingRule = {
        ...rule,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        nextRunAt: rule.nextRunAt ?? computeNextRun(rule.cadence, rule.hour),
      };
      return store.add(created);
    },
    [],
  );
  const update = useCallback((id: string, patch: Partial<RecyclingRule>) => store.update(id, patch), []);
  const remove = useCallback((id: string) => store.remove(id), []);
  const toggle = useCallback((id: string) => {
    const r = store.read().find((x) => x.id === id);
    if (r) store.update(id, { enabled: !r.enabled });
  }, []);
  const advance = useCallback((id: string) => {
    const r = store.read().find((x) => x.id === id);
    if (r) store.update(id, { nextRunAt: computeNextRun(r.cadence, r.hour, new Date()) });
  }, []);

  return { rules, add, update, remove, toggle, advance };
}
