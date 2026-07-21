import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGuest } from "@/hooks/useGuest";

export type PlatformRollupRow = {
  platform: string;
  day: string;
  followers: number;
  engagement: number;
  reach: number;
  impressions: number;
  posts: number;
  accounts: number;
};

/**
 * Reads pre-aggregated per-platform daily rollups from platform_rollup_daily.
 * Guests get an empty set (analytics UIs already have a demo fallback path).
 */
export function usePlatformRollup(days = 30, platform?: string) {
  const { isGuest } = useGuest();
  const [rows, setRows] = useState<PlatformRollupRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      if (isGuest) {
        setRows([]);
        setLoading(false);
        return;
      }
      const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
      let q = supabase
        .from("platform_rollup_daily")
        .select("platform, day, followers, engagement, reach, impressions, posts, accounts")
        .gte("day", since)
        .order("day", { ascending: true });
      if (platform) q = q.eq("platform", platform);
      const { data } = await q;
      if (!cancelled) {
        setRows((data as PlatformRollupRow[]) ?? []);
        setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [isGuest, days, platform]);

  async function refresh() {
    if (isGuest) return;
    await supabase.functions.invoke("analytics-rollup", { body: { days } });
    // reload
    const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
    let q = supabase
      .from("platform_rollup_daily")
      .select("platform, day, followers, engagement, reach, impressions, posts, accounts")
      .gte("day", since)
      .order("day", { ascending: true });
    if (platform) q = q.eq("platform", platform);
    const { data } = await q;
    setRows((data as PlatformRollupRow[]) ?? []);
  }

  return { rows, loading, refresh };
}
