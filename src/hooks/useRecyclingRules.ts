import { useSyncExternalStore } from "react";

export type RecycleCadence = "weekly" | "biweekly" | "monthly";

export interface RecyclingRule {
  id: string;
  name: string;
  caption: string;
  mediaUrl?: string;
  platformIds: string[];
  hashtags?: string[];
  cadence: RecycleCadence;
  /** Preferred hour of day (0..23) when the recycle should land. */
  hour: number;
  /** ISO of the next scheduled occurrence — used by the calendar to preview. */
  nextRunAt: string;
  enabled: boolean;
  createdAt: string;
  /** Optional link to a content category (see useContentCategories). */
  categoryId?: string;
}

const KEY = "smmpilot:recycling-rules";

function read(): RecyclingRule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecyclingRule[]) : [];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
let cache: RecyclingRule[] = read();

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}
function write(next: RecyclingRule[]) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) emit();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function stepFor(cadence: RecycleCadence, from: Date) {
  const d = new Date(from);
  if (cadence === "weekly") d.setDate(d.getDate() + 7);
  else if (cadence === "biweekly") d.setDate(d.getDate() + 14);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export function computeNextRun(cadence: RecycleCadence, hour: number, from = new Date()) {
  const next = new Date(from);
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= from.getTime()) {
    return stepFor(cadence, next).toISOString();
  }
  return next.toISOString();
}

export function useRecyclingRules() {
  const rules = useSyncExternalStore(subscribe, () => cache, () => cache);

  const add = (rule: Omit<RecyclingRule, "id" | "createdAt" | "nextRunAt"> & { nextRunAt?: string }) => {
    const created: RecyclingRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      nextRunAt: rule.nextRunAt ?? computeNextRun(rule.cadence, rule.hour),
    };
    write([created, ...read()]);
    return created;
  };
  const update = (id: string, patch: Partial<RecyclingRule>) =>
    write(read().map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => write(read().filter((r) => r.id !== id));
  const toggle = (id: string) =>
    write(read().map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  const advance = (id: string) => {
    const now = new Date();
    write(
      read().map((r) =>
        r.id === id ? { ...r, nextRunAt: computeNextRun(r.cadence, r.hour, now) } : r,
      ),
    );
  };

  return { rules, add, update, remove, toggle, advance };
}
