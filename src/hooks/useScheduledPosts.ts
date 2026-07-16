import { useSyncExternalStore } from "react";

export type Recurrence = { freq: "daily" | "weekly" | "monthly"; count: number };
export type SendStatus = "queued" | "paused" | "sending" | "completed" | "failed";

export interface ScheduledPost {
  id: string;
  caption: string;
  mediaUrl?: string;
  scheduledAt: string; // ISO (absolute UTC instant)
  timezone?: string; // IANA — the tz the user picked when scheduling
  platformIds: string[];
  /** Optional per-platform caption / hashtag overrides, keyed by platformId. */
  platformOverrides?: Record<string, { caption?: string; hashtags?: string[] }>;
  hashtags?: string[];
  /** First comment (Instagram/TikTok style) auto-posted right after publish. */
  firstComment?: string;
  seriesId?: string; // groups recurring occurrences
  createdAt: string;
  status?: SendStatus; // real-time send status
  sendProgress?: number; // 0..100 while sending
  error?: string; // populated on failure
  sentAt?: string; // ISO — when send finalized
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

/**
 * Detect scheduling conflicts.
 * - "overlap": another post on any of the same platforms within ±windowMinutes.
 * - "duplicate": identical caption + same platform within 24h.
 */
export interface ScheduleConflict {
  kind: "overlap" | "duplicate";
  post: ScheduledPost;
  platformIds: string[];
  minutesApart: number;
}

export function findConflicts(
  posts: ScheduledPost[],
  candidate: { scheduledAt: string; platformIds: string[]; caption?: string; ignoreId?: string },
  windowMinutes = 10,
): ScheduleConflict[] {
  const when = new Date(candidate.scheduledAt).getTime();
  if (isNaN(when)) return [];
  const conflicts: ScheduleConflict[] = [];
  for (const p of posts) {
    if (p.id === candidate.ignoreId) continue;
    if (p.status === "completed" || p.status === "failed") continue;
    const overlap = p.platformIds.filter((id) => candidate.platformIds.includes(id));
    if (overlap.length === 0) continue;
    const diffMs = Math.abs(new Date(p.scheduledAt).getTime() - when);
    const diffMin = Math.round(diffMs / 60000);
    if (
      candidate.caption &&
      p.caption.trim() === candidate.caption.trim() &&
      diffMs < 24 * 60 * 60 * 1000
    ) {
      conflicts.push({ kind: "duplicate", post: p, platformIds: overlap, minutesApart: diffMin });
      continue;
    }
    if (diffMs <= windowMinutes * 60_000) {
      conflicts.push({ kind: "overlap", post: p, platformIds: overlap, minutesApart: diffMin });
    }
  }
  return conflicts;
}

export function readPosts() {
  return cache;
}
export function writePosts(next: ScheduledPost[]) {
  write(next);
}

export function useScheduledPosts() {
  const posts = useSyncExternalStore(subscribe, () => cache, () => cache);

  const add = (
    post: Omit<ScheduledPost, "id" | "createdAt" | "seriesId">,
    opts?: { recurrence?: Recurrence; scheduledAts?: string[] },
  ) => {
    const now = new Date().toISOString();
    const seriesId =
      (opts?.recurrence && opts.recurrence.count > 1) ||
      (opts?.scheduledAts && opts.scheduledAts.length > 1)
        ? crypto.randomUUID()
        : undefined;
    const items: ScheduledPost[] = [];

    const slots = opts?.scheduledAts && opts.scheduledAts.length > 0
      ? opts.scheduledAts
      : [post.scheduledAt];

    for (const slot of slots) {
      const base = new Date(slot);
      const count = Math.max(1, opts?.recurrence?.count ?? 1);
      for (let i = 0; i < count; i++) {
        const when = opts?.recurrence
          ? advance(base, opts.recurrence.freq, i).toISOString()
          : base.toISOString();
        items.push({
          ...post,
          id: crypto.randomUUID(),
          createdAt: now,
          scheduledAt: when,
          seriesId: slots.length > 1 || count > 1 ? seriesId : undefined,
          status: post.status ?? "queued",
        });
      }
    }
    write([...items, ...read()]);
    return items[0];
  };
  const remove = (id: string) => write(read().filter((p) => p.id !== id));
  const removeSeries = (seriesId: string) => write(read().filter((p) => p.seriesId !== seriesId));
  const update = (id: string, patch: Partial<ScheduledPost>) =>
    write(read().map((p) => (p.id === id ? { ...p, ...patch } : p)));
  /** Toggle status="paused" on every queued/paused post. Sending/completed are untouched. */
  const pauseAll = () =>
    write(
      read().map((p) =>
        p.status === "queued" ? { ...p, status: "paused" as SendStatus } : p,
      ),
    );
  const resumeAll = () =>
    write(
      read().map((p) =>
        p.status === "paused" ? { ...p, status: "queued" as SendStatus } : p,
      ),
    );

  return { posts, add, remove, removeSeries, update, pauseAll, resumeAll };
}
