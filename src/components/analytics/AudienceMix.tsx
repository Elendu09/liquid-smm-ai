import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users } from "lucide-react";
import { useGuest } from "@/hooks/useGuest";
import { useScopedAccounts } from "@/hooks/useScopedAccounts";
import { useAnalyticsOverview } from "@/hooks/useAnalyticsOverview";
import { EmptyState } from "@/components/shared/EmptyState";

const AGE_DATA = [
  { name: "18-24", value: 28, color: "hsl(var(--primary))" },
  { name: "25-34", value: 41, color: "#10b981" },
  { name: "35-44", value: 18, color: "#f59e0b" },
  { name: "45-54", value: 9, color: "#ec4899" },
  { name: "55+", value: 4, color: "#8b5cf6" },
];
const GENDER = [
  { label: "Female", value: 58 },
  { label: "Male", value: 39 },
  { label: "Other", value: 3 },
];
const GEO = [
  { label: "United States", value: 42 },
  { label: "United Kingdom", value: 14 },
  { label: "Canada", value: 9 },
  { label: "Australia", value: 7 },
  { label: "Germany", value: 6 },
];

const PALETTE = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#38bdf8", "#f43f5e"];

/**
 * Audience mix. Guests see the curated demographic demo. Signed-in users see a
 * real "reach mix" derived from platform_rollup_daily + connected accounts:
 *  - Platform share (by follower total)
 *  - Account status split (active/paused/error)
 *  - Top platforms by posting volume
 * Real demographic breakdowns require platform-native audience endpoints and
 * are surfaced separately in Audience → Follower Analyzer.
 */
export function AudienceMix() {
  const { isGuest } = useGuest();
  const { accounts } = useScopedAccounts();
  const { platformSlices, loading } = useAnalyticsOverview(90);

  const real = useMemo(() => {
    const totalFollowers = platformSlices.reduce((s, p) => s + p.followers, 0);
    const sharePie = platformSlices
      .filter((p) => p.followers > 0)
      .sort((a, b) => b.followers - a.followers)
      .slice(0, 6)
      .map((p, i) => ({
        name: p.platform,
        value: totalFollowers > 0 ? Math.round((p.followers / totalFollowers) * 100) : 0,
        color: PALETTE[i % PALETTE.length],
      }));

    const statusCounts = accounts.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const statusTotal = Object.values(statusCounts).reduce((s, n) => s + n, 0);
    const statusBar = ["active", "paused", "error"].map((k, i) => ({
      label: k,
      value: statusTotal > 0 ? Math.round(((statusCounts[k] ?? 0) / statusTotal) * 100) : 0,
      color: ["hsl(var(--primary))", "#8b5cf6", "#f43f5e"][i],
    }));

    const topByPosts = [...platformSlices]
      .sort((a, b) => b.posts - a.posts)
      .slice(0, 5);
    const maxPosts = Math.max(1, ...topByPosts.map((p) => p.posts));

    return { sharePie, statusBar, topByPosts, maxPosts, totalFollowers };
  }, [platformSlices, accounts]);

  if (!isGuest) {
    if (loading) {
      return (
        <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
          <header className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Audience mix</h3>
          </header>
          <p className="text-xs text-muted-foreground py-6 text-center">Loading audience mix…</p>
        </section>
      );
    }
    if (real.sharePie.length === 0) {
      return (
        <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
          <header className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Audience mix</h3>
          </header>
          <EmptyState
            icon={Users}
            title={accounts.length === 0 ? "Connect an account" : "Collecting audience data"}
            description={
              accounts.length === 0
                ? "Once channels are connected we'll break down your reach by platform and status."
                : "Waiting for the next daily rollup — your follower totals will appear shortly."
            }
            ctaLabel={accounts.length === 0 ? "Connect account" : undefined}
            ctaHref={accounts.length === 0 ? "/dashboard/settings/connected" : undefined}
            compact
          />
        </section>
      );
    }
    return (
      <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
        <header className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Audience mix</h3>
          <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">live</span>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Followers by platform</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={real.sharePie} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                    {real.sharePie.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number, n) => [`${v}%`, String(n)]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {real.sharePie.map((a) => (
                <div key={a.name} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm" style={{ background: a.color }} />
                  <span className="text-muted-foreground capitalize truncate">{a.name}</span>
                  <span className="ml-auto tabular-nums">{a.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Account status</p>
              <div className="flex h-6 rounded-md overflow-hidden">
                {real.statusBar.filter((s) => s.value > 0).map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-center text-[10px] font-medium text-primary-foreground capitalize"
                    style={{ width: `${s.value}%`, background: s.color }}
                  >
                    {s.value > 12 ? `${s.label} ${s.value}%` : ""}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Most active platforms</p>
              <ul className="space-y-1.5">
                {real.topByPosts.map((g) => (
                  <li key={g.platform} className="flex items-center gap-2 text-xs">
                    <span className="w-24 truncate capitalize">{g.platform}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${(g.posts / real.maxPosts) * 100}%` }} />
                    </div>
                    <span className="tabular-nums w-10 text-right text-muted-foreground">{g.posts}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Guest / demo path — unchanged demographic showcase.
  return (
    <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
      <header className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold">Audience mix</h3>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Age distribution</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={AGE_DATA} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                  {AGE_DATA.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${v}%`, "Share"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            {AGE_DATA.map((a) => (
              <div key={a.name} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm" style={{ background: a.color }} />
                <span className="text-muted-foreground">{a.name}</span>
                <span className="ml-auto tabular-nums">{a.value}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Gender</p>
            <div className="flex h-6 rounded-md overflow-hidden">
              {GENDER.map((g, i) => (
                <div
                  key={g.label}
                  className="flex items-center justify-center text-[10px] font-medium text-primary-foreground"
                  style={{ width: `${g.value}%`, background: ["hsl(var(--primary))", "#8b5cf6", "#64748b"][i] }}
                >
                  {g.value > 10 ? `${g.label} ${g.value}%` : ""}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Top countries</p>
            <ul className="space-y-1.5">
              {GEO.map((g) => (
                <li key={g.label} className="flex items-center gap-2 text-xs">
                  <span className="w-28 truncate">{g.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${(g.value / 42) * 100}%` }} />
                  </div>
                  <span className="tabular-nums w-8 text-right text-muted-foreground">{g.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
