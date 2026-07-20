import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isGuestSession } from "@/hooks/useGuest";

export type McpActivityStatus = "success" | "error" | "pending";

export interface McpResource {
  kind: "scheduled-post" | "caption" | "segment" | "note";
  id: string;
  label: string;
  href?: string;
}

export interface McpActivityEntry {
  id: string;
  timestamp: string;
  tool: string;
  status: McpActivityStatus;
  summary: string;
  resources?: McpResource[];
  payload?: unknown;
}

const KEY = "smmpilot:mcp-activity";

function readLocal(): McpActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as McpActivityEntry[]) : [];
  } catch { return []; }
}
function writeLocal(next: McpActivityEntry[]) {
  window.localStorage.setItem(KEY, JSON.stringify(next.slice(0, 500)));
  cache = next.slice(0, 500);
  listeners.forEach((l) => l());
}

let cache: McpActivityEntry[] = readLocal();
const listeners = new Set<() => void>();
let hydrated = false;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function rowToEntry(row: any): McpActivityEntry {
  return {
    id: row.id,
    timestamp: row.created_at,
    tool: row.tool,
    status: row.status === "ok" ? "success" : row.status === "error" ? "error" : "pending",
    summary: (row.output && row.output.summary) ?? row.tool,
    resources: row.output?.resources,
    payload: row.input,
  };
}

async function hydrate() {
  hydrated = true;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const { data } = await supabase
    .from("mcp_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (data) writeLocal(data.map(rowToEntry));
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) { cache = readLocal(); listeners.forEach((l) => l()); }
  });
  supabase.auth.onAuthStateChange(() => { hydrated = false; void hydrate(); });
}

export async function logMcpCall(entry: Omit<McpActivityEntry, "id" | "timestamp"> & { timestamp?: string }) {
  if (typeof window === "undefined") return;
  const full: McpActivityEntry = {
    id: crypto.randomUUID(),
    timestamp: entry.timestamp ?? new Date().toISOString(),
    ...entry,
  };
  writeLocal([full, ...cache]);
  if (isGuestSession()) return full;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return full;
  await supabase.from("mcp_activity").insert({
    user_id: auth.user.id,
    tool: entry.tool,
    input: (entry.payload as any) ?? {},
    output: { summary: entry.summary, resources: (entry.resources ?? []) as any } as any,
    status: entry.status === "success" ? "ok" : entry.status,
  });
  return full;
}

export function useMcpActivity() {
  const entries = useSyncExternalStore(subscribe, () => cache, () => cache);
  useEffect(() => { if (!hydrated) void hydrate(); }, []);
  const clear = async () => {
    writeLocal([]);
    if (isGuestSession()) return;
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) await supabase.from("mcp_activity").delete().eq("user_id", auth.user.id);
  };
  const remove = async (id: string) => {
    writeLocal(cache.filter((e) => e.id !== id));
    if (isGuestSession()) return;
    await supabase.from("mcp_activity").delete().eq("id", id);
  };
  return { entries, clear, remove, log: logMcpCall };
}
