import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isGuestSession } from "@/hooks/useGuest";

/**
 * Shared module-cache pattern for per-user tables that used to be
 * localStorage-only. Signed-in users read/write Supabase (with realtime).
 * Guests fall back to localStorage — same UX as before auth existed.
 *
 * Consumers implement `fromRow` / `toRow` so we don't need generic SQL
 * codegen, and the hook stays a thin `useSyncExternalStore` wrapper.
 */

export interface RemoteCollectionOptions<TItem extends { id: string }, TRow> {
  /** Supabase table name (typed via generated Database). */
  table: string;
  /** localStorage key used for the guest fallback. */
  localKey: string;
  /** Optional seed applied when the local cache is empty and no user. */
  seed?: TItem[];
  /** Order by clause for the initial fetch. */
  orderBy?: { column: string; ascending?: boolean };
  fromRow: (row: TRow) => TItem;
  /** For inserts we need the full row shape; for updates a partial. */
  toInsertRow: (item: TItem, userId: string) => Record<string, unknown>;
  toUpdateRow: (patch: Partial<TItem>) => Record<string, unknown>;
}

export interface RemoteCollection<TItem extends { id: string }> {
  useItems: () => TItem[];
  /** Snapshot of the current cache (non-reactive). */
  read: () => TItem[];
  add: (item: TItem) => Promise<TItem>;
  update: (id: string, patch: Partial<TItem>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** Replace the entire cache. Local mode writes localStorage; remote is a no-op. */
  replace: (next: TItem[]) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any;

export function createRemoteCollection<TItem extends { id: string }, TRow>(
  opts: RemoteCollectionOptions<TItem, TRow>,
): RemoteCollection<TItem> {
  type Mode = "local" | "remote";
  let mode: Mode = "local";
  let userId: string | null = null;
  let cache: TItem[] = readLocal();
  const listeners = new Set<() => void>();

  function readLocal(): TItem[] {
    if (typeof window === "undefined") return opts.seed ?? [];
    try {
      const raw = window.localStorage.getItem(opts.localKey);
      if (raw) return JSON.parse(raw) as TItem[];
      if (opts.seed) {
        window.localStorage.setItem(opts.localKey, JSON.stringify(opts.seed));
        return opts.seed;
      }
      return [];
    } catch {
      return opts.seed ?? [];
    }
  }
  function writeLocal(next: TItem[]) {
    try { window.localStorage.setItem(opts.localKey, JSON.stringify(next)); } catch { /* ignore */ }
    setCache(next);
  }
  function setCache(next: TItem[]) {
    cache = next;
    listeners.forEach((l) => l());
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (mode === "local" && e.key === opts.localKey) setCache(readLocal());
    });
  }

  let channel: ReturnType<typeof supabase.channel> | null = null;
  let hydration: Promise<void> | null = null;

  async function hydrate(uid: string) {
    let q = (supabase.from as AnyTable)(opts.table).select("*");
    if (opts.orderBy) q = q.order(opts.orderBy.column, { ascending: opts.orderBy.ascending ?? true });
    const { data } = await q;
    setCache(((data as TRow[] | null) ?? []).map(opts.fromRow));
    if (channel) supabase.removeChannel(channel);
    channel = supabase
      .channel(`${opts.table}:${uid}`)
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: opts.table, filter: `user_id=eq.${uid}` },
        async () => {
          let q2 = (supabase.from as AnyTable)(opts.table).select("*");
          if (opts.orderBy) q2 = q2.order(opts.orderBy.column, { ascending: opts.orderBy.ascending ?? true });
          const { data: fresh } = await q2;
          setCache(((fresh as TRow[] | null) ?? []).map(opts.fromRow));
        },
      )
      .subscribe();
  }

  async function ensureMode() {
    if (hydration) return hydration;
    hydration = (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      if (uid) {
        mode = "remote"; userId = uid; await hydrate(uid);
      } else {
        mode = "local"; userId = null; setCache(readLocal());
      }
    })();
    return hydration;
  }

  if (typeof window !== "undefined") {
    supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null;
      if (uid && uid !== userId) {
        mode = "remote"; userId = uid; hydration = null;
        void hydrate(uid);
      } else if (!uid && mode !== "local") {
        mode = "local"; userId = null;
        if (channel) { supabase.removeChannel(channel); channel = null; }
        hydration = null;
        setCache(readLocal());
      }
    });
    // Refresh on tab focus so realtime misses (backgrounded tab) still recover.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && mode === "remote" && userId) {
        void hydrate(userId);
      }
    });
  }

  return {
    useItems: () => {
      const items = useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => cache,
        () => cache,
      );
      useEffect(() => { void ensureMode(); }, []);
      return items;
    },
    read: () => cache,
    async add(item) {
      if (mode === "remote" && userId) {
        setCache([item, ...cache]);
        const row = opts.toInsertRow(item, userId);
        const { error } = await (supabase.from as AnyTable)(opts.table).insert(row);
        if (error) setCache(cache.filter((x) => x.id !== item.id));
      } else {
        writeLocal([item, ...cache]);
      }
      return item;
    },
    async update(id, patch) {
      const next = cache.map((x) => (x.id === id ? { ...x, ...patch } : x));
      if (mode === "remote") {
        setCache(next);
        const row = opts.toUpdateRow(patch);
        if (Object.keys(row).length) {
          await (supabase.from as AnyTable)(opts.table).update(row).eq("id", id);
        }
      } else {
        writeLocal(next);
      }
    },
    async remove(id) {
      const next = cache.filter((x) => x.id !== id);
      if (mode === "remote") {
        setCache(next);
        await (supabase.from as AnyTable)(opts.table).delete().eq("id", id);
      } else {
        writeLocal(next);
      }
    },
    replace(next) {
      if (mode === "local") writeLocal(next);
      else setCache(next);
    },
  };
}
