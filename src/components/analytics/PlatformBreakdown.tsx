import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, RefreshCw, Sparkles } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";
import { useAccountSeries, RANGE_DAYS, type RangeKey } from "@/hooks/useAnalyticsSeries";
import { usePlatformRollup } from "@/hooks/usePlatformRollup";
import { useGuest } from "@/hooks/useGuest";
import { toast } from "sonner";

export function PlatformBreakdown({ range }: { range: RangeKey }) {
  const rows = useAccountSeries("followers", range);
  const accounts = rows.map((r) => r.account);
  const { isGuest } = useGuest();
  const days = RANGE_DAYS[range] ?? 30;
  const { rows: rollupRows, loading: rollupLoading, refresh } = usePlatformRollup(days);
  const [refreshing, setRefreshing] = useState(false);

  const platformTotals = useMemo(() => {
    const map = new Map<string, { platform: string; followers: number; engagement: number; posts: number; reach: number; accounts: number; sample: number }>();
    for (const r of rollupRows) {
      const cur = map.get(r.platform) ?? { platform: r.platform, followers: 0, engagement: 0, posts: 0, reach: 0, accounts: 0, sample: 0 };
      cur.followers = Math.max(cur.followers, r.followers);
      cur.engagement += Number(r.engagement) || 0;
      cur.posts += r.posts;
      cur.reach += r.reach;
      cur.accounts = Math.max(cur.accounts, r.accounts);
      cur.sample += 1;
      map.set(r.platform, cur);
    }
    return Array.from(map.values())
      .map((p) => ({ ...p, engagement: p.sample ? p.engagement / p.sample : 0 }))
      .sort((a, b) => b.followers - a.followers);
  }, [rollupRows]);

  async function handleRefresh() {
    if (isGuest) return;
    setRefreshing(true);
    try {
      await refresh();
      toast.success("Platform rollups refreshed");
    } catch {
      toast.error("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            Platform breakdown
            {isGuest && <Sparkles className="h-3 w-3 text-amber-500" />}
          </h3>
          <p className="text-xs text-muted-foreground">Followers, engagement & health per connected channel.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">{accounts.length} accounts</span>
          {!isGuest && (
            <button
              onClick={handleRefresh}
              disabled={refreshing || rollupLoading}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background/60 hover:bg-muted transition-colors disabled:opacity-50"
              title="Refresh rollups"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", (refreshing || rollupLoading) && "animate-spin")} />
            </button>
          )}
        </div>
      </header>

      {platformTotals.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-border/40 bg-muted/20">
          {platformTotals.map((p) => (
            <div
              key={p.platform}
              className="flex items-center gap-2 shrink-0 rounded-lg border border-border/60 bg-background/60 px-3 py-2 min-w-[180px]"
            >
              <PlatformIcon platform={p.platform as any} size="sm" showBackground />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground capitalize truncate">{p.platform}</p>
                <p className="text-sm font-semibold tabular-nums">{p.followers.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">ER</p>
                <p className="text-xs font-semibold tabular-nums text-primary">{p.engagement.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      )}

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
