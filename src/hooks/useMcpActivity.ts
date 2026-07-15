import { useSyncExternalStore } from "react";

export type McpActivityStatus = "success" | "error" | "pending";

export interface McpResource {
  kind: "scheduled-post" | "caption" | "segment" | "note";
  id: string;
  label: string;
  href?: string;
}

export interface McpActivityEntry {
  id: string;
  timestamp: string; // ISO
  tool: string;
  status: McpActivityStatus;
  summary: string;
  resources?: McpResource[];
  payload?: unknown;
}

const KEY = "smmpilot:mcp-activity";

function read(): McpActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as McpActivityEntry[]) : [];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
let cache: McpActivityEntry[] = read();

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}

function write(next: McpActivityEntry[]) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) emit();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function logMcpCall(entry: Omit<McpActivityEntry, "id" | "timestamp"> & { timestamp?: string }) {
  if (typeof window === "undefined") return;
  const full: McpActivityEntry = {
    id: crypto.randomUUID(),
    timestamp: entry.timestamp ?? new Date().toISOString(),
    ...entry,
  };
  write([full, ...read()].slice(0, 500));
  return full;
}

export function useMcpActivity() {
  const entries = useSyncExternalStore(subscribe, () => cache, () => cache);
  const clear = () => write([]);
  const remove = (id: string) => write(read().filter((e) => e.id !== id));
  return { entries, clear, remove, log: logMcpCall };
}
