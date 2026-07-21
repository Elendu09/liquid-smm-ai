import { useMemo } from "react";
import { Filter } from "lucide-react";
import { useAccounts } from "@/contexts/AccountContext";
import { useGuest } from "@/hooks/useGuest";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

export function FunnelCard() {
  const { accounts } = useAccounts();
  const { isGuest } = useGuest();
  const base = useMemo(() => Math.max(50_000, accounts.reduce((s, a) => s + a.followers, 0) * 6), [accounts]);

  if (!isGuest) {
    return (
      <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
        <header className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Conversion funnel</h3>
        </header>
        <EmptyState
          icon={Filter}
          title="No funnel data yet"
          description="Connect an account and publish a few posts. Impressions, reach, and click data will appear here."
          ctaLabel="Connect account"
          ctaHref="/dashboard/settings/connected"
          compact
        />
      </section>
    );
  }

  const stages = [
    { label: "Impressions", value: base, color: "hsl(var(--primary))" },
    { label: "Reach", value: Math.round(base * 0.62), color: "#10b981" },
    { label: "Engaged", value: Math.round(base * 0.14), color: "#f59e0b" },
    { label: "Clicked", value: Math.round(base * 0.045), color: "#ec4899" },
    { label: "Converted", value: Math.round(base * 0.008), color: "#8b5cf6" },
  ];

  const max = stages[0].value;

  return (
    <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
      <header className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold">Conversion funnel</h3>
      </header>
      <div className="space-y-2">
        {stages.map((s, i) => {
          const pct = (s.value / max) * 100;
          const prev = i > 0 ? stages[i - 1].value : s.value;
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
