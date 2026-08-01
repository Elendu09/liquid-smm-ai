import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FulfillmentPulse {
  queued: number;
  sending: number;
  completed24h: number;
  failed24h: number;
  completedTotal: number;
  accounts: number;
  hourly: number[];
  generatedAt: string | null;
}

const EMPTY: FulfillmentPulse = {
  queued: 0,
  sending: 0,
  completed24h: 0,
  failed24h: 0,
  completedTotal: 0,
  accounts: 0,
  hourly: [],
  generatedAt: null,
};

/**
 * Reads the public, aggregate-only order-fulfillment pulse (queued / sending /
 * completed / failed publish jobs) so the marketing hero visuals animate with
 * real automation activity. Polls so the mockup keeps moving live.
 */
export function useFulfillmentPulse(intervalMs = 20_000) {
  const [pulse, setPulse] = useState<FulfillmentPulse>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase.rpc("public_fulfillment_pulse");
      if (cancelled || error || !data) {
        if (!cancelled) setLoading(false);
        return;
      }
      const d = data as Record<string, unknown>;
      setPulse({
        queued: Number(d.queued ?? 0),
        sending: Number(d.sending ?? 0),
        completed24h: Number(d.completed_24h ?? 0),
        failed24h: Number(d.failed_24h ?? 0),
        completedTotal: Number(d.completed_total ?? 0),
        accounts: Number(d.accounts ?? 0),
        hourly: Array.isArray(d.hourly) ? (d.hourly as unknown[]).map((n) => Number(n) || 0) : [],
        generatedAt: (d.generated_at as string) ?? null,
      });
      setLoading(false);
    }

    void load();
    const t = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [intervalMs]);

  const total = pulse.completed24h + pulse.failed24h;
  const successRate = total > 0 ? Math.round((pulse.completed24h / total) * 100) : null;

  return { pulse, loading, successRate };
}
