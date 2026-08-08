import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isGuestSession } from "@/hooks/useGuest";
import {
  createDefaultReshareFlow,
  type ReshareFlow,
} from "@/config/reshare";

/**
 * Persistent reshare workflow store.
 *
 * Authenticated workspaces use the existing automation_rules table with the
 * dedicated `reshare-flow` kind, so this feature does not require the inbox or
 * bot-rule records to understand delivery-specific fields. Guests get an
 * isolated local preview and can still explore the full studio.
 */
const STORAGE_KEY = "smmpilot:engage:reshare-flows";
const DEMO_RESHARE_FLOWS: ReshareFlow[] = [
  { id: "reshare-1", name: "Repurpose launch → X + LinkedIn", enabled: true, destinations: [{ platformId: "twitter", enabled: true, transform: "shorten", delayMinutes: 0 } as any, { platformId: "linkedin", enabled: true, transform: "professional", delayMinutes: 60 } as any], mode: "n8n", requireApproval: false, metrics: { runs: 12, delivered: 11, queued: 1, failed: 0, savedMinutes: 240 }, description: "One idea, two channels", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as unknown as ReshareFlow,
  { id: "reshare-2", name: "Story → Reel repurpose", enabled: true, destinations: [{ platformId: "instagram", enabled: true, transform: "clip", delayMinutes: 30 } as any], mode: "n8n", requireApproval: true, metrics: { runs: 8, delivered: 6, queued: 2, failed: 0, savedMinutes: 120 }, description: "IG story to Reel", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as unknown as ReshareFlow,
  { id: "reshare-3", name: "Evergreen recycle", enabled: false, destinations: [{ platformId: "facebook", enabled: true, transform: "recycle", delayMinutes: 1440 } as any], mode: "n8n", requireApproval: false, metrics: { runs: 20, delivered: 20, queued: 0, failed: 1, savedMinutes: 600 }, description: "Auto-recycle top posts", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as unknown as ReshareFlow,
];
const RULE_KIND = "reshare-flow";

type Mode = "local" | "remote";
let mode: Mode = "local";
let remoteUserId: string | null = null;
let cache: ReshareFlow[] = readLocal();
const listeners = new Set<() => void>();
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let hydrationPromise: Promise<void> | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function setCache(next: ReshareFlow[]) {
  cache = next;
  emit();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function readLocal(): ReshareFlow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ReshareFlow[];
      if (parsed.length > 0) return parsed;
    }
    if (isGuestSession()) {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_RESHARE_FLOWS)); } catch {}
      return DEMO_RESHARE_FLOWS;
    }
    return raw ? (JSON.parse(raw) as ReshareFlow[]) : [];
  } catch {
    return isGuestSession() ? DEMO_RESHARE_FLOWS : [];
  }
}

function writeLocal(next: ReshareFlow[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be disabled in privacy mode; the in-memory store still works.
  }
  setCache(next);
}

type RemoteRow = {
  id: string;
  name: string;
  enabled: boolean;
  config: { reshare?: ReshareFlow } | null;
};

function rowToFlow(row: RemoteRow): ReshareFlow | null {
  const flow = row.config?.reshare;
  if (!flow) return null;
  return { ...flow, id: row.id, name: row.name, enabled: row.enabled };
}

async function refetch() {
  const { data } = await supabase
    .from("automation_rules")
    .select("id,name,enabled,config")
    .eq("kind", RULE_KIND)
    .order("created_at", { ascending: false });
  const flows = ((data as unknown as RemoteRow[] | null) ?? [])
    .map(rowToFlow)
    .filter((flow): flow is ReshareFlow => Boolean(flow));
  setCache(flows);
}

async function hydrateRemote(userId: string) {
  await refetch();
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  realtimeChannel = supabase
    .channel(`reshare_flows:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "automation_rules", filter: `user_id=eq.${userId}` },
      () => {
        void refetch();
      },
    )
    .subscribe();
}

async function ensureAuthMode() {
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id ?? null;
    if (userId) {
      mode = "remote";
      remoteUserId = userId;
      await hydrateRemote(userId);
    } else {
      mode = "local";
      remoteUserId = null;
      setCache(readLocal());
    }
  })();
  return hydrationPromise;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (mode === "local" && event.key === STORAGE_KEY) setCache(readLocal());
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    const userId = session?.user?.id ?? null;
    if (userId && userId !== remoteUserId) {
      mode = "remote";
      remoteUserId = userId;
      hydrationPromise = null;
      void hydrateRemote(userId);
    } else if (!userId && mode !== "local") {
      mode = "local";
      remoteUserId = null;
      hydrationPromise = null;
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
      setCache(readLocal());
    }
  });
}

export interface ReshareFlowPatch extends Partial<ReshareFlow> {
  metrics?: Partial<ReshareFlow["metrics"]>;
}

export function useReshareFlows() {
  const items = useSyncExternalStore(subscribe, () => cache, () => cache);

  useEffect(() => {
    void ensureAuthMode();
  }, []);

  const add = (flow: ReshareFlow) => {
    if (mode === "remote" && remoteUserId) {
      setCache([flow, ...cache]);
      void supabase
        .from("automation_rules")
        .insert({
          id: flow.id,
          user_id: remoteUserId,
          kind: RULE_KIND,
          name: flow.name,
          enabled: flow.enabled,
          config: { reshare: flow },
        } as never)
        .then(({ error }) => {
          if (error) setCache(cache.filter((item) => item.id !== flow.id));
        });
    } else {
      writeLocal([flow, ...cache]);
    }
    return flow;
  };

  const update = (id: string, patch: ReshareFlowPatch) => {
    const current = cache.find((flow) => flow.id === id);
    if (!current) return;
    const merged: ReshareFlow = {
      ...current,
      ...patch,
      metrics: { ...current.metrics, ...(patch.metrics ?? {}) },
      updatedAt: new Date().toISOString(),
    };
    const next = cache.map((flow) => (flow.id === id ? merged : flow));
    setCache(next);
    if (mode === "remote" && remoteUserId) {
      void supabase
        .from("automation_rules")
        .update({
          name: merged.name,
          enabled: merged.enabled,
          config: { reshare: merged },
        } as never)
        .eq("id", id);
    } else {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Keep the in-memory update.
      }
    }
  };

  const remove = (id: string) => {
    const next = cache.filter((flow) => flow.id !== id);
    if (mode === "remote" && remoteUserId) {
      setCache(next);
      void supabase.from("automation_rules").delete().eq("id", id);
    } else {
      writeLocal(next);
    }
  };

  const duplicate = (flow: ReshareFlow) => {
    const copy: ReshareFlow = {
      ...flow,
      id: typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0").slice(-12)}`,
      name: `${flow.name} copy`,
      enabled: false,
      metrics: { runs: 0, delivered: 0, queued: 0, failed: 0, savedMinutes: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    add(copy);
    return copy;
  };

  const seed = () => {
    if (cache.length > 0) return cache;
    const first = createDefaultReshareFlow("instagram");
    const second = {
      ...createDefaultReshareFlow("youtube"),
      name: "Video launch relay",
      description: "Turn new videos into Shorts, Reels, and a LinkedIn teaser.",
      destinations: ["tiktok", "instagram", "linkedin", "twitter"].map((platformId) => ({
        platformId,
        enabled: true,
        transform: platformId === "twitter" ? "shorten" : "visual",
        delayMinutes: platformId === "twitter" ? 90 : 30,
      })),
      mode: "n8n" as const,
      requireApproval: false,
      metrics: { runs: 12, delivered: 46, queued: 0, failed: 0, savedMinutes: 390 },
    };
    const next = [first, second];
    if (mode === "remote") {
      next.forEach(add);
    } else {
      writeLocal(next);
    }
    return next;
  };

  return { items, add, update, remove, duplicate, seed };
}
