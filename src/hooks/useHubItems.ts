import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client"
import type { Json } from "@/integrations/supabase/types";
import { isGuestSession } from "@/hooks/useGuest";

export interface HubItem {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  meta?: string;
  metadata?: Json;
  createdAt: string;
}

interface Row {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  meta: string | null;
  metadata: Json | null;
  created_at: string;
}

const fromRow = (r: Row): HubItem => ({
  id: r.id,
  title: r.title,
  subtitle: r.subtitle ?? undefined,
  status: r.status,
  meta: r.meta ?? undefined,
  metadata: r.metadata ?? undefined,
  createdAt: r.created_at,
});

const localKey = (hubKey: string) => `hub_items:${hubKey}`;

function readLocal(hubKey: string, seed: HubItem[]): HubItem[] {
  try {
    const raw = localStorage.getItem(localKey(hubKey));
    if (raw) return JSON.parse(raw);
    localStorage.setItem(localKey(hubKey), JSON.stringify(seed));
    return seed;
  } catch {
    return seed;
  }
}
function writeLocal(hubKey: string, items: HubItem[]) {
  try { localStorage.setItem(localKey(hubKey), JSON.stringify(items)); } catch { /* ignore */ }
}

/**
 * Per-hubKey remote collection for the shared `hub_items` table.
 * Guests fall back to localStorage seeded with the same demo array.
 */
export function useHubItems(hubKey: string, seed: HubItem[]) {
  const [items, setItems] = useState<HubItem[]>(() => readLocal(hubKey, seed));
  const [uid, setUid] = useState<string | null>(null);
  const seededRef = useRef(false);

  // Auth-aware hydration
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUid(data.session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUid(session?.user?.id ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!uid) {
      setItems(readLocal(hubKey, seed));
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("hub_items")
        .select("*")
        .eq("hub_key", hubKey)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const rows = ((data as Row[] | null) ?? []).map(fromRow);
      if (rows.length === 0 && !seededRef.current && seed.length) {
        seededRef.current = true;
        const inserts = seed.map((s, i) => ({
          user_id: uid,
          hub_key: hubKey,
          title: s.title,
          subtitle: s.subtitle ?? null,
          status: s.status,
          meta: s.meta ?? null,
          metadata: s.metadata ?? {},
          order_index: i,
        }));
        const { data: seeded } = await supabase
          .from("hub_items")
          .insert(inserts)
          .select("*");
        setItems(((seeded as Row[] | null) ?? []).map(fromRow));
      } else {
        setItems(rows);
      }
    })();

    const channel = supabase
      .channel(`hub_items:${hubKey}:${uid}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "hub_items", filter: `user_id=eq.${uid}` },
        async () => {
          const { data } = await supabase
            .from("hub_items")
            .select("*")
            .eq("hub_key", hubKey)
            .order("order_index", { ascending: true })
            .order("created_at", { ascending: false });
          setItems(((data as Row[] | null) ?? []).map(fromRow));
        },
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [uid, hubKey, seed]);

  const add = useCallback(async (item: HubItem) => {
    const next = [item, ...items];
    setItems(next);
    if (!uid) { writeLocal(hubKey, next); return; }
    if (isGuestSession()) return;
    const { error } = await supabase.from("hub_items").insert({
      id: item.id,
      user_id: uid,
      hub_key: hubKey,
      title: item.title,
      subtitle: item.subtitle ?? null,
      status: item.status,
      meta: item.meta ?? null,
      metadata: item.metadata ?? {},
    });
    if (error) setItems(items);
  }, [items, uid, hubKey]);

  const update = useCallback(async (id: string, patch: Partial<HubItem>) => {
    const next = items.map((x) => (x.id === id ? { ...x, ...patch } : x));
    setItems(next);
    if (!uid) { writeLocal(hubKey, next); return; }
    if (isGuestSession()) return;
    const row: Record<string, Json | string | null> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.subtitle !== undefined) row.subtitle = patch.subtitle;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.meta !== undefined) row.meta = patch.meta;
    if (patch.metadata !== undefined) row.metadata = patch.metadata;
    if (Object.keys(row).length) {
      await (supabase.from("hub_items") as unknown as { update: (r: unknown) => { eq: (c: string, v: string) => Promise<unknown> } }).update(row).eq("id", id);
    }
  }, [items, uid, hubKey]);

  const remove = useCallback(async (id: string) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    if (!uid) { writeLocal(hubKey, next); return; }
    if (isGuestSession()) return;
    await supabase.from("hub_items").delete().eq("id", id);
  }, [items, uid, hubKey]);

  return { items, add, update, remove };
}
