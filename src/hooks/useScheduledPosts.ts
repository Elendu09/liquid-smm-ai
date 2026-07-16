import { useSyncExternalStore } from "react";

export type Recurrence = { freq: "daily" | "weekly" | "monthly"; count: number };

export interface ScheduledPost {
  id: string;
  caption: string;
  mediaUrl?: string;
  scheduledAt: string; // ISO
  platformIds: string[];
  hashtags?: string[];
  seriesId?: string; // groups recurring occurrences
  createdAt: string;
}

const STORAGE_KEY = "smmpilot:scheduled-posts";

function read(): ScheduledPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScheduledPost[]) : [];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
let cache: ScheduledPost[] = read();

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}

function write(next: ScheduledPost[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) emit();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function advance(date: Date, freq: Recurrence["freq"], step: number) {
  const d = new Date(date);
  if (freq === "daily") d.setDate(d.getDate() + step);
  else if (freq === "weekly") d.setDate(d.getDate() + step * 7);
  else d.setMonth(d.getMonth() + step);
  return d;
}

export function useScheduledPosts() {
  const posts = useSyncExternalStore(subscribe, () => cache, () => cache);

  const add = (
    post: Omit<ScheduledPost, "id" | "createdAt" | "seriesId">,
    opts?: { recurrence?: Recurrence },
  ) => {
    const now = new Date().toISOString();
    const base = new Date(post.scheduledAt);
    const seriesId = opts?.recurrence && opts.recurrence.count > 1 ? crypto.randomUUID() : undefined;
    const count = Math.max(1, opts?.recurrence?.count ?? 1);
    const items: ScheduledPost[] = [];
    for (let i = 0; i < count; i++) {
      const when = opts?.recurrence
        ? advance(base, opts.recurrence.freq, i).toISOString()
        : post.scheduledAt;
      items.push({
        ...post,
        id: crypto.randomUUID(),
        createdAt: now,
        scheduledAt: when,
        seriesId,
      });
    }
    write([...items, ...read()]);
    return items[0];
  };
  const remove = (id: string) => write(read().filter((p) => p.id !== id));
  const removeSeries = (seriesId: string) => write(read().filter((p) => p.seriesId !== seriesId));
  const update = (id: string, patch: Partial<ScheduledPost>) =>
    write(read().map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return { posts, add, remove, removeSeries, update };
}
