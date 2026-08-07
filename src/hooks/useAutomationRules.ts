import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Bot/automation rule as consumed by the Engage → Bot view. */
export interface BotRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  runs: number;
  /** Visual flow (n8n-style pipeline): an ordered list of nodes. */
  flow?: FlowNode[];
}

export type FlowNodeType = "trigger" | "condition" | "action";

/** Explicit connection between two nodes (supports branching). */
export interface FlowEdge {
  from: string;
  to: string;
  /** Optional branch label, e.g. "true" / "false" on a condition. */
  branch?: string;
}

/**
 * One node in a rule's visual flow. Nodes carry a canvas position; when `edges`
 * are absent on the rule, nodes are treated as a linear chain (legacy rules).
 */
export interface FlowNode {
  id: string;
  type: FlowNodeType;
  kind: string;
  label: string;
  params: Record<string, string>;
  position?: { x: number; y: number };
  disabled?: boolean;
  edges?: FlowEdge[];
  /** Optional runtime metadata added by the visual editor. */
  runCount?: number;
  lastRunAt?: string;
  notes?: string;
  metadata?: Record<string, string>;
}


const STORAGE_KEY = "smmpilot:engage:bot-rules";
const RULE_KIND = "engagement-bot";

type Mode = "local" | "remote";
let mode: Mode = "local";
let remoteUserId: string | null = null;
let cache: BotRule[] = readLocal();
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }
function setCache(next: BotRule[]) { cache = next; emit(); }
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }

function readLocal(): BotRule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BotRule[]) : [];
  } catch { return []; }
}
function writeLocal(next: BotRule[]) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  setCache(next);
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (mode === "local" && e.key === STORAGE_KEY) setCache(readLocal());
  });
}

type Row = {
  id: string; name: string; enabled: boolean; kind: string;
  config: { trigger?: string; action?: string; runs?: number; flow?: FlowNode[] } | null;
  created_at: string;
};

const rowToRule = (r: Row): BotRule => ({
  id: r.id,
  name: r.name,
  trigger: r.config?.trigger ?? "",
  action: r.config?.action ?? "",
  enabled: r.enabled,
  runs: r.config?.runs ?? 0,
  flow: r.config?.flow,
});

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let hydrationPromise: Promise<void> | null = null;

async function refetch() {
  const { data } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("kind", RULE_KIND)
    .order("created_at", { ascending: false });
  setCache(((data as unknown as Row[] | null) ?? []).map(rowToRule));
}

async function hydrateRemote(userId: string) {
  await refetch();
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  realtimeChannel = supabase
    .channel(`automation_rules:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "automation_rules", filter: `user_id=eq.${userId}` },
      () => { void refetch(); },
    )
    .subscribe();
}

async function ensureAuthMode() {
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id ?? null;
    if (uid) { mode = "remote"; remoteUserId = uid; await hydrateRemote(uid); }
    else { mode = "local"; remoteUserId = null; setCache(readLocal()); }
  })();
  return hydrationPromise;
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((_evt, session) => {
    const uid = session?.user?.id ?? null;
    if (uid && uid !== remoteUserId) {
      mode = "remote"; remoteUserId = uid; hydrationPromise = null;
      void hydrateRemote(uid);
    } else if (!uid && mode !== "local") {
      mode = "local"; remoteUserId = null;
      if (realtimeChannel) { supabase.removeChannel(realtimeChannel); realtimeChannel = null; }
      hydrationPromise = null;
      setCache(readLocal());
    }
  });
}

export function useAutomationRules() {
  const items = useSyncExternalStore(subscribe, () => cache, () => cache);

  useEffect(() => { void ensureAuthMode(); }, []);

  const add = (rule: BotRule) => {
    if (mode === "remote" && remoteUserId) {
      setCache([rule, ...cache]);
      void supabase.from("automation_rules").insert({
        id: rule.id,
        user_id: remoteUserId,
        kind: RULE_KIND,
        name: rule.name,
        enabled: rule.enabled,
        config: { trigger: rule.trigger, action: rule.action, runs: rule.runs, flow: rule.flow },
      } as never).then(({ error }) => {
        if (error) setCache(cache.filter((r) => r.id !== rule.id));
      });
    } else {
      writeLocal([rule, ...cache]);
    }
    return rule;
  };

  const update = (id: string, patch: Partial<BotRule>) => {
    const cur = cache.find((r) => r.id === id);
    if (!cur) return;
    const merged = { ...cur, ...patch };
    setCache(cache.map((r) => (r.id === id ? merged : r)));
    if (mode === "remote" && remoteUserId) {
      const row: Record<string, unknown> = {};
      if (patch.name !== undefined) row.name = merged.name;
      if (patch.enabled !== undefined) row.enabled = merged.enabled;
      if (patch.trigger !== undefined || patch.action !== undefined || patch.runs !== undefined || patch.flow !== undefined) {
        row.config = { trigger: merged.trigger, action: merged.action, runs: merged.runs, flow: merged.flow };
      }
      void supabase.from("automation_rules").update(row as never).eq("id", id);
    } else {
      writeLocal(cache);
    }
  };

  const remove = (id: string) => {
    const next = cache.filter((r) => r.id !== id);
    if (mode === "remote" && remoteUserId) {
      setCache(next);
      void supabase.from("automation_rules").delete().eq("id", id);
    } else {
      writeLocal(next);
    }
  };

  const setItems = (next: BotRule[]) => {
    if (mode === "remote" && remoteUserId) setCache(next);
    else writeLocal(next);
  };

  return { items, add, update, remove, setItems };
}
