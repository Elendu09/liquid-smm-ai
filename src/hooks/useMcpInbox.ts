import { useSyncExternalStore } from "react";

/**
 * Pending intents produced by MCP tool calls. Write-capable tools mark
 * items with `needsApproval: true`; the app only drains items whose
 * `status` is "approved". Rejected items are kept for the audit trail
 * but never applied.
 */
export type McpInboxKind = "caption-draft" | "scheduled-post";
export type McpInboxStatus = "pending" | "approved" | "rejected";

export interface McpInboxItem<TPayload = unknown> {
  id: string;
  kind: McpInboxKind;
  createdAt: string;
  source: string;
  payload: TPayload;
  needsApproval?: boolean;
  status: McpInboxStatus;
  decidedAt?: string;
}

const KEY = "smmpilot:mcp-inbox";

function read(): McpInboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as McpInboxItem[]) : [];
    // Back-compat: legacy items without status default to approved.
    return parsed.map((it) => ({ ...it, status: it.status ?? "approved" }));
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

export function enqueueInbox<T>(
  item: Omit<McpInboxItem<T>, "id" | "createdAt" | "status"> & { status?: McpInboxStatus },
) {
  const full: McpInboxItem<T> = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: item.needsApproval ? "pending" : (item.status ?? "approved"),
    ...item,
  };
  write([full, ...read()]);
  return full;
}

export function approveInboxItem(id: string) {
  write(
    read().map((it) =>
      it.id === id ? { ...it, status: "approved", decidedAt: new Date().toISOString() } : it,
    ),
  );
}

export function rejectInboxItem(id: string) {
  write(
    read().map((it) =>
      it.id === id ? { ...it, status: "rejected", decidedAt: new Date().toISOString() } : it,
    ),
  );
}

export function removeInboxItem(id: string) {
  write(read().filter((it) => it.id !== id));
}

export function useMcpInbox() {
  const items = useSyncExternalStore(subscribe, () => cache, () => cache);
  /** Drains only APPROVED items of the given kind. Pending items stay put. */
  const drain = (kind: McpInboxKind): McpInboxItem[] => {
    const all = read();
    const take = all.filter((it) => it.kind === kind && it.status === "approved");
    if (take.length === 0) return [];
    const keep = all.filter((it) => !(it.kind === kind && it.status === "approved"));
    write(keep);
    return take;
  };
  const pending = items.filter((it) => it.status === "pending");
  return {
    items,
    pending,
    drain,
    enqueue: enqueueInbox,
    approve: approveInboxItem,
    reject: rejectInboxItem,
    remove: removeInboxItem,
  };
}
