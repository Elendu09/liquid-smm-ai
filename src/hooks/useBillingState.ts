import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * useBillingState
 *
 * Fix 6.2 — 30-day grace period.
 * Publishing keeps running, analytics read-only, exports always work.
 *
 * State machine: active -> grace -> frozen
 * Persists to localStorage key 'smmpilot:billing-state'
 */
export type BillingStatus = "active" | "grace" | "frozen";

interface BillingState {
  status: BillingStatus;
  /** ISO timestamp when grace started. null when active. */
  graceStartedAt: string | null;
  /** ISO timestamp when grace expires (graceStartedAt + 30 days). */
  graceEndsAt: string | null;
}

const STORAGE_KEY = "smmpilot:billing-state";
const GRACE_DAYS = 30;

function defaultState(): BillingState {
  return { status: "active", graceStartedAt: null, graceEndsAt: null };
}

function readState(): BillingState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as BillingState;
    if (!parsed || !["active", "grace", "frozen"].includes(parsed.status)) return defaultState();
    // auto-transition grace -> frozen if expired
    if (parsed.status === "grace" && parsed.graceEndsAt) {
      const ends = new Date(parsed.graceEndsAt).getTime();
      if (Date.now() >= ends) {
        return { ...parsed, status: "frozen" };
      }
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

let cache: BillingState = readState();
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function setCache(next: BillingState) {
  cache = next;
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }
  emit();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      cache = readState();
      emit();
    }
  });
}

function daysLeftFor(state: BillingState): number {
  if (state.status !== "grace" || !state.graceEndsAt) return 0;
  const diff = new Date(state.graceEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function useBillingState() {
  const state = useSyncExternalStore(subscribe, () => cache, () => cache);

  // realize auto-transition check on every render (cheap)
  const realized: BillingState = useMemo(() => {
    if (state.status === "grace" && state.graceEndsAt) {
      const ends = new Date(state.graceEndsAt).getTime();
      if (Date.now() >= ends) return { ...state, status: "frozen" as const };
    }
    return state;
  }, [state]);

  const daysLeft = useMemo(() => daysLeftFor(realized), [realized]);
  const status = realized.status;

  const enterGrace = useCallback(() => {
    const now = new Date();
    const ends = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
    setCache({
      status: "grace",
      graceStartedAt: now.toISOString(),
      graceEndsAt: ends.toISOString(),
    });
  }, []);

  const resume = useCallback(() => {
    setCache({ status: "active", graceStartedAt: null, graceEndsAt: null });
  }, []);

  const cancel = useCallback(() => {
    // cancel moves to frozen immediately (or after grace if desired)
    setCache({ status: "frozen", graceStartedAt: realized.graceStartedAt, graceEndsAt: realized.graceEndsAt });
  }, [realized.graceStartedAt, realized.graceEndsAt]);

  /** Permission map: publishing keeps running, analytics read-only, exports always work. */
  const can = useMemo(() => {
    if (status === "active") {
      return {
        publish: true,
        analyticsWrite: true,
        analyticsRead: true,
        export: true,
        inviteTeam: true,
        manageBilling: true,
      } as const;
    }
    if (status === "grace") {
      return {
        publish: true,
        analyticsWrite: false,
        analyticsRead: true,
        export: true,
        inviteTeam: false,
        manageBilling: true,
      } as const;
    }
    // frozen
    return {
      publish: false,
      analyticsWrite: false,
      analyticsRead: true,
      export: true,
      inviteTeam: false,
      manageBilling: false,
    } as const;
  }, [status]);

  // convenience aliases
  const isActive = status === "active";
  const isGrace = status === "grace";
  const isFrozen = status === "frozen";

  return {
    status,
    state: realized,
    daysLeft,
    isActive,
    isGrace,
    isFrozen,
    can,
    enterGrace,
    resume,
    cancel,
  };
}
