import { useCallback, useMemo } from "react";
import { useLocalCollection } from "./useLocalCollection";

export type SavedView<F = Record<string, unknown>> = {
  id: string;
  name: string;
  filters: F;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * localStorage-backed saved views/filters per scope
 * (e.g. `publish:queue`, `engage:inbox`, `audience:list`).
 *
 * Shared cache — writing on one page reflects everywhere via useLocalCollection.
 */
export function useSavedViews<F = Record<string, unknown>>(scopeKey: string) {
  const { items: views, setItems: setViews } = useLocalCollection<SavedView<F>>("views", scopeKey, []);

  const save = useCallback(
    (name: string, filters: F, id?: string) => {
      const now = new Date().toISOString();
      setViews((prev) => {
        if (id) {
          return prev.map((v) => (v.id === id ? { ...v, name, filters, updatedAt: now } : v));
        }
        return [
          ...prev,
          {
            id: `view_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name,
            filters,
            createdAt: now,
            updatedAt: now,
          },
        ];
      });
    },
    [setViews],
  );

  const remove = useCallback(
    (id: string) => setViews((prev) => prev.filter((v) => v.id !== id)),
    [setViews],
  );

  const rename = useCallback(
    (id: string, name: string) =>
      setViews((prev) =>
        prev.map((v) => (v.id === id ? { ...v, name, updatedAt: new Date().toISOString() } : v)),
      ),
    [setViews],
  );

  const togglePin = useCallback(
    (id: string) =>
      setViews((prev) => prev.map((v) => (v.id === id ? { ...v, pinned: !v.pinned } : v))),
    [setViews],
  );

  const sorted = useMemo(
    () =>
      [...views].sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [views],
  );

  return { views: sorted, save, remove, rename, togglePin };
}
