import { useCallback, useEffect, useMemo, useState } from "react";

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

const KEY = "smmpilot:templates";
const emit = () => window.dispatchEvent(new Event("smmpilot:templates-change"));

function read(): ContentTemplate[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as ContentTemplate[];
  } catch {
    /* ignore */
  }
  return seed();
}
function write(rows: ContentTemplate[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
    emit();
  } catch {
    /* ignore */
  }
}
function seed(): ContentTemplate[] {
  const now = new Date().toISOString();
  const rows: ContentTemplate[] = [
    {
      id: crypto.randomUUID(),
      platform: "instagram",
      toolKey: "caption-generator",
      name: "Product Launch",
      body: "🚀 Introducing {{product}} — {{tagline}}. Get yours today: {{link}}",
      tags: ["launch", "product"],
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      platform: "instagram",
      toolKey: "story-automation",
      name: "Poll Story",
      body: "Which one do you prefer? {{option_a}} vs {{option_b}}",
      tags: ["engagement", "poll"],
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      platform: "instagram",
      toolKey: "dm-automation",
      name: "Welcome DM",
      body: "Hey {{name}}! Thanks for following. Check out our latest: {{link}}",
      tags: ["welcome"],
      usageCount: 0,
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

export function useContentTemplates(toolKey?: string, platform?: string) {
  const [rows, setRows] = useState<ContentTemplate[]>(read);

  useEffect(() => {
    const sync = () => setRows(read());
    window.addEventListener("smmpilot:templates-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("smmpilot:templates-change", sync);
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

  const upsert = useCallback((tpl: Omit<ContentTemplate, "id" | "createdAt" | "updatedAt" | "usageCount"> & { id?: string; usageCount?: number }) => {
    const all = read();
    const now = new Date().toISOString();
    if (tpl.id) {
      const idx = all.findIndex((t) => t.id === tpl.id);
      if (idx >= 0) all[idx] = { ...all[idx], ...tpl, updatedAt: now } as ContentTemplate;
    } else {
      all.push({ ...tpl, usageCount: tpl.usageCount ?? 0, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
    }
    write(all);
  }, []);

  const remove = useCallback((id: string) => write(read().filter((t) => t.id !== id)), []);
  const incrementUsage = useCallback((id: string) => {
    const all = read();
    const t = all.find((x) => x.id === id);
    if (t) {
      t.usageCount += 1;
      t.updatedAt = new Date().toISOString();
      write(all);
    }
  }, []);

  return { rows: filtered, all: rows, upsert, remove, incrementUsage };
}
