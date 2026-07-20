import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isGuestSession } from "@/hooks/useGuest";

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

function readLocal(): McpInboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as McpInboxItem[]) : [];
    return parsed.map((it) => ({ ...it, status: it.status ?? "approved" }));
  } catch { return []; }
}
function writeLocal(next: McpInboxItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  cache = next;
  listeners.forEach((l) => l());
}

let cache: McpInboxItem[] = readLocal();
const listeners = new Set<() => void>();
let hydrated = false;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function rowToItem(row: any): McpInboxItem {
  return {
    id: row.id,
    kind: row.kind,
    createdAt: row.created_at,
    source: (row.data as any)?.source ?? "mcp",
    payload: (row.data as any)?.payload ?? {},
    needsApproval: (row.data as any)?.needsApproval,
    status: (row.data as any)?.status ?? "approved",
    decidedAt: (row.data as any)?.decidedAt,
  };
}

async function hydrate() {
  hydrated = true;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const { data } = await supabase
    .from("mcp_inbox")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (data) writeLocal(data.map(rowToItem));
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) { cache = readLocal(); listeners.forEach((l) => l()); }
  });
  supabase.auth.onAuthStateChange(() => { hydrated = false; void hydrate(); });
}

async function pushRemote(item: McpInboxItem) {
  if (isGuestSession()) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from("mcp_inbox").upsert({
    id: item.id,
    user_id: auth.user.id,
    kind: item.kind,
    title: item.source,
    body: null,
    data: {
      source: item.source,
      payload: item.payload,
      needsApproval: item.needsApproval,
      status: item.status,
      decidedAt: item.decidedAt,
    } as any,
  });
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
  writeLocal([full, ...cache]);
  void pushRemote(full);
  return full;
}

export function approveInboxItem(id: string) {
  const next = cache.map((it) =>
    it.id === id ? { ...it, status: "approved" as const, decidedAt: new Date().toISOString() } : it,
  );
  writeLocal(next);
  const updated = next.find((it) => it.id === id);
  if (updated) void pushRemote(updated);
}
export function rejectInboxItem(id: string) {
  const next = cache.map((it) =>
    it.id === id ? { ...it, status: "rejected" as const, decidedAt: new Date().toISOString() } : it,
  );
  writeLocal(next);
  const updated = next.find((it) => it.id === id);
  if (updated) void pushRemote(updated);
}
export function removeInboxItem(id: string) {
  writeLocal(cache.filter((it) => it.id !== id));
  if (isGuestSession()) return;
  void supabase.from("mcp_inbox").delete().eq("id", id);
}

export function useMcpInbox() {
  const items = useSyncExternalStore(subscribe, () => cache, () => cache);
  useEffect(() => { if (!hydrated) void hydrate(); }, []);
  const drain = (kind: McpInboxKind): McpInboxItem[] => {
    const take = cache.filter((it) => it.kind === kind && it.status === "approved");
    if (take.length === 0) return [];
    const keep = cache.filter((it) => !(it.kind === kind && it.status === "approved"));
    writeLocal(keep);
    if (!isGuestSession()) {
      void supabase.from("mcp_inbox").delete().in("id", take.map((t) => t.id));
    }
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
