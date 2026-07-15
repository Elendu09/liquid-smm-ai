import { useSyncExternalStore } from "react";

export interface AiCommandAction {
  tool: string;
  description: string;
  targetRoute?: string;
  resourceId?: string;
  status: "planned" | "applied" | "rejected";
}

export interface AiCommandEntry {
  id: string;
  prompt: string;
  createdAt: string;
  message: string;
  status: "pending" | "approved" | "rejected" | "applied";
  actions: AiCommandAction[];
}

const KEY = "smmpilot:ai-commands";

function read(): AiCommandEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AiCommandEntry[]) : [];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
let cache: AiCommandEntry[] = read();

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}

function write(next: AiCommandEntry[]) {
  window.localStorage.setItem(KEY, JSON.stringify(next.slice(0, 50)));
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

export function useAiCommandHistory() {
  const items = useSyncExternalStore(subscribe, () => cache, () => cache);
  return {
    items,
    add: (entry: Omit<AiCommandEntry, "id" | "createdAt">) => {
      const full: AiCommandEntry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...entry,
      };
      write([full, ...read()]);
      return full;
    },
    update: (id: string, patch: Partial<AiCommandEntry>) => {
      write(read().map((it) => (it.id === id ? { ...it, ...patch } : it)));
    },
    remove: (id: string) => write(read().filter((it) => it.id !== id)),
    clear: () => write([]),
  };
}
