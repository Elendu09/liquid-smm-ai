import { useSyncExternalStore } from "react";

export type CategoryCadence = "daily" | "weekly" | "monthly";

export interface ContentCategory {
  id: string;
  name: string;
  color: string; // hex or tailwind hsl string
  emoji: string;
  /** How many posts of this category the user aims to publish per week. */
  weeklyBudget: number;
  cadence: CategoryCadence;
  createdAt: string;
}

const KEY = "smmpilot:content-categories";

const SEED: ContentCategory[] = [
  { id: "seed-educational", name: "Educational", emoji: "📚", color: "#3B82F6", weeklyBudget: 3, cadence: "weekly", createdAt: new Date(0).toISOString() },
  { id: "seed-promotional", name: "Promotional", emoji: "🎯", color: "#F97316", weeklyBudget: 2, cadence: "weekly", createdAt: new Date(0).toISOString() },
  { id: "seed-bts",         name: "Behind the scenes", emoji: "🎬", color: "#A855F7", weeklyBudget: 2, cadence: "weekly", createdAt: new Date(0).toISOString() },
  { id: "seed-evergreen",   name: "Evergreen", emoji: "🌲", color: "#10B981", weeklyBudget: 1, cadence: "monthly", createdAt: new Date(0).toISOString() },
];

function read(): ContentCategory[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as ContentCategory[];
  } catch {
    return SEED;
  }
}

const listeners = new Set<() => void>();
let cache: ContentCategory[] = read();

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}
function write(next: ContentCategory[]) {
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

export function useContentCategories() {
  const categories = useSyncExternalStore(subscribe, () => cache, () => cache);

  const add = (c: Omit<ContentCategory, "id" | "createdAt">) => {
    const created: ContentCategory = { ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    write([created, ...read()]);
    return created;
  };
  const update = (id: string, patch: Partial<ContentCategory>) =>
    write(read().map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: string) => write(read().filter((c) => c.id !== id));

  const byId = (id?: string) => (id ? categories.find((c) => c.id === id) : undefined);

  return { categories, add, update, remove, byId };
}
