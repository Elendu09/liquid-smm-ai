import { useCallback, useMemo } from "react";
import { createRemoteCollection } from "./_remoteCollection";

export interface PlatformPreset {
  id: string;
  platform: string;
  toolKey: string;
  name: string;
  isDefault: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface Row {
  id: string;
  user_id: string;
  platform: string;
  tool_key: string;
  name: string;
  is_default: boolean;
  config: unknown;
  created_at: string;
  updated_at: string;
}

function seed(): PlatformPreset[] {
  const now = new Date().toISOString();
  return [
    { id: crypto.randomUUID(), platform: "instagram", toolKey: "caption-generator", name: "IG Casual", isDefault: true, config: { tone: "casual", emojiLevel: "medium", hashtagCount: 12, maxLength: 2200, cta: "Save this post ✨" }, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), platform: "linkedin", toolKey: "caption-generator", name: "LI Professional", isDefault: true, config: { tone: "professional", emojiLevel: "none", hashtagCount: 4, maxLength: 3000, cta: "Share your thoughts below." }, createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), platform: "twitter", toolKey: "caption-generator", name: "X Witty", isDefault: true, config: { tone: "witty", emojiLevel: "low", hashtagCount: 2, maxLength: 280, cta: "Follow for more." }, createdAt: now, updatedAt: now },
  ];
}

const collection = createRemoteCollection<PlatformPreset, Row>({
  table: "platform_presets",
  localKey: "smmpilot:presets",
  seed: seed(),
  orderBy: { column: "created_at", ascending: true },
  fromRow: (r) => ({
    id: r.id,
    platform: r.platform,
    toolKey: r.tool_key,
    name: r.name,
    isDefault: r.is_default,
    config: (r.config as Record<string, unknown>) ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }),
  toInsertRow: (item, user_id) => ({
    id: item.id,
    user_id,
    platform: item.platform,
    tool_key: item.toolKey,
    name: item.name,
    is_default: item.isDefault,
    config: item.config,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }),
  toUpdateRow: (patch) => {
    const row: Record<string, unknown> = {};
    if (patch.platform !== undefined) row.platform = patch.platform;
    if (patch.toolKey !== undefined) row.tool_key = patch.toolKey;
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.isDefault !== undefined) row.is_default = patch.isDefault;
    if (patch.config !== undefined) row.config = patch.config;
    row.updated_at = new Date().toISOString();
    return row;
  },
});

export function usePresets(toolKey?: string, platform?: string) {
  const all = collection.useItems();

  const filtered = useMemo(
    () => all.filter((r) => (!toolKey || r.toolKey === toolKey) && (!platform || r.platform === platform)),
    [all, toolKey, platform],
  );

  const defaultPreset = useMemo(
    () => filtered.find((p) => p.isDefault) ?? filtered[0],
    [filtered],
  );

  const upsert = useCallback(
    (preset: Omit<PlatformPreset, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
      const now = new Date().toISOString();
      const existing = preset.id ? collection.read().find((p) => p.id === preset.id) : undefined;

      // enforce single default per (platform, toolKey)
      if (preset.isDefault) {
        collection.read().forEach((p) => {
          if (p.platform === preset.platform && p.toolKey === preset.toolKey && p.id !== preset.id && p.isDefault) {
            void collection.update(p.id, { isDefault: false });
          }
        });
      }

      if (existing) {
        void collection.update(existing.id, { ...preset, updatedAt: now });
      } else {
        const item: PlatformPreset = {
          id: preset.id ?? crypto.randomUUID(),
          platform: preset.platform,
          toolKey: preset.toolKey,
          name: preset.name,
          isDefault: !!preset.isDefault,
          config: preset.config ?? {},
          createdAt: now,
          updatedAt: now,
        };
        void collection.add(item);
      }
    },
    [],
  );

  const remove = useCallback((id: string) => {
    void collection.remove(id);
  }, []);

  const setDefault = useCallback((id: string) => {
    const target = collection.read().find((p) => p.id === id);
    if (!target) return;
    collection.read().forEach((p) => {
      if (p.platform === target.platform && p.toolKey === target.toolKey) {
        const should = p.id === id;
        if (p.isDefault !== should) void collection.update(p.id, { isDefault: should });
      }
    });
  }, []);

  return { rows: filtered, all, defaultPreset, upsert, remove, setDefault };
}
