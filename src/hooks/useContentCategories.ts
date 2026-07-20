import { useCallback } from "react";
import { createRemoteCollection } from "./_remoteCollection";

export type CategoryCadence = "daily" | "weekly" | "monthly";

export interface ContentCategory {
  id: string;
  name: string;
  color: string;
  emoji: string;
  weeklyBudget: number;
  cadence: CategoryCadence;
  createdAt: string;
}

const SEED: ContentCategory[] = [
  { id: "seed-educational", name: "Educational", emoji: "📚", color: "#3B82F6", weeklyBudget: 3, cadence: "weekly", createdAt: new Date(0).toISOString() },
  { id: "seed-promotional", name: "Promotional", emoji: "🎯", color: "#F97316", weeklyBudget: 2, cadence: "weekly", createdAt: new Date(0).toISOString() },
  { id: "seed-bts",         name: "Behind the scenes", emoji: "🎬", color: "#A855F7", weeklyBudget: 2, cadence: "weekly", createdAt: new Date(0).toISOString() },
  { id: "seed-evergreen",   name: "Evergreen", emoji: "🌲", color: "#10B981", weeklyBudget: 1, cadence: "monthly", createdAt: new Date(0).toISOString() },
];

type Row = {
  id: string; name: string; color: string; emoji: string;
  weekly_budget: number; cadence: CategoryCadence; created_at: string;
};

const store = createRemoteCollection<ContentCategory, Row>({
  table: "content_categories",
  localKey: "smmpilot:content-categories",
  seed: SEED,
  orderBy: { column: "created_at", ascending: true },
  fromRow: (r) => ({
    id: r.id, name: r.name, color: r.color, emoji: r.emoji,
    weeklyBudget: r.weekly_budget, cadence: r.cadence, createdAt: r.created_at,
  }),
  toInsertRow: (c, userId) => ({
    id: c.id, user_id: userId, name: c.name, color: c.color, emoji: c.emoji,
    weekly_budget: c.weeklyBudget, cadence: c.cadence, created_at: c.createdAt,
  }),
  toUpdateRow: (p) => {
    const r: Record<string, unknown> = {};
    if (p.name !== undefined) r.name = p.name;
    if (p.color !== undefined) r.color = p.color;
    if (p.emoji !== undefined) r.emoji = p.emoji;
    if (p.weeklyBudget !== undefined) r.weekly_budget = p.weeklyBudget;
    if (p.cadence !== undefined) r.cadence = p.cadence;
    return r;
  },
});

export function useContentCategories() {
  const categories = store.useItems();
  const add = useCallback((c: Omit<ContentCategory, "id" | "createdAt">) =>
    store.add({ ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString() }), []);
  const update = useCallback((id: string, patch: Partial<ContentCategory>) => store.update(id, patch), []);
  const remove = useCallback((id: string) => store.remove(id), []);
  const byId = useCallback((id?: string) => (id ? categories.find((c) => c.id === id) : undefined), [categories]);
  return { categories, add, update, remove, byId };
}
