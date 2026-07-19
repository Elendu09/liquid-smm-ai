import { useCallback, useState } from "react";
import { useAccounts } from "@/contexts/AccountContext";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";

export type CheckStatus = "pass" | "warn" | "fail" | "pending";

export interface CheckResult {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  fixLabel?: string;
  fix?: () => void;
}

const APP_VERSION = "v2.4.1";

export function useTroubleshooter() {
  const { accounts } = useAccounts();
  const { posts } = useScheduledPosts();
  const { preferences } = useNotificationPreferences();
  const [results, setResults] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);
  const [ranAt, setRanAt] = useState<Date | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setResults([]);
    const out: CheckResult[] = [];

    // 1) Account connections
    const broken = accounts.filter((a) => a.status === "error" || a.status === "disconnected");
    const warnings = accounts.filter((a) => a.status === "warning");
    out.push({
      id: "accounts",
      label: "Connected accounts",
      status: broken.length ? "fail" : warnings.length ? "warn" : accounts.length ? "pass" : "warn",
      detail: accounts.length
        ? `${accounts.length} connected · ${broken.length} needing re-auth · ${warnings.length} with warnings`
        : "No social accounts connected yet.",
      fixLabel: broken.length || !accounts.length ? "Manage accounts" : undefined,
      fix: () => window.location.assign("/dashboard/settings/accounts"),
    });

    // 2) Publishing queue health
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const failed = posts.filter(
      (p) => p.status === "failed" && new Date(p.createdAt).getTime() > dayAgo,
    );
    out.push({
      id: "queue",
      label: "Publishing queue (24h)",
      status: failed.length > 3 ? "fail" : failed.length ? "warn" : "pass",
      detail: failed.length
        ? `${failed.length} post${failed.length === 1 ? "" : "s"} failed in the last 24 hours.`
        : "No failed posts in the last 24 hours.",
      fixLabel: failed.length ? "Open queue" : undefined,
      fix: () => window.location.assign("/dashboard/publish/queue"),
    });

    // 3) Notification wiring
    const webhook = preferences?.channels?.webhook;
    const email = preferences?.channels?.email;
    const hasChannel = webhook?.enabled || email?.enabled || preferences?.channels?.inApp?.enabled;
    out.push({
      id: "notifications",
      label: "Notification channels",
      status: hasChannel ? "pass" : "warn",
      detail: hasChannel
        ? `Active channels: ${[
            preferences?.channels?.inApp?.enabled && "in-app",
            email?.enabled && "email",
            webhook?.enabled && "webhook",
          ]
            .filter(Boolean)
            .join(", ") || "in-app"}.`
        : "No delivery channels enabled — you may miss important alerts.",
      fixLabel: "Notification settings",
      fix: () => window.location.assign("/dashboard/activity/notifications"),
    });

    // 4) Browser support
    const perms: string[] = [];
    let notifStatus: CheckStatus = "pass";
    if ("Notification" in window) {
      const p = Notification.permission;
      perms.push(`notifications: ${p}`);
      if (p === "denied") notifStatus = "warn";
      else if (p === "default") notifStatus = "warn";
    } else {
      perms.push("notifications unsupported");
      notifStatus = "warn";
    }
    perms.push(navigator.onLine ? "online" : "offline");
    if (!navigator.onLine) notifStatus = "fail";

    let storageDetail = "";
    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const est = await navigator.storage.estimate();
        const usedMb = Math.round(((est.usage ?? 0) / (1024 * 1024)) * 10) / 10;
        const quotaMb = Math.round(((est.quota ?? 0) / (1024 * 1024)) * 10) / 10;
        storageDetail = ` · storage: ${usedMb}MB / ${quotaMb}MB`;
      }
    } catch {
      /* ignore */
    }

    out.push({
      id: "browser",
      label: "Browser environment",
      status: notifStatus,
      detail: perms.join(" · ") + storageDetail,
      fixLabel:
        "Notification" in window && Notification.permission === "default"
          ? "Enable notifications"
          : undefined,
      fix: () => {
        if ("Notification" in window) Notification.requestPermission();
      },
    });

    // 5) AI gateway ping (SkyRank)
    const t0 = performance.now();
    let aiStatus: CheckStatus = "pass";
    let aiDetail = "";
    try {
      const res = await fetch("https://skyrank.digital/api/health", {
        method: "GET",
        signal: AbortSignal.timeout?.(4000),
      });
      const latency = Math.round(performance.now() - t0);
      if (!res.ok) {
        aiStatus = "warn";
        aiDetail = `Responded ${res.status} in ${latency}ms.`;
      } else {
        aiStatus = latency > 2500 ? "warn" : "pass";
        aiDetail = `Reachable · ${latency}ms round-trip.`;
      }
    } catch {
      aiStatus = "warn";
      aiDetail = "AI gateway unreachable from this browser (check network / VPN).";
    }
    out.push({
      id: "ai",
      label: "AI gateway",
      status: aiStatus,
      detail: aiDetail,
    });

    setResults(out);
    setRanAt(new Date());
    setRunning(false);
  }, [accounts, posts, preferences]);

  const report = useCallback(() => {
    return [
      `SMMSAAS Diagnostic Report`,
      `Generated: ${new Date().toISOString()}`,
      `App: ${APP_VERSION}`,
      `URL: ${window.location.href}`,
      `User agent: ${navigator.userAgent}`,
      ``,
      ...results.map((r) => `[${r.status.toUpperCase()}] ${r.label} — ${r.detail}`),
    ].join("\n");
  }, [results]);

  return { results, run, running, ranAt, report, version: APP_VERSION };
}
