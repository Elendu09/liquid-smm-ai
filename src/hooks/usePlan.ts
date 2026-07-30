import { useCallback, useMemo, useSyncExternalStore } from "react";
import { PLANS, PLAN_ORDER, type FeatureKey, type PlanId } from "@/config/plans";
import { useAccounts } from "@/contexts/AccountContext";
import { useCredits } from "@/hooks/useCredits";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuthUser } from "@/hooks/useAuthUser";

const KEY = "smmpilot:plan";

function readPlan(): PlanId {
  if (typeof window === "undefined") return "free";
  const v = window.localStorage.getItem(KEY);
  return (PLAN_ORDER as string[]).includes(v ?? "") ? (v as PlanId) : "free";
}

let planCache: PlanId = readPlan();
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Change the active plan (billing flows / demo switcher). */
export function setPlan(next: PlanId) {
  planCache = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, next);
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) { planCache = readPlan(); emit(); }
  });
}

export interface QuotaMeter {
  key: "posts" | "channels" | "credits" | "seats";
  label: string;
  used: number;
  cap: number | null;
  unit: string;
  pct: number;
}

/**
 * Resolves the workspace's plan entitlements plus live usage against them.
 * Guests always see the Professional demo tier so nothing is locked in the tour.
 */
export function usePlan() {
  const planId = useSyncExternalStore(subscribe, () => planCache, () => planCache);
  const { isGuest } = useAuthUser();
  const { accounts } = useAccounts();
  const { balance } = useCredits();
  const { posts } = useScheduledPosts();
  const { members } = useTeamMembers();

  const effectiveId: PlanId = isGuest ? "professional" : planId;
  const plan = PLANS[effectiveId];

  const postsThisMonth = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return posts.filter((p) => p.scheduledAt && new Date(p.scheduledAt) >= start).length;
  }, [posts]);


  const pct = (used: number, cap: number | null) =>
    cap === null ? 0 : Math.min(100, Math.round((used / Math.max(1, cap)) * 100));

  const meters: QuotaMeter[] = useMemo(
    () => [
      {
        key: "posts",
        label: "Scheduled posts",
        used: postsThisMonth,
        cap: plan.monthlyPosts,
        unit: "posts / mo",
        pct: pct(postsThisMonth, plan.monthlyPosts),
      },
      {
        key: "channels",
        label: "Connected channels",
        used: accounts.length,
        cap: plan.channels,
        unit: "channels",
        pct: pct(accounts.length, plan.channels),
      },
      {
        key: "credits",
        label: "AI credits",
        used: balance.usedThisMonth,
        cap: plan.aiCredits,
        unit: "credits / mo",
        pct: pct(balance.usedThisMonth, plan.aiCredits),
      },
      {
        key: "seats",
        label: "Team seats",
        used: Math.max(1, members.length),
        cap: plan.seats,
        unit: "seats",
        pct: pct(Math.max(1, members.length), plan.seats),
      },
    ],
    [postsThisMonth, accounts.length, balance.usedThisMonth, members.length, plan],
  );

  const can = useCallback((feature: FeatureKey) => plan.features[feature], [plan]);

  const withinLimit = useCallback(
    (key: QuotaMeter["key"]) => {
      const m = meters.find((x) => x.key === key);
      if (!m || m.cap === null) return true;
      return m.used < m.cap;
    },
    [meters],
  );

  const nextPlan = useMemo(() => {
    const i = PLAN_ORDER.indexOf(effectiveId);
    return i >= 0 && i < PLAN_ORDER.length - 1 ? PLANS[PLAN_ORDER[i + 1]] : null;
  }, [effectiveId]);

  return { plan, planId: effectiveId, setPlan, can, meters, withinLimit, nextPlan, isDemoPlan: isGuest };
}
