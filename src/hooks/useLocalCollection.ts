import { useCallback, useEffect, useSyncExternalStore } from "react";
import { isGuestSession } from "@/hooks/useGuest";

/**
 * localStorage-backed collection hook with cross-mount sync.
 * All hook instances pointing at the same `smmpilot:${toolKey}:${scopeKey}`
 * share a module-level cache + listener bus, so writes from any dialog or
 * page reflect in every mounted board without a reload.
 */

type Store = {
  cache: unknown[];
  listeners: Set<() => void>;
};

const stores = new Map<string, Store>();

function readStorage<T>(key: string, initial: T[]): T[] {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : initial;
  } catch {
    return initial;
  }
}

function getStore<T>(storageKey: string, initial: T[]): Store {
  let store = stores.get(storageKey);
  if (!store) {
    store = { cache: readStorage(storageKey, initial), listeners: new Set() };
    stores.set(storageKey, store);
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === storageKey) {
          store!.cache = readStorage(storageKey, initial);
          store!.listeners.forEach((l) => l());
        }
      });
    }
  }
  return store;
}

function writeStore<T>(storageKey: string, next: T[]) {
  const store = stores.get(storageKey);
  if (!store) return;
  store.cache = next;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  store.listeners.forEach((l) => l());
}

export function useLocalCollection<T extends { id: string | number }>(
  toolKey: string,
  scopeKey: string,
  initial: T[] = [],
) {
  const storageKey = `smmpilot:${toolKey}:${scopeKey}`;
  const store = getStore<T>(storageKey, initial);

  const items = useSyncExternalStore(
    (cb) => {
      store.listeners.add(cb);
      return () => store.listeners.delete(cb);
    },
    () => store.cache as T[],
    () => store.cache as T[],
  ) as T[];

  const setItems = useCallback(
    (updater: T[] | ((prev: T[]) => T[])) => {
      const prev = store.cache as T[];
      const next = typeof updater === "function" ? (updater as (p: T[]) => T[])(prev) : updater;
      writeStore(storageKey, next);
    },
    [storageKey, store],
  );

  const add = useCallback((item: T) => setItems((prev) => [item, ...prev]), [setItems]);
  const update = useCallback(
    (id: T["id"], patch: Partial<T>) =>
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    [setItems],
  );
  const remove = useCallback(
    (id: T["id"]) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [setItems],
  );
  const reset = useCallback(() => setItems(initial), [setItems, initial]);

  // Seed the initial demo array ONLY for guest sessions. Signed-in users
  // must never see synthetic demo rows leak into their real workspace —
  // if a prior guest session left seed rows behind, purge them now.
  useEffect(() => {
    if (isGuestSession()) {
      if ((store.cache as T[]).length === 0 && initial.length > 0) {
        writeStore(storageKey, initial);
      }
      return;
    }
    if (initial.length === 0) return;
    const seedIds = new Set(initial.map((i) => String(i.id)));
    const current = store.cache as T[];
    const cleaned = current.filter((i) => !seedIds.has(String(i.id)));
    if (cleaned.length !== current.length) {
      writeStore(storageKey, cleaned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, setItems, add, update, remove, reset };
}

/** Imperative push from non-React modules (e.g. dialog handlers). */
export function pushLocalCollection<T extends { id: string | number }>(
  toolKey: string,
  scopeKey: string,
  items: T[],
) {
  const storageKey = `smmpilot:${toolKey}:${scopeKey}`;
  const store = getStore<T>(storageKey, []);
  const next = [...items, ...(store.cache as T[])];
  writeStore(storageKey, next);
}
