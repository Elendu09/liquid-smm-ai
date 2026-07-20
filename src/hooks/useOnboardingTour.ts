import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isGuestSession } from "@/hooks/useGuest";

export interface TourState {
  completed: boolean;
  dismissed: boolean;
  stepIndex?: number;
  completedAt?: string;
}

const KEY = "smmpilot:tour";
const DEFAULT: TourState = { completed: false, dismissed: false, stepIndex: 0 };

function readLocal(): TourState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...(JSON.parse(raw) as TourState) };
  } catch {
    return DEFAULT;
  }
}
function writeLocal(next: TourState) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

let cache: TourState = readLocal();
let userId: string | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function setCache(next: TourState) {
  cache = next;
  writeLocal(next);
  listeners.forEach((l) => l());
}

async function hydrate() {
  const { data } = await supabase.auth.getUser();
  userId = data.user?.id ?? null;
  hydrated = true;
  if (!userId) return;
  const { data: row } = await supabase
    .from("onboarding_tour_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (row) {
    setCache({
      completed: !!row.completed,
      dismissed: !!row.dismissed,
      stepIndex: row.step_index ?? 0,
      completedAt: row.completed_at ?? undefined,
    });
  }
}

async function pushRemote(patch: Partial<TourState>) {
  if (!userId || isGuestSession()) return;
  const merged = { ...cache, ...patch };
  await supabase.from("onboarding_tour_state").upsert(
    {
      user_id: userId,
      completed: merged.completed,
      dismissed: merged.dismissed,
      step_index: merged.stepIndex ?? 0,
      completed_at: merged.completedAt ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => { if (e.key === KEY) setCache(readLocal()); });
  supabase.auth.onAuthStateChange(() => { hydrated = false; void hydrate(); });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTourState() {
  const state = useSyncExternalStore(subscribe, () => cache, () => cache);
  useEffect(() => { if (!hydrated) void hydrate(); }, []);
  return {
    state,
    markCompleted: () => {
      const next = { completed: true, dismissed: false, completedAt: new Date().toISOString(), stepIndex: cache.stepIndex ?? 0 };
      setCache(next);
      void pushRemote(next);
    },
    markDismissed: () => {
      const next = { ...cache, dismissed: true };
      setCache(next);
      void pushRemote(next);
    },
    setStep: (stepIndex: number) => {
      const next = { ...cache, stepIndex };
      setCache(next);
      void pushRemote(next);
    },
    reset: () => {
      const next = { completed: false, dismissed: false, stepIndex: 0 };
      setCache(next);
      void pushRemote(next);
    },
  };
}

export const TOUR_OPEN_EVENT = "smmpilot:open-onboarding-tour";
