import { useMemo } from "react";
import { Filter } from "lucide-react";
import { useAccounts } from "@/contexts/AccountContext";
import { useGuest } from "@/hooks/useGuest";
import { useAnalyticsOverview } from "@/hooks/useAnalyticsOverview";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

/**
 * Conversion funnel. For signed-in users totals come from post_metrics
 * (impressions/reach/engagements/clicks). Guest keeps the demo synth path.
 */
export function FunnelCard() {
  const { accounts } = useAccounts();
  const { isGuest } = useGuest();
  const { funnel, loading } = useAnalyticsOverview(90);

  const stages = useMemo(() => {
    if (isGuest) {
      const base = Math.max(50_000, accounts.reduce((s, a) => s + a.followers, 0) * 6);
      return [
        { label: "Impressions", value: base, color: "hsl(var(--primary))" },
        { label: "Reach", value: Math.round(base * 0.62), color: "#10b981" },
        { label: "Engaged", value: Math.round(base * 0.14), color: "#f59e0b" },
        { label: "Clicked", value: Math.round(base * 0.045), color: "#ec4899" },
        { label: "Converted", value: Math.round(base * 0.008), color: "#8b5cf6" },
      ];
    }
    if (!funnel) return null;
    return [
      { label: "Impressions", value: funnel.impressions, color: "hsl(var(--primary))" },
      { label: "Reach", value: funnel.reach, color: "#10b981" },
      { label: "Engaged", value: funnel.engaged, color: "#f59e0b" },
      { label: "Clicked", value: funnel.clicks, color: "#ec4899" },
      { label: "Converted", value: funnel.converted, color: "#8b5cf6" },
    ];
  }, [isGuest, accounts, funnel]);

  if (!isGuest && (!stages || stages.every((s) => s.value === 0))) {
    return (
      <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
        <header className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Conversion funnel</h3>
        </header>
        <EmptyState
          icon={Filter}
          title={loading ? "Loading funnel…" : accounts.length === 0 ? "No accounts connected" : "Collecting post metrics"}
          description={
            accounts.length === 0
              ? "Connect an account so we can start tracking impressions, reach and click-through."
              : "Publish a few posts — impressions and clicks will appear here as platforms return metrics."
          }
          ctaLabel={accounts.length === 0 ? "Connect account" : "Schedule a post"}
          ctaHref={accounts.length === 0 ? "/dashboard/settings/connected" : "/dashboard/publish/calendar"}
          compact
        />
      </section>
    );
  }

  const max = stages![0].value || 1;

  return (
    <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
      <header className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold">Conversion funnel</h3>
      </header>
      <div className="space-y-2">
        {stages!.map((s, i) => {
          const pct = (s.value / max) * 100;
          const prev = i > 0 ? stages![i - 1].value : s.value;
          const stagePct = prev ? (s.value / prev) * 100 : 100;
          return (
            <div key={s.label} className="group">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                <span className="text-xs tabular-nums">
                  <span className="font-semibold text-foreground">{s.value.toLocaleString()}</span>
                  {i > 0 && (
                    <span className={cn("ml-2", stagePct >= 40 ? "text-emerald-500" : stagePct >= 15 ? "text-amber-500" : "text-rose-500")}>
                      {stagePct.toFixed(1)}%
                    </span>
                  )}
                </span>
              </div>
              <div className="h-6 rounded-md bg-muted/40 overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-500 group-hover:brightness-110"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${s.color}dd, ${s.color}88)` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
