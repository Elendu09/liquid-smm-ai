import { useEffect } from "react";
import { isGuestSession } from "@/hooks/useGuest";
import { DEMO_SCHEDULED_POSTS, DEMO_RUN_HISTORY, DEMO_REPORT_RUNS, DEMO_REPORT_SCHEDULES, DEMO_WEBHOOKS, DEMO_SAVED_VIEWS } from "@/lib/demoSeeds";

/**
 * Ensures every demo key is seeded for guests on first visit.
 * Idempotent — only writes if localStorage is empty or missing.
 * Mounted once in DashboardLayout so all pages appear filled like Campaigns.
 */
export function DemoSeeder() {
  useEffect(() => {
    if (!isGuestSession()) return;
    try {
      const seeds: Array<{ key: string; data: unknown[] }> = [
        { key: "smmpilot:scheduled-posts", data: DEMO_SCHEDULED_POSTS },
        { key: "smmpilot:run-history", data: DEMO_RUN_HISTORY },
        { key: "smmpilot:reports:runs", data: DEMO_REPORT_RUNS },
        { key: "smmpilot:reports:schedules", data: DEMO_REPORT_SCHEDULES },
        { key: "smmpilot:webhooks", data: DEMO_WEBHOOKS },
        { key: "smmpilot:views:__all__", data: DEMO_SAVED_VIEWS },
        // engagement reshare flows
        { key: "smmpilot:engage:reshare-flows", data: [] }, // handled via hook seed, but ensure not empty?
      ];
      seeds.forEach(({ key, data }) => {
        const raw = window.localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed || (Array.isArray(parsed) && parsed.length === 0)) {
          if (data.length === 0) return;
          window.localStorage.setItem(key, JSON.stringify(data));
        }
      });
      // also ensure competitor and segment collections have data (they are under collection:* keys)
      const compKey = "collection:audience:competitors";
      const segKey = "collection:audience:segments";
      // these are handled via hook seed, but ensure local fallback exists
      if (!window.localStorage.getItem(compKey)) {
        // hook will seed on next read, but we trigger a storage event
        window.dispatchEvent(new Event("storage"));
      }
      if (!window.localStorage.getItem(segKey)) {
        window.dispatchEvent(new Event("storage"));
      }
    } catch {
      // ignore storage errors (privacy mode)
    }
  }, []);
  return null;
}
