import { useSyncExternalStore } from "react";

export interface OnboardingProfile {
  name: string;
  role: "creator" | "agency" | "brand" | "ecom" | "";
  niches: string[];
  goals: string[];
  tone: "playful" | "professional" | "bold" | "minimal" | "";
  brandDescription: string;
  cadencePerWeek: number;
  preferredTimes: string[];
  autonomy: "manual" | "suggest" | "auto" | "";
}

export interface OnboardingState {
  completed: boolean;
  step: number;
  profile: OnboardingProfile;
  updatedAt: string;
}

const KEY = "smmpilot:onboarding";
const AUTOMATION_KEY = "smmpilot:automation-settings";

const defaultProfile: OnboardingProfile = {
  name: "",
  role: "",
  niches: [],
  goals: [],
  tone: "",
  brandDescription: "",
  cadencePerWeek: 5,
  preferredTimes: [],
  autonomy: "suggest",
};

const defaultState: OnboardingState = {
  completed: false,
  step: 0,
  profile: defaultProfile,
  updatedAt: new Date().toISOString(),
};

function read(): OnboardingState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as OnboardingState;
    return { ...defaultState, ...parsed, profile: { ...defaultProfile, ...parsed.profile } };
  } catch {
    return defaultState;
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
  // Mirror autonomy + cadence into the automation-settings store the MCP tool reads.
  try {
    window.localStorage.setItem(
      AUTOMATION_KEY,
      JSON.stringify({
        autonomy: next.profile.autonomy,
        cadencePerWeek: next.profile.cadencePerWeek,
        preferredTimes: next.profile.preferredTimes,
        tone: next.profile.tone,
        niches: next.profile.niches,
        goals: next.profile.goals,
        updatedAt: next.updatedAt,
      }),
    );
  } catch {
    // ignore
  }
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
    setStep: (step: number) =>
      write({ ...read(), step, updatedAt: new Date().toISOString() }),
    updateProfile: (patch: Partial<OnboardingProfile>) => {
      const cur = read();
      write({
        ...cur,
        profile: { ...cur.profile, ...patch },
        updatedAt: new Date().toISOString(),
      });
    },
    complete: () =>
      write({ ...read(), completed: true, updatedAt: new Date().toISOString() }),
    reopen: () =>
      write({ ...read(), completed: false, step: 0, updatedAt: new Date().toISOString() }),
    reset: () => write({ ...defaultState, updatedAt: new Date().toISOString() }),
  };
}
