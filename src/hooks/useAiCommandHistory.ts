import { useSyncExternalStore } from "react";

export interface AiCommandToolCall {
  id: string;
  name: string;
  args: unknown;
  result: unknown;
  approved?: boolean;
  rejected?: boolean;
}

export interface AiCommandEntry {
  id: string;
  createdAt: string;
  prompt: string;
  text: string;
  toolCalls: AiCommandToolCall[];
  status: "success" | "error";
  error?: string;
}

const KEY = "smmpilot:ai-command-history";
const LIMIT = 40;

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
  window.localStorage.setItem(KEY, JSON.stringify(next.slice(0, LIMIT)));
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

export function logAiCommand(entry: Omit<AiCommandEntry, "id" | "createdAt">) {
  const full: AiCommandEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry,
  };
  write([full, ...read()]);
  return full;
}

export function updateAiCommand(id: string, patch: Partial<AiCommandEntry>) {
  write(read().map((e) => (e.id === id ? { ...e, ...patch } : e)));
}

export function updateToolCall(entryId: string, callId: string, patch: Partial<AiCommandToolCall>) {
  write(
    read().map((e) =>
      e.id === entryId
        ? { ...e, toolCalls: e.toolCalls.map((c) => (c.id === callId ? { ...c, ...patch } : c)) }
        : e,
    ),
  );
}

export function clearAiCommandHistory() {
  write([]);
}

export function useAiCommandHistory() {
  const items = useSyncExternalStore(subscribe, () => cache, () => cache);
  return { items, log: logAiCommand, update: updateAiCommand, updateTool: updateToolCall, clear: clearAiCommandHistory };
}
