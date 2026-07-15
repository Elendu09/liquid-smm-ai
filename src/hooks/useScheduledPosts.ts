import { useSyncExternalStore } from "react";

export interface ScheduledPost {
  id: string;
  caption: string;
  mediaUrl?: string;
  scheduledAt: string; // ISO
  platformIds: string[];
  hashtags?: string[];
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

export function useScheduledPosts() {
  const posts = useSyncExternalStore(subscribe, () => cache, () => cache);

  const add = (post: Omit<ScheduledPost, "id" | "createdAt">) => {
    const full: ScheduledPost = {
      ...post,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    write([full, ...read()]);
    return full;
  };
  const remove = (id: string) => write(read().filter((p) => p.id !== id));
  const update = (id: string, patch: Partial<ScheduledPost>) =>
    write(read().map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return { posts, add, remove, update };
}
