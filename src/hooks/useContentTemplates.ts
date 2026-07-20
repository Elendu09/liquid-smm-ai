import { useCallback, useMemo } from "react";
import { createRemoteCollection } from "./_remoteCollection";

export interface ContentTemplate {
  id: string;
  platform: string;
  toolKey: string;
  name: string;
  body: string;
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const SEED_TEMPLATES: ContentTemplate[] = (() => {
  const now = new Date().toISOString();
  return [
    { id: crypto.randomUUID(), platform: "instagram", toolKey: "caption-generator",
      name: "Product Launch",
      body: "🚀 Introducing {{product}} — {{tagline}}. Get yours today: {{link}}",
      tags: ["launch", "product"], usageCount: 0, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), platform: "instagram", toolKey: "story-automation",
      name: "Poll Story",
      body: "Which one do you prefer? {{option_a}} vs {{option_b}}",
      tags: ["engagement", "poll"], usageCount: 0, createdAt: now, updatedAt: now },
  ];
})();

type Row = {
  id: string; platform: string; tool_key: string; name: string; body: string;
  tags: string[]; usage_count: number; created_at: string; updated_at: string;
};

const store = createRemoteCollection<ContentTemplate, Row>({
  table: "content_templates",
  localKey: "smmpilot:templates",
  seed: SEED_TEMPLATES,
  orderBy: { column: "updated_at", ascending: false },
  fromRow: (r) => ({
    id: r.id, platform: r.platform, toolKey: r.tool_key, name: r.name, body: r.body,
    tags: r.tags ?? [], usageCount: r.usage_count,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }),
  toInsertRow: (t, userId) => ({
    id: t.id, user_id: userId, platform: t.platform, tool_key: t.toolKey,
    name: t.name, body: t.body, tags: t.tags, usage_count: t.usageCount,
    created_at: t.createdAt, updated_at: t.updatedAt,
  }),
  toUpdateRow: (p) => {
    const r: Record<string, unknown> = {};
    if (p.platform !== undefined) r.platform = p.platform;
    if (p.toolKey !== undefined) r.tool_key = p.toolKey;
    if (p.name !== undefined) r.name = p.name;
    if (p.body !== undefined) r.body = p.body;
    if (p.tags !== undefined) r.tags = p.tags;
    if (p.usageCount !== undefined) r.usage_count = p.usageCount;
    if (p.updatedAt !== undefined) r.updated_at = p.updatedAt;
    return r;
  },
});

export function useContentTemplates(toolKey?: string, platform?: string) {
  const rows = store.useItems();

  const filtered = useMemo(
    () => rows.filter((r) =>
      (!toolKey || r.toolKey === toolKey) && (!platform || r.platform === platform),
    ),
    [rows, toolKey, platform],
  );

  const upsert = useCallback(
    (tpl: Omit<ContentTemplate, "id" | "createdAt" | "updatedAt" | "usageCount"> & { id?: string; usageCount?: number }) => {
      const now = new Date().toISOString();
      const existing = tpl.id ? store.read().find((t) => t.id === tpl.id) : undefined;
      if (existing) {
        void store.update(existing.id, { ...tpl, updatedAt: now });
      } else {
        void store.add({
          ...tpl,
          id: tpl.id ?? crypto.randomUUID(),
          usageCount: tpl.usageCount ?? 0,
          createdAt: now, updatedAt: now,
        } as ContentTemplate);
      }
    },
    [],
  );

  const remove = useCallback((id: string) => store.remove(id), []);
  const incrementUsage = useCallback((id: string) => {
    const t = store.read().find((x) => x.id === id);
    if (t) void store.update(id, { usageCount: t.usageCount + 1, updatedAt: new Date().toISOString() });
  }, []);

  return { rows: filtered, all: rows, upsert, remove, incrementUsage };
}
