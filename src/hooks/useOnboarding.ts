import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

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
  seen?: boolean;
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

const defaultState: OnboardingState = { completed: false, seen: false, profile: defaultProfile };


function readLocal(): OnboardingState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as OnboardingState;
    return {
      completed: !!parsed.completed,
      completedAt: parsed.completedAt,
      seen: !!parsed.seen,
      profile: { ...defaultProfile, ...(parsed.profile ?? {}) },
    };
  } catch {
    return defaultState;
  }
}


function writeLocal(next: OnboardingState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.localStorage.setItem(
    "smmpilot:automation-settings",
    JSON.stringify({ autonomy: next.profile.autonomy, updatedAt: new Date().toISOString() }),
  );
}

// Cross-tab / cross-hook sync while unauthenticated.
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) emit();
  });
}

export function useOnboarding() {
  const { user } = useAuthUser();
  const [state, setState] = useState<OnboardingState>(() => readLocal());

  // Load from profiles when signed in; otherwise track localStorage.
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      const sync = () => setState(readLocal());
      sync();
      listeners.add(sync);
      return () => {
        listeners.delete(sync);
      };
    }

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_state, display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const remote = (data?.onboarding_state as Partial<OnboardingState> | null) ?? null;
      const local = readLocal();
      // Prefill: full name from auth metadata / profile row / email fallback.
      const accountName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        data?.display_name ??
        user.email?.split("@")[0] ??
        "";
      const remoteProfile = remote?.profile ?? {};
      const mergedProfile: OnboardingProfile = {
        ...defaultProfile,
        ...local.profile,
        ...remoteProfile,
      };
      if (!mergedProfile.name && accountName) mergedProfile.name = accountName;
      // Merge: remote wins on `completed`; profile fields prefer remote when present.
      const merged: OnboardingState = {
        completed: !!(remote?.completed ?? local.completed),
        completedAt: remote?.completedAt ?? local.completedAt,
        seen: !!(remote?.seen ?? local.seen),
        profile: mergedProfile,
      };

      setState(merged);
      // Push local-only progress up on first login.
      if (!remote || (!remote.completed && local.completed) || Object.keys(remoteProfile).length === 0) {
        await supabase.from("profiles").update({ onboarding_state: merged as never }).eq("id", user.id);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const persist = useCallback(
    async (next: OnboardingState) => {
      setState(next);
      writeLocal(next);
      emit();
      if (user) {
        await supabase.from("profiles").update({ onboarding_state: next as never }).eq("id", user.id);
      }
    },
    [user],
  );

  return {
    state,
    updateProfile: (patch: Partial<OnboardingProfile>) =>
      persist({ ...state, profile: { ...state.profile, ...patch } }),
    complete: () =>
      persist({ ...state, completed: true, seen: true, completedAt: new Date().toISOString() }),
    markSeen: () => persist({ ...state, seen: true }),
    reset: () => persist({ completed: false, seen: false, profile: defaultProfile }),

  };
}
