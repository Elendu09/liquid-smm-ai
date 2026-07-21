import { useCallback, useMemo } from "react";
import { createRemoteCollection } from "./_remoteCollection";

export type SavedView<F = Record<string, unknown>> = {
  id: string;
  scope: string;
  name: string;
  filters: F;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
};

type Row = {
  id: string;
  scope: string;
  name: string;
  filters: Record<string, unknown> | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

const store = createRemoteCollection<SavedView, Row>({
  table: "saved_views",
  localKey: "smmpilot:views:__all__",
  seed: [],
  orderBy: { column: "created_at", ascending: true },
  fromRow: (r) => ({
    id: r.id,
    scope: r.scope,
    name: r.name,
    filters: (r.filters ?? {}) as Record<string, unknown>,
    pinned: !!r.pinned,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }),
  toInsertRow: (v, userId) => ({
    id: v.id,
    user_id: userId,
    scope: v.scope,
    name: v.name,
    filters: v.filters as Record<string, unknown>,
    pinned: !!v.pinned,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
  }),
  toUpdateRow: (p) => {
    const row: Record<string, unknown> = {};
    if (p.name !== undefined) row.name = p.name;
    if (p.filters !== undefined) row.filters = p.filters as Record<string, unknown>;
    if (p.pinned !== undefined) row.pinned = !!p.pinned;
    return row;
  },
});

export function useSavedViews<F = Record<string, unknown>>(scopeKey: string) {
  const all = store.useItems();
  const views = useMemo(
    () =>
      all
        .filter((v) => v.scope === scopeKey)
        .sort((a, b) => {
          if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
          return a.name.localeCompare(b.name);
        }) as unknown as SavedView<F>[],
    [all, scopeKey],
  );

  const save = useCallback(
    (name: string, filters: F, id?: string) => {
      const now = new Date().toISOString();
      if (id) {
        void store.update(id, { name, filters: filters as Record<string, unknown>, updatedAt: now } as Partial<SavedView>);
        return;
      }
      const view: SavedView = {
        id: `view_${crypto.randomUUID().slice(0, 8)}`,
        scope: scopeKey,
        name,
        filters: filters as Record<string, unknown>,
        createdAt: now,
        updatedAt: now,
      };
      void store.add(view);
    },
    [scopeKey],
  );

  const remove = useCallback((id: string) => {
    void store.remove(id);
  }, []);

  const rename = useCallback((id: string, name: string) => {
    void store.update(id, { name, updatedAt: new Date().toISOString() });
  }, []);

  const togglePin = useCallback(
    (id: string) => {
      const cur = store.read().find((v) => v.id === id);
      if (!cur) return;
      void store.update(id, { pinned: !cur.pinned });
    },
    [],
  );

  return { views, save, remove, rename, togglePin };
}
