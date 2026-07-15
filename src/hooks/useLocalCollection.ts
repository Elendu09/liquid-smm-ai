import { useCallback, useEffect, useState } from "react";

/**
 * Small localStorage-backed collection hook with basic CRUD.
 * Storage key: `smmpilot:${toolKey}:${scopeKey}`.
 */
export function useLocalCollection<T extends { id: string | number }>(
  toolKey: string,
  scopeKey: string,
  initial: T[] = []
) {
  const storageKey = `smmpilot:${toolKey}:${scopeKey}`;
  const [items, setItems] = useState<T[]>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T[]) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [storageKey, items]);

  const add = useCallback((item: T) => setItems((prev) => [item, ...prev]), []);
  const update = useCallback(
    (id: T["id"], patch: Partial<T>) =>
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    []
  );
  const remove = useCallback(
    (id: T["id"]) => setItems((prev) => prev.filter((i) => i.id !== id)),
    []
  );
  const reset = useCallback(() => setItems(initial), [initial]);

  return { items, setItems, add, update, remove, reset };
}
