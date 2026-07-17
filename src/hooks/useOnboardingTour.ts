import { useSyncExternalStore } from "react";

export interface TourState {
  completed: boolean;
  dismissed: boolean;
  completedAt?: string;
}

const KEY = "smmpilot:tour";

function read(): TourState {
  if (typeof window === "undefined") return { completed: false, dismissed: false };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { completed: false, dismissed: false };
    return JSON.parse(raw) as TourState;
  } catch {
    return { completed: false, dismissed: false };
  }
}

const listeners = new Set<() => void>();
let cache: TourState = read();

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}

function write(next: TourState) {
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

export function useTourState() {
  const state = useSyncExternalStore(subscribe, () => cache, () => cache);
  return {
    state,
    markCompleted: () =>
      write({ completed: true, dismissed: false, completedAt: new Date().toISOString() }),
    markDismissed: () => write({ ...cache, dismissed: true }),
    reset: () => write({ completed: false, dismissed: false }),
  };
}

export const TOUR_OPEN_EVENT = "smmpilot:open-onboarding-tour";
