import { ArrowUp, ArrowDown, Users, Heart, Eye, MousePointerClick, MessageSquare, TrendingUp, Sparkles } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { useAnalyticsSeries, RANGE_DAYS, type RangeKey } from "@/hooks/useAnalyticsSeries";
import { useScopedAccounts } from "@/hooks/useScopedAccounts";
import { EmptyState } from "@/components/shared/EmptyState";
import { TimezoneLabel } from "@/components/accounts/TimezoneSelector";
import { useAccounts } from "@/contexts/AccountContext";

const RANGES = ["1D", "7D", "30D", "90D", "1Y"] as const;

type KpiDef = {
  id: "followers" | "engagement" | "reach" | "replies" | "impressions" | "ctr";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  unit?: string;
  accent: string;
};

const KPIS: KpiDef[] = [
  { id: "followers", label: "Followers", icon: Users, accent: "hsl(var(--primary))" },
  { id: "engagement", label: "Engagement", icon: Heart, unit: "%", accent: "#ec4899" },
  { id: "reach", label: "Reach", icon: Eye, accent: "#10b981" },
  { id: "impressions", label: "Impressions", icon: TrendingUp, accent: "#f59e0b" },
  { id: "replies", label: "Replies", icon: MessageSquare, accent: "#8b5cf6" },
  { id: "ctr", label: "CTR", icon: MousePointerClick, unit: "%", accent: "#06b6d4" },
];

function fmt(v: number, unit?: string) {
  if (unit === "%") return `${v.toFixed(1)}%`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return Math.round(v).toLocaleString();
}

interface KpiHeroProps {
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
}

export function KpiHero({ range, onRangeChange }: KpiHeroProps) {
  const { accounts } = useScopedAccounts();
  const { activeAccount } = useAccounts();
  const followers = useAnalyticsSeries("followers", range);
  const engagement = useAnalyticsSeries("engagement", range);
  const reach = useAnalyticsSeries("reach", range);
  const impressions = useAnalyticsSeries("impressions", range);
  const replies = useAnalyticsSeries("replies", range);
  const ctr = useAnalyticsSeries("ctr", range);
  const byId: Record<KpiDef["id"], ReturnType<typeof useAnalyticsSeries>> = {
    followers, engagement, reach, impressions, replies, ctr,
  };

  const loading = followers.loading;
  const isDemo = followers.isDemo;
  const noAccounts = !isDemo && accounts.length === 0;
  const noData =
    !isDemo && !loading && accounts.length > 0 && followers.series.every((p) => !p.value);
  const cards = KPIS.map((k) => {
    const s = byId[k.id];
    const value = k.id === "engagement" || k.id === "ctr" || k.id === "followers" ? s.latest : s.total;
    return { ...k, data: s.series, value, delta: s.delta };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Performance snapshot</h2>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
            {isDemo ? (
              <><Sparkles className="h-3 w-3" /> Demo data — connect an account to see your real signal.</>
            ) : noAccounts ? (
              "Connect an account to start collecting metrics."
            ) : noData ? (
              "Collecting your first snapshot — check back shortly."
            ) : loading ? "Loading latest metrics…" : "Live signal across every connected account."}
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-muted/60 border border-border/40" role="tablist" aria-label="Range">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              role="tab"
              aria-selected={range === r}
              className={cn(
                "px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all",
                range === r ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {noAccounts ? (
        <EmptyState variant="connect-account" />
      ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const positive = c.delta >= 0;
          return (
            <article
              key={c.id}
              className="relative overflow-hidden rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm p-3 hover:border-border transition-colors"
            >
              <div className="flex items-start justify-between mb-1.5">
                <div
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${c.accent}20`, color: c.accent }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {/* Delta only — the reconciliation "Matches platform" chip was
                    removed from the card (second UI cleaned up) */}
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full",
                    positive ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10",
                  )}
                >
                  {positive ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                  {positive ? "+" : ""}{c.delta.toFixed(1)}%
                </span>
              </div>
              <p className="text-xl font-bold tabular-nums leading-tight">{fmt(c.value, c.unit)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{c.label}</p>
              <div className="h-8 -mx-1 mt-1 opacity-90">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={c.data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`spark-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c.accent} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Area type="monotone" dataKey="value" stroke={c.accent} strokeWidth={1.5} fill={`url(#spark-${c.id})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <TimezoneLabel accountId={activeAccount?.id} className="mt-1" />
            </article>
          );
        })}
      </div>
      )}
    </div>
  );
}

export { RANGES };
export { RANGE_DAYS } from "@/hooks/useAnalyticsSeries";
export type { RangeKey };
