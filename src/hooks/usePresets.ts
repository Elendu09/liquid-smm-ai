import { useCallback, useEffect, useMemo, useState } from "react";

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

const KEY = "smmpilot:presets";
const emit = () => window.dispatchEvent(new Event("smmpilot:presets-change"));

function read(): PlatformPreset[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as PlatformPreset[];
  } catch {
    /* ignore */
  }
  return seed();
}

function write(rows: PlatformPreset[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
    emit();
  } catch {
    /* ignore */
  }
}

function seed(): PlatformPreset[] {
  const now = new Date().toISOString();
  const rows: PlatformPreset[] = [
    {
      id: crypto.randomUUID(),
      platform: "instagram",
      toolKey: "caption-generator",
      name: "IG Casual",
      isDefault: true,
      config: { tone: "casual", emojiLevel: "medium", hashtagCount: 12, maxLength: 2200, cta: "Save this post ✨" },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      platform: "linkedin",
      toolKey: "caption-generator",
      name: "LI Professional",
      isDefault: true,
      config: { tone: "professional", emojiLevel: "none", hashtagCount: 4, maxLength: 3000, cta: "Share your thoughts below." },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      platform: "twitter",
      toolKey: "caption-generator",
      name: "X Witty",
      isDefault: true,
      config: { tone: "witty", emojiLevel: "low", hashtagCount: 2, maxLength: 280, cta: "Follow for more." },
      createdAt: now,
      updatedAt: now,
    },
  ];
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
  return rows;
}

export function usePresets(toolKey?: string, platform?: string) {
  const [rows, setRows] = useState<PlatformPreset[]>(read);

  useEffect(() => {
    const sync = () => setRows(read());
    window.addEventListener("smmpilot:presets-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("smmpilot:presets-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => (!toolKey || r.toolKey === toolKey) && (!platform || r.platform === platform),
      ),
    [rows, toolKey, platform],
  );

  const defaultPreset = useMemo(() => filtered.find((p) => p.isDefault) ?? filtered[0], [filtered]);

  const upsert = useCallback((preset: Omit<PlatformPreset, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const all = read();
    const now = new Date().toISOString();
    if (preset.id) {
      const idx = all.findIndex((p) => p.id === preset.id);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...preset, updatedAt: now } as PlatformPreset;
      }
    } else {
      all.push({ ...preset, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
    }
    // enforce single default per (platform, toolKey)
    if (preset.isDefault) {
      for (const p of all) {
        if (p.platform === preset.platform && p.toolKey === preset.toolKey && p.id !== preset.id) {
          p.isDefault = false;
        }
      }
    }
    write(all);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((p) => p.id !== id));
  }, []);

  const setDefault = useCallback((id: string) => {
    const all = read();
    const target = all.find((p) => p.id === id);
    if (!target) return;
    for (const p of all) {
      if (p.platform === target.platform && p.toolKey === target.toolKey) {
        p.isDefault = p.id === id;
      }
    }
    write(all);
  }, []);

  return { rows: filtered, all: rows, defaultPreset, upsert, remove, setDefault };
}
