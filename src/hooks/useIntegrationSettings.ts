import { useSyncExternalStore, useCallback } from "react";

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

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

let cache: Store = read();
const listeners = new Set<() => void>();
function emit() {
  cache = read();
  listeners.forEach((l) => l());
}
function write(next: Store) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => e.key === KEY && emit());
}

const DEFAULT: IntegrationSettings = { enabled: true, disabledTools: [] };

export function useIntegrationSettings(slug?: string) {
  const store = useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => cache,
    () => cache,
  );

  const get = useCallback(
    (s: string): IntegrationSettings => ({ ...DEFAULT, ...(store[s] ?? {}) }),
    [store],
  );

  const update = useCallback(
    (s: string, patch: Partial<IntegrationSettings>) => {
      const next = { ...read() };
      next[s] = { ...DEFAULT, ...(next[s] ?? {}), ...patch };
      write(next);
    },
    [],
  );

  const toggleTool = useCallback((s: string, tool: string) => {
    const cur = read()[s] ?? DEFAULT;
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
