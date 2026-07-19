import { useCallback, useMemo, useState } from "react";

/**
 * Generic bulk-selection primitive used across dashboard hubs
 * (Publish queue, Engage inbox, Library, Audience, Activity, etc.).
 *
 * Usage:
 *   const sel = useBulkSelection(rows.map(r => r.id));
 *   <Checkbox checked={sel.isSelected(id)} onCheckedChange={() => sel.toggle(id)} />
 *   <BulkActionBar count={sel.count} onClear={sel.clear} actions={[...]} />
 */
export function useBulkSelection<T extends string | number>(allIds: T[]) {
  const [selected, setSelected] = useState<Set<T>>(new Set());

  const allSet = useMemo(() => new Set(allIds), [allIds]);

  const toggle = useCallback((id: T) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setMany = useCallback((ids: T[], on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => (prev.size === allSet.size ? new Set() : new Set(allSet)));
  }, [allSet]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id: T) => selected.has(id), [selected]);

  return {
    selected,
    ids: useMemo(() => Array.from(selected), [selected]),
    count: selected.size,
    allChecked: allSet.size > 0 && selected.size === allSet.size,
    someChecked: selected.size > 0 && selected.size < allSet.size,
    toggle,
    setMany,
    toggleAll,
    clear,
    isSelected,
  };
}
