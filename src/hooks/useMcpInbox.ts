import { useSyncExternalStore } from "react";

/**
 * Pending intents produced by MCP tool calls that must be applied
 * inside the user's browser (which owns the localStorage-backed data).
 *
 * MCP handlers run in a Deno edge function and cannot write to the
 * browser's localStorage directly. When a real cross-device backend is
 * added, this hook can be swapped for a Supabase-backed queue without
 * changing consumers.
 */
export type McpInboxKind = "caption-draft" | "scheduled-post";

export interface McpInboxItem<TPayload = unknown> {
  id: string;
  kind: McpInboxKind;
  createdAt: string;
  source: string; // e.g. "mcp:create_caption_draft"
  payload: TPayload;
}

const KEY = "smmpilot:mcp-inbox";

function read(): McpInboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as McpInboxItem[]) : [];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
let cache: McpInboxItem[] = read();

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}

function write(next: McpInboxItem[]) {
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

export function enqueueInbox<T>(item: Omit<McpInboxItem<T>, "id" | "createdAt">) {
  const full: McpInboxItem<T> = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...item,
  };
  write([full, ...read()]);
  return full;
}

export function useMcpInbox() {
  const items = useSyncExternalStore(subscribe, () => cache, () => cache);
  const drain = (kind: McpInboxKind): McpInboxItem[] => {
    const [take, keep] = read().reduce<[McpInboxItem[], McpInboxItem[]]>(
      (acc, it) => {
        if (it.kind === kind) acc[0].push(it);
        else acc[1].push(it);
        return acc;
      },
      [[], []],
    );
    if (take.length > 0) write(keep);
    return take;
  };
  return { items, drain, enqueue: enqueueInbox };
}
