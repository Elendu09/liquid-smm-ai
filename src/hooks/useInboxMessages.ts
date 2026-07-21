import { useEffect, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isGuestSession } from "@/hooks/useGuest";
import type { InboxItem } from "@/pages/dashboard/views/InboxBoard";

/**
 * Persistent inbox store (comments + DMs) backed by `public.inbox_messages`
 * for authenticated users, with a localStorage fallback for guests.
 * Item shape matches `InboxItem` used by the Engage → Inbox board.
 */

const STORAGE_KEY = (kind: "comment" | "dm") => `smmpilot:engage:${kind}`;

type Row = {
  id: string;
  kind: string; // "comment" | "dm"
  author: string | null;
  body: string | null;
  status: string;
  data: { handle?: string; platform?: string; scheduledFor?: string } | null;
  received_at: string;
};

const rowToItem = (r: Row): InboxItem => ({
  id: r.id,
  author: r.author ?? "",
  handle: r.data?.handle ?? "",
  platform: r.data?.platform ?? "instagram",
  message: r.body ?? "",
  createdAt: r.received_at,
  status: (r.status as InboxItem["status"]) ?? "new",
  kind: (r.kind as "comment" | "dm") ?? "comment",
  scheduledFor: r.data?.scheduledFor,
});

/* ---------------- module cache per kind ---------------- */

type Bucket = {
  cache: InboxItem[];
  listeners: Set<() => void>;
  channel: ReturnType<typeof supabase.channel> | null;
  hydration: Promise<void> | null;
};
const buckets: Record<"comment" | "dm", Bucket> = {
  comment: { cache: initialCache("comment"), listeners: new Set(), channel: null, hydration: null },
  dm: { cache: initialCache("dm"), listeners: new Set(), channel: null, hydration: null },
};

function initialCache(kind: "comment" | "dm"): InboxItem[] {
  // Real users must never see the demo seed / stale guest localStorage.
  if (typeof window === "undefined") return [];
  if (!isGuestSession()) return [];
  return readLocal(kind);
}

let mode: "local" | "remote" = "local";
let remoteUserId: string | null = null;

function emit(kind: "comment" | "dm") { buckets[kind].listeners.forEach((l) => l()); }
function setCache(kind: "comment" | "dm", next: InboxItem[]) { buckets[kind].cache = next; emit(kind); }

function readLocal(kind: "comment" | "dm"): InboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(kind));
    return raw ? (JSON.parse(raw) as InboxItem[]) : [];
  } catch { return []; }
}
function writeLocal(kind: "comment" | "dm", next: InboxItem[]) {
  try { window.localStorage.setItem(STORAGE_KEY(kind), JSON.stringify(next)); } catch { /* ignore */ }
  setCache(kind, next);
}

async function refetch(kind: "comment" | "dm") {
  const { data } = await supabase
    .from("inbox_messages")
    .select("*")
    .eq("kind", kind)
    .order("received_at", { ascending: false });
  setCache(kind, ((data as unknown as Row[] | null) ?? []).map(rowToItem));
}

async function hydrateRemote(kind: "comment" | "dm", userId: string) {
  await refetch(kind);
  const b = buckets[kind];
  if (b.channel) supabase.removeChannel(b.channel);
  b.channel = supabase
    .channel(`inbox_messages:${kind}:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "inbox_messages", filter: `user_id=eq.${userId}` },
      () => { void refetch(kind); },
    )
    .subscribe();
}

async function ensureAuthMode(kind: "comment" | "dm") {
  const b = buckets[kind];
  if (b.hydration) return b.hydration;
  b.hydration = (async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id ?? null;
    if (uid) { mode = "remote"; remoteUserId = uid; await hydrateRemote(kind, uid); }
    else { mode = "local"; remoteUserId = null; setCache(kind, isGuestSession() ? readLocal(kind) : []); }
  })();
  return b.hydration;
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((_evt, session) => {
    const uid = session?.user?.id ?? null;
    (["comment", "dm"] as const).forEach((kind) => {
      const b = buckets[kind];
      if (uid && uid !== remoteUserId) {
        mode = "remote"; remoteUserId = uid; b.hydration = null;
        void hydrateRemote(kind, uid);
      } else if (!uid && mode !== "local") {
        mode = "local"; remoteUserId = null;
        if (b.channel) { supabase.removeChannel(b.channel); b.channel = null; }
        b.hydration = null;
        setCache(kind, isGuestSession() ? readLocal(kind) : []);
      }
    });
    if (!uid) { mode = "local"; remoteUserId = null; }
  });
}

export function useInboxMessages(kind: "comment" | "dm") {
  const bucket = buckets[kind];
  const items = useSyncExternalStore(
    (cb) => { bucket.listeners.add(cb); return () => bucket.listeners.delete(cb); },
    () => bucket.cache,
    () => bucket.cache,
  );

  useEffect(() => { void ensureAuthMode(kind); }, [kind]);

  const update = (id: string, patch: Partial<InboxItem>) => {
    const cur = bucket.cache.find((i) => i.id === id);
    if (!cur) return;
    const merged = { ...cur, ...patch };
    setCache(kind, bucket.cache.map((i) => (i.id === id ? merged : i)));
    if (mode === "remote" && remoteUserId) {
      const row: Record<string, unknown> = {};
      if (patch.status !== undefined) row.status = merged.status;
      if (patch.author !== undefined) row.author = merged.author;
      if (patch.message !== undefined) row.body = merged.message;
      if (patch.handle !== undefined || patch.platform !== undefined || patch.scheduledFor !== undefined) {
        row.data = { handle: merged.handle, platform: merged.platform, scheduledFor: merged.scheduledFor };
      }
      void supabase.from("inbox_messages").update(row as never).eq("id", id);
    } else {
      writeLocal(kind, bucket.cache);
    }
  };

  const add = (item: InboxItem) => {
    if (mode === "remote" && remoteUserId) {
      setCache(kind, [item, ...bucket.cache]);
      void supabase.from("inbox_messages").insert({
        id: item.id,
        user_id: remoteUserId,
        kind: item.kind,
        author: item.author,
        body: item.message,
        status: item.status,
        received_at: item.createdAt,
        data: { handle: item.handle, platform: item.platform, scheduledFor: item.scheduledFor },
      } as never).then(({ error }) => {
        if (error) setCache(kind, bucket.cache.filter((i) => i.id !== item.id));
      });
    } else {
      writeLocal(kind, [item, ...bucket.cache]);
    }
    return item;
  };

  const remove = (id: string) => {
    const next = bucket.cache.filter((i) => i.id !== id);
    if (mode === "remote" && remoteUserId) {
      setCache(kind, next);
      void supabase.from("inbox_messages").delete().eq("id", id);
    } else {
      writeLocal(kind, next);
    }
  };

  const setItems = (next: InboxItem[]) => {
    if (mode === "remote" && remoteUserId) setCache(kind, next);
    else writeLocal(kind, next);
  };

  return useMemo(() => ({ items, add, update, remove, setItems }), [items]);
}
