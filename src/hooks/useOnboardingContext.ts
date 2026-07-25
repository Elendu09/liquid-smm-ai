import { useMemo } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";

export type LaneKey = "upcoming" | "health" | "recent";
export type KpiKey = "accounts" | "followers" | "scheduled" | "success";

/**
 * Derived, memoized selectors that map the onboarding profile into concrete
 * dashboard configuration (greeting, lane order, KPI order, AI context).
 * Keeps step 1..8 answers wired to real dashboard behavior.
 */
export function useOnboardingContext() {
  const { state } = useOnboarding();
  const p = state.profile;

  return useMemo(() => {
    const firstName = (p.name || "").trim().split(/\s+/)[0] || "";
    const greeting = firstName ? `Welcome, ${firstName}` : "Welcome back";
    const primaryGoal = p.goals[0];

    // Reorder dashboard Kanban lanes based on the user's #1 goal.
    const laneOrder: LaneKey[] =
      primaryGoal === "grow"
        ? ["health", "upcoming", "recent"]
        : primaryGoal === "sales"
          ? ["upcoming", "recent", "health"]
          : primaryGoal === "community"
            ? ["recent", "upcoming", "health"]
            : primaryGoal === "time"
              ? ["recent", "health", "upcoming"]
              : ["upcoming", "health", "recent"];

    // Reorder KPI tiles similarly.
    const kpiOrder: KpiKey[] =
      primaryGoal === "grow"
        ? ["followers", "accounts", "scheduled", "success"]
        : primaryGoal === "sales"
          ? ["scheduled", "success", "followers", "accounts"]
          : primaryGoal === "community"
            ? ["success", "followers", "scheduled", "accounts"]
            : primaryGoal === "time"
              ? ["success", "scheduled", "accounts", "followers"]
              : ["accounts", "followers", "scheduled", "success"];

    // Compact structured context that any AI edge function can consume.
    const aiContext = {
      tone: p.tone || undefined,
      niches: p.niches,
      goals: p.goals,
      brandDescription: p.brandDescription || undefined,
      preferredPlatforms: p.connectedPlatformIds,
      cadencePerWeek: p.postsPerWeek,
      preferredTimes: p.preferredTimes,
      autonomy: p.autonomy,
    };

    return {
      profile: p,
      completed: !!state.completed,
      seen: !!state.seen,
      firstName,
      greeting,
      primaryGoal,
      laneOrder,
      kpiOrder,
      aiContext,
    };
  }, [p, state.completed, state.seen]);
}
