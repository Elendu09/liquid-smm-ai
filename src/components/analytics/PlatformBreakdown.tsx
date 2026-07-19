import { useMemo } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { useAccounts } from "@/contexts/AccountContext";
import { resolveMetric } from "@/hooks/useCustomReports";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";
import type { RangeKey } from "./KpiHero";
import { RANGE_DAYS } from "./KpiHero";

export function PlatformBreakdown({ range }: { range: RangeKey }) {
  const { accounts } = useAccounts();
  const days = RANGE_DAYS[range];

  const rows = useMemo(() => {
    return accounts.map((a) => {
      const trend = resolveMetric("followers", days, Math.max(500, a.followers / 10));
      const first = trend[0]?.value ?? 0;
      const last = trend[trend.length - 1]?.value ?? 0;
      const delta = first ? ((last - first) / first) * 100 : 0;
      return { account: a, trend, delta };
    });
  }, [accounts, days]);

  return (
    <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <div>
          <h3 className="text-base font-semibold">Platform breakdown</h3>
          <p className="text-xs text-muted-foreground">Followers, engagement & health per connected channel.</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{accounts.length} accounts</span>
      </header>
      <div className="divide-y divide-border/50">
        {rows.map(({ account, trend, delta }) => {
          const positive = delta >= 0;
          return (
            <div key={account.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
              <PlatformIcon platform={account.platformId} size="md" showBackground />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">@{account.username}</p>
                <p className="text-[11px] text-muted-foreground truncate capitalize">
                  {account.platformId} · {account.posts} posts
                </p>
              </div>
              <div className="hidden sm:block h-8 w-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={positive ? "hsl(142 71% 45%)" : "hsl(346 84% 61%)"}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-right shrink-0 w-20">
                <p className="text-sm font-semibold tabular-nums">{account.followers.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">followers</p>
              </div>
              <div className="text-right shrink-0 w-16">
                <p className="text-sm font-semibold tabular-nums">{account.engagement.toFixed(1)}%</p>
                <p className="text-[10px] text-muted-foreground">ER</p>
              </div>
              <span
                className={cn(
                  "hidden md:inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-1 rounded-full tabular-nums shrink-0 w-20 justify-center",
                  positive ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10",
                )}
              >
                {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {positive ? "+" : ""}{delta.toFixed(1)}%
              </span>
              <div className="hidden lg:flex items-center gap-1.5 shrink-0 w-24">
                <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      account.healthScore >= 80 ? "bg-emerald-500" : account.healthScore >= 60 ? "bg-amber-500" : "bg-rose-500",
                    )}
                    style={{ width: `${account.healthScore}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right">{account.healthScore}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
