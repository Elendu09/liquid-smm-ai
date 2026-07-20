import { useEffect, useSyncExternalStore, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface IntegrationSettings {
  enabled: boolean;
  disabledTools: string[];
  lastUsedAt?: string;
  lastStatus?: "ok" | "error";
  lastError?: string;
  toolCount?: number;
}

type Store = Record<string, IntegrationSettings>;
const KEY = "smmpilot:integration-settings";
const DEFAULT: IntegrationSettings = { enabled: true, disabledTools: [] };

function readLocal(): Store {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Store; } catch { return {}; }
}
function writeLocal(next: Store) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

let cache: Store = readLocal();
let userId: string | null = null;
let hydrated = false;
const listeners = new Set<() => void>();
function setCache(next: Store) {
  cache = next;
  writeLocal(next);
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

async function hydrateFromRemote() {
  const { data } = await supabase.auth.getUser();
  userId = data.user?.id ?? null;
  hydrated = true;
  if (!userId) return;
  const { data: rows } = await supabase.from("integration_settings").select("*").eq("user_id", userId);
  if (!rows) return;
  const next: Store = {};
  for (const r of rows) {
    next[r.slug] = {
      enabled: r.enabled,
      disabledTools: r.disabled_tools ?? [],
      lastUsedAt: r.last_used_at ?? undefined,
      lastStatus: (r.last_status as IntegrationSettings["lastStatus"]) ?? undefined,
      lastError: r.last_error ?? undefined,
      toolCount: r.tool_count ?? undefined,
    };
  }
  setCache(next);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => { if (e.key === KEY) setCache(readLocal()); });
  supabase.auth.onAuthStateChange(() => { hydrated = false; void hydrateFromRemote(); });
}

async function pushRemote(slug: string, patch: Partial<IntegrationSettings>) {
  if (!userId) return;
  const merged = { ...DEFAULT, ...(cache[slug] ?? {}), ...patch };
  await supabase.from("integration_settings").upsert(
    {
      user_id: userId,
      slug,
      enabled: merged.enabled,
      disabled_tools: merged.disabledTools,
      last_used_at: merged.lastUsedAt ?? null,
      last_status: merged.lastStatus ?? null,
      last_error: merged.lastError ?? null,
      tool_count: merged.toolCount ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,slug" },
  );
}

export function useIntegrationSettings(slug?: string) {
  const store = useSyncExternalStore(subscribe, () => cache, () => cache);
  useEffect(() => { if (!hydrated) void hydrateFromRemote(); }, []);

  const get = useCallback(
    (s: string): IntegrationSettings => ({ ...DEFAULT, ...(store[s] ?? {}) }),
    [store],
  );

  const update = useCallback((s: string, patch: Partial<IntegrationSettings>) => {
    const next = { ...cache };
    next[s] = { ...DEFAULT, ...(next[s] ?? {}), ...patch };
    setCache(next);
    void pushRemote(s, patch);
  }, []);

  const toggleTool = useCallback((s: string, tool: string) => {
    const cur = cache[s] ?? DEFAULT;
    const disabled = new Set(cur.disabledTools ?? []);
    disabled.has(tool) ? disabled.delete(tool) : disabled.add(tool);
    update(s, { disabledTools: [...disabled] });
  }, [update]);

  const markUsed = useCallback(
    (s: string, status: "ok" | "error", extra?: { toolCount?: number; error?: string }) =>
      update(s, {
        lastUsedAt: new Date().toISOString(),
        lastStatus: status,
        toolCount: extra?.toolCount,
        lastError: extra?.error,
      }),
    [update],
  );

  return {
    all: store,
    settings: slug ? get(slug) : undefined,
    get,
    update,
    toggleTool,
    markUsed,
  };
}

export function timeAgo(iso?: string) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
