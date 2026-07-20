import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AccountMetricPoint {
  day: string;
  followers: number | null;
  following: number | null;
  posts: number | null;
  engagement: number | null;
}

/**
 * Reads the hourly-collected `account_metrics_daily` snapshots for a given
 * connected account so charts can render real historical follower/engagement
 * data instead of the previous local sample.
 */
export function useAccountMetrics(accountId: string | null, days = 30) {
  const [rows, setRows] = useState<AccountMetricPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) { setRows([]); return; }
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      const { data, error: err } = await supabase
        .from("account_metrics_daily")
        .select("day, followers, following, posts, engagement")
        .eq("account_id", accountId)
        .gte("day", since)
        .order("day", { ascending: true });
      if (cancelled) return;
      if (err) setError(err.message);
      else setRows((data ?? []) as AccountMetricPoint[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [accountId, days]);

  return { rows, loading, error };
}
