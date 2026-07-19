import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccounts } from "@/contexts/AccountContext";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useNotifications } from "@/hooks/useNotifications";
import { useBestTimes } from "@/hooks/useBestTimes";

export interface HomeSummary {
  headline: string;
  highlights: string[];
  nextAction: string;
  pulse: "positive" | "mixed" | "attention";
  generatedAt: string;
}

const CACHE_KEY = "smmpilot:home-summary";

function readCache(): HomeSummary | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HomeSummary;
    // Expire after 6 hours or if the local day rolled over.
    const generated = new Date(parsed.generatedAt);
    if (Date.now() - generated.getTime() > 6 * 60 * 60 * 1000) return null;
    if (generated.toDateString() !== new Date().toDateString()) return null;
    return parsed;
  } catch { return null; }
}

function writeCache(s: HomeSummary) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

export function useHomeSummary() {
  const { accounts } = useAccounts();
  const { posts } = useScheduledPosts();
  const { notifications } = useNotifications();
  const best = useBestTimes();
  const [summary, setSummary] = useState<HomeSummary | null>(() => readCache());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aggregate = useMemo(() => {
    const upcoming = [...posts]
      .filter((p) => new Date(p.scheduledAt).getTime() >= Date.now() - 60_000)
      .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
    const completed = posts.filter((p) => p.status === "completed");
    const failed = posts.filter((p) => p.status === "failed");
    const topPost = completed[0]
      ? { caption: completed[0].caption, platform: completed[0].platformIds[0] ?? "unknown" }
      : null;
    const unread = notifications.filter((n) => !n.read);
    const critical = unread.filter((n) => n.severity === "critical" || n.severity === "warning");
    const dow = new Date().getDay();
    const hour = best.topHoursFor(dow, 1)[0];
    return {
      accounts: {
        total: accounts.length,
        followers: accounts.reduce((s, a) => s + a.followers, 0),
        engagement: accounts.length ? +(accounts.reduce((s, a) => s + a.engagement, 0) / accounts.length).toFixed(2) : 0,
      },
      scheduled: {
        total: upcoming.length,
        next: upcoming[0]
          ? { caption: upcoming[0].caption || "(no caption)", whenISO: upcoming[0].scheduledAt, platforms: upcoming[0].platformIds }
          : null,
      },
      posts: {
        completed: completed.length,
        failed: failed.length,
        topPost,
      },
      notifications: {
        unread: unread.length,
        critical: critical.length,
        recentTitles: unread.slice(0, 5).map((n) => n.title),
      },
      inbox: { positive: 0, negative: 0, needsReply: 0 },
      bestSlot: hour !== undefined ? { dow, hour } : null,
    };
  }, [accounts, posts, notifications, best]);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("ai-home-summary", { body: aggregate });
      if (fnErr) throw fnErr;
      const next: HomeSummary = { ...data, generatedAt: new Date().toISOString() };
      setSummary(next);
      writeCache(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't generate summary";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [aggregate]);

  // Auto-fetch once per day when no cache present.
  useEffect(() => {
    if (!summary && accounts.length > 0) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { summary, loading, error, refresh, aggregate };
}
