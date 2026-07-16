import { useSyncExternalStore } from "react";

export type Autonomy = "manual" | "suggest" | "auto-approval";

export interface OnboardingProfile {
  name: string;
  role: "creator" | "agency" | "brand" | "ecom" | "";
  connectedPlatformIds: string[];
  niches: string[];
  goals: string[];
  tone: "playful" | "professional" | "bold" | "minimal" | "";
  brandDescription: string;
  postsPerWeek: number;
  preferredTimes: string[];
  autonomy: Autonomy;
}

export interface OnboardingState {
  completed: boolean;
  completedAt?: string;
  profile: OnboardingProfile;
}

const KEY = "smmpilot:onboarding";

export const defaultProfile: OnboardingProfile = {
  name: "",
  role: "",
  connectedPlatformIds: [],
  niches: [],
  goals: [],
  tone: "",
  brandDescription: "",
  postsPerWeek: 5,
  preferredTimes: [],
  autonomy: "suggest",
};

function read(): OnboardingState {
  if (typeof window === "undefined") return { completed: false, profile: defaultProfile };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { completed: false, profile: defaultProfile };
    const parsed = JSON.parse(raw) as OnboardingState;
    return {
      completed: !!parsed.completed,
      completedAt: parsed.completedAt,
      profile: { ...defaultProfile, ...(parsed.profile ?? {}) },
    };
  } catch {
    return { completed: false, profile: defaultProfile };
  }
}

const listeners = new Set<() => void>();
let cache: OnboardingState = read();

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}

function write(next: OnboardingState) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  // Mirror autonomy into automation settings so MCP tool can eventually read it.
  window.localStorage.setItem(
    "smmpilot:automation-settings",
    JSON.stringify({ autonomy: next.profile.autonomy, updatedAt: new Date().toISOString() }),
  );
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

export function useOnboarding() {
  const state = useSyncExternalStore(subscribe, () => cache, () => cache);
  return {
    state,
    updateProfile: (patch: Partial<OnboardingProfile>) =>
      write({ ...state, profile: { ...state.profile, ...patch } }),
    complete: () =>
      write({ ...state, completed: true, completedAt: new Date().toISOString() }),
    reset: () => write({ completed: false, profile: defaultProfile }),
  };
}
