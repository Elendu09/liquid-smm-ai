import { useCallback, useMemo } from "react";
import { createRemoteCollection } from "./_remoteCollection";
import { useBrands } from "@/contexts/BrandContext";

export interface AutolistSlot {
  /** 0 = Sunday … 6 = Saturday */
  dow: number;
  hour: number;
  minute: number;
}

export interface Autolist {
  id: string;
  name: string;
  color: string;
  platformIds: string[];
  slots: AutolistSlot[];
  timezone: string;
  active: boolean;
  orderIndex: number;
  brandId?: string;
  createdAt: string;
}

type Row = {
  id: string;
  name: string;
  color: string;
  platform_ids: string[] | null;
  slots: AutolistSlot[] | null;
  timezone: string;
  active: boolean;
  order_index: number;
  brand_id: string | null;
  created_at: string;
};

export const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatSlot(s: AutolistSlot) {
  const h = s.hour % 12 === 0 ? 12 : s.hour % 12;
  const ampm = s.hour < 12 ? "am" : "pm";
  return `${h}:${String(s.minute).padStart(2, "0")} ${ampm}`;
}

export function slotKey(s: AutolistSlot) {
  return `${s.dow}-${s.hour}-${s.minute}`;
}

const GUEST_SEED: Autolist[] = [
  {
    id: "demo-autolist-evergreen",
    name: "Evergreen tips",
    color: "217 91% 60%",
    platformIds: ["instagram", "linkedin"],
    slots: [
      { dow: 1, hour: 9, minute: 0 },
      { dow: 3, hour: 13, minute: 30 },
      { dow: 5, hour: 17, minute: 0 },
    ],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    active: true,
    orderIndex: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-autolist-promos",
    name: "Weekend promos",
    color: "280 80% 62%",
    platformIds: ["facebook", "x"],
    slots: [
      { dow: 6, hour: 11, minute: 0 },
      { dow: 0, hour: 19, minute: 0 },
    ],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    active: true,
    orderIndex: 1,
    createdAt: new Date().toISOString(),
  },
];

const store = createRemoteCollection<Autolist, Row>({
  table: "autolists",
  localKey: "smmpilot:autolists",
  seed: GUEST_SEED,
  orderBy: { column: "order_index", ascending: true },
  fromRow: (r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    platformIds: r.platform_ids ?? [],
    slots: Array.isArray(r.slots) ? r.slots : [],
    timezone: r.timezone,
    active: r.active,
    orderIndex: r.order_index,
    brandId: r.brand_id ?? undefined,
    createdAt: r.created_at,
  }),
  toInsertRow: (a, userId) => ({
    id: a.id,
    user_id: userId,
    name: a.name,
    color: a.color,
    platform_ids: a.platformIds,
    slots: a.slots,
    timezone: a.timezone,
    active: a.active,
    order_index: a.orderIndex,
    brand_id: a.brandId ?? null,
    created_at: a.createdAt,
  }),
  toUpdateRow: (p) => {
    const r: Record<string, unknown> = {};
    if (p.name !== undefined) r.name = p.name;
    if (p.color !== undefined) r.color = p.color;
    if (p.platformIds !== undefined) r.platform_ids = p.platformIds;
    if (p.slots !== undefined) r.slots = p.slots;
    if (p.timezone !== undefined) r.timezone = p.timezone;
    if (p.active !== undefined) r.active = p.active;
    if (p.orderIndex !== undefined) r.order_index = p.orderIndex;
    if (p.brandId !== undefined) r.brand_id = p.brandId ?? null;
    return r;
  },
});

/** Next `count` occurrences of an autolist's slots, ascending. */
export function upcomingSlots(list: Autolist, count = 8, from = new Date()): Date[] {
  if (!list.slots.length) return [];
  const out: Date[] = [];
  for (let dayOffset = 0; dayOffset < 28 && out.length < count; dayOffset++) {
    const day = new Date(from);
    day.setDate(day.getDate() + dayOffset);
    const dow = day.getDay();
    const slots = list.slots
      .filter((s) => s.dow === dow)
      .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
    for (const s of slots) {
      const d = new Date(day);
      d.setHours(s.hour, s.minute, 0, 0);
      if (d.getTime() <= from.getTime()) continue;
      out.push(d);
      if (out.length >= count) break;
    }
  }
  return out;
}

export function useAutolists() {
  const all = store.useItems();
  const { activeBrand } = useBrands();

  const autolists = useMemo(() => {
    const scoped = activeBrand ? all.filter((a) => !a.brandId || a.brandId === activeBrand.id) : all;
    return [...scoped].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [all, activeBrand]);

  const add = useCallback(
    (input: Partial<Autolist> & { name: string }) => {
      const created: Autolist = {
        id: crypto.randomUUID(),
        name: input.name,
        color: input.color ?? "217 91% 60%",
        platformIds: input.platformIds ?? [],
        slots: input.slots ?? [],
        timezone: input.timezone ?? (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"),
        active: input.active ?? true,
        orderIndex: input.orderIndex ?? store.read().length,
        brandId: input.brandId ?? activeBrand?.id,
        createdAt: new Date().toISOString(),
      };
      return store.add(created);
    },
    [activeBrand],
  );

  const update = useCallback((id: string, patch: Partial<Autolist>) => store.update(id, patch), []);
  const remove = useCallback((id: string) => store.remove(id), []);
  const toggle = useCallback((id: string) => {
    const a = store.read().find((x) => x.id === id);
    if (a) store.update(id, { active: !a.active });
  }, []);

  const toggleSlot = useCallback((id: string, slot: AutolistSlot) => {
    const a = store.read().find((x) => x.id === id);
    if (!a) return;
    const key = slotKey(slot);
    const exists = a.slots.some((s) => slotKey(s) === key);
    const slots = exists ? a.slots.filter((s) => slotKey(s) !== key) : [...a.slots, slot];
    store.update(id, { slots });
  }, []);

  /** Total slots per week across active lists. */
  const weeklyCapacity = useMemo(
    () => autolists.filter((a) => a.active).reduce((n, a) => n + a.slots.length, 0),
    [autolists],
  );

  return { autolists, add, update, remove, toggle, toggleSlot, weeklyCapacity };
}
