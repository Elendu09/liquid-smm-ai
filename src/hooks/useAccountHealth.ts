import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGuest } from "@/hooks/useGuest";
import { useAccounts } from "@/contexts/AccountContext";
import { useScopedAccounts } from "@/hooks/useScopedAccounts";

export interface BaselineRow {
  account_id: string;
  metric: string;
  window_hours: number;
  value: number;
  sample_size: number;
  updated_at: string;
}

/**
 * Live engagement baselines and per-account health scores. In guest mode,
 * derives a stable synthetic score from each demo account so the Health page
 * still renders trends.
 */
export function useAccountHealth() {
  const { isGuest: guest } = useGuest();
  const { accounts } = useScopedAccounts();
  const [baselines, setBaselines] = useState<BaselineRow[]>([]);
  const [loading, setLoading] = useState(!guest);

  useEffect(() => {
    if (guest) { setBaselines([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("post_metrics_baseline")
        .select("account_id, metric, window_hours, value, sample_size, updated_at")
        .order("updated_at", { ascending: false });
      if (cancelled) return;
      setBaselines((data ?? []) as BaselineRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [guest]);

  const recompute = async () => {
    await supabase.functions.invoke("health-recompute", { body: {} });
  };

  const byAccount = new Map<string, Record<string, BaselineRow>>();
  for (const b of baselines) {
    const m = byAccount.get(b.account_id) ?? {};
    m[b.metric] = b;
    byAccount.set(b.account_id, m);
  }

  const accountHealth = accounts.map((a) => {
    const b = byAccount.get(a.id) ?? {};
    return {
      account: a,
      score: a.healthScore ?? (guest ? 70 + ((a.followers ?? 0) % 25) : 0),
      baselineEngagement: b.engagement?.value ?? 0,
      baselineImpressions: b.impressions?.value ?? 0,
      stddev: b.engagement_stddev?.value ?? 0,
      sampleSize: b.engagement?.sample_size ?? 0,
      lastUpdated: b.engagement?.updated_at ?? null,
    };
  });

  return { accountHealth, loading, recompute };
}
