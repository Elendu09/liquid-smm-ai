import { useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Users,
  Eye,
  Globe2,
  Smartphone,
  Monitor,
  Tablet,
  Link2,
  ArrowUpRight,
  Download,
  Sparkles,
  Clock,
  MapPin,
  Share2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useBioConfig } from "@/pages/dashboard/linkbio/state/bioConfig";
import { useGuest } from "@/hooks/useGuest";
import { EmptyState } from "@/components/shared/EmptyState";

type RangeKey = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90 };

// Deterministic pseudo-random for stable mock data
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function useAnalytics(range: RangeKey, linkCount: number) {
  return useMemo(() => {
    const days = RANGE_DAYS[range];
    const rnd = seeded(days * 13 + linkCount);
    const trend = Array.from({ length: days }, (_, i) => {
      const base = 80 + i * 3.4 + rnd() * 60;
      const visitors = Math.round(base * (0.55 + rnd() * 0.2));
      return {
        day: `D${i + 1}`,
        date: new Date(Date.now() - (days - i - 1) * 864e5).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        clicks: Math.round(base),
        visitors,
        ctr: +((base / (visitors * 3.4)) * 100).toFixed(1),
      };
    });
    const totalClicks = trend.reduce((s, d) => s + d.clicks, 0);
    const totalVisitors = trend.reduce((s, d) => s + d.visitors, 0);
    const avgCtr = +(trend.reduce((s, d) => s + d.ctr, 0) / trend.length).toFixed(1);
    return {
      trend,
      totalClicks,
      totalVisitors,
      avgCtr,
      views: Math.round(totalVisitors * 1.42),
    };
  }, [range, linkCount]);
}

const DEVICE_COLORS = ["hsl(var(--primary))", "hsl(217 91% 68%)", "hsl(280 85% 65%)"];
const REFERRERS = [
  { name: "Instagram", value: 42, color: "hsl(340 82% 60%)" },
  { name: "TikTok", value: 24, color: "hsl(200 90% 55%)" },
  { name: "YouTube", value: 15, color: "hsl(0 84% 60%)" },
  { name: "Twitter/X", value: 9, color: "hsl(210 15% 30%)" },
  { name: "Direct", value: 6, color: "hsl(var(--muted-foreground))" },
  { name: "Other", value: 4, color: "hsl(var(--muted-foreground) / .6)" },
];
const GEO = [
  { country: "United States", flag: "🇺🇸", pct: 34 },
  { country: "United Kingdom", flag: "🇬🇧", pct: 18 },
  { country: "Germany", flag: "🇩🇪", pct: 11 },
  { country: "Canada", flag: "🇨🇦", pct: 9 },
  { country: "Australia", flag: "🇦🇺", pct: 7 },
  { country: "Brazil", flag: "🇧🇷", pct: 6 },
];

function Sparkline({ data, positive = true }: { data: number[]; positive?: boolean }) {
  const series = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={series} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={positive ? "hsl(var(--primary))" : "hsl(0 84% 60%)"}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function KpiCard({
  label,
  value,
  delta,
  positive,
  icon: Icon,
  spark,
}: {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  spark: number[];
}) {
  return (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-muted/30">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                {label}
              </p>
            </div>
            <p className="text-2xl font-bold mt-3 tabular-nums">{value}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {positive ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-500" />
              )}
              <span
                className={cn(
                  "text-[11px] font-semibold",
                  positive ? "text-emerald-500" : "text-rose-500",
                )}
              >
                {delta}
              </span>
              <span className="text-[11px] text-muted-foreground">vs previous</span>
            </div>
          </div>
          <div className="w-24 h-9 -mr-1">
            <Sparkline data={spark} positive={positive} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsView() {
  const cfg = useBioConfig();
  const { isGuest } = useGuest();
  const [range, setRange] = useState<RangeKey>("30d");
  const enabledLinks = cfg.links.filter((l) => l.enabled);
  const data = useAnalytics(range, enabledLinks.length);

  // Per-link mock stats seeded by link id
  const linkStats = useMemo(() => {
    return enabledLinks.map((l, i) => {
      const rnd = seeded(l.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0) + i);
      const clicks = Math.round(120 + rnd() * 1400);
      const ctr = +(4 + rnd() * 28).toFixed(1);
      const change = +((rnd() - 0.3) * 30).toFixed(1);
      return { ...l, clicks, ctr, change };
    }).sort((a, b) => b.clicks - a.clicks);
  }, [enabledLinks]);

  const topLinkClicks = linkStats[0]?.clicks ?? 1;

  // Hourly heatmap: 7 days x 24 hours
  const heatmap = useMemo(() => {
    const rnd = seeded(range.length * 42);
    return Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, (_, h) => {
        const peak = Math.exp(-Math.pow(h - 19, 2) / 30);
        return Math.round((peak * 80 + rnd() * 25));
      }),
    );
  }, [range]);
  const heatMax = Math.max(...heatmap.flat());

  const devices = [
    { name: "Mobile", value: 68, icon: Smartphone },
    { name: "Desktop", value: 24, icon: Monitor },
    { name: "Tablet", value: 8, icon: Tablet },
  ];

  const sparkClicks = data.trend.map((d) => d.clicks);
  const sparkVisitors = data.trend.map((d) => d.visitors);
  const sparkCtr = data.trend.map((d) => d.ctr);
  const sparkViews = data.trend.map((d) => Math.round(d.visitors * 1.4));

  // Signed-in users see real-only analytics. Until click-tracking events are
  // captured for their bio, show a contextual empty state instead of demo data.
  if (!isGuest) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <EmptyState
          icon={BarChart3}
          title="No bio analytics yet"
          description={
            enabledLinks.length === 0
              ? "Add and publish links in your bio to start tracking clicks, visitors, and referrers."
              : "We haven't recorded any visits to your bio yet. Share your link to start collecting real analytics."
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live · {cfg.slug || cfg.handle}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {enabledLinks.length} active {enabledLinks.length === 1 ? "link" : "links"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <TabsList className="h-8">
              <TabsTrigger value="7d" className="text-xs px-3">7d</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs px-3">30d</TabsTrigger>
              <TabsTrigger value="90d" className="text-xs px-3">90d</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
          <Button size="sm" className="h-8 gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total clicks" value={data.totalClicks.toLocaleString()} delta="+14.2%" positive icon={MousePointerClick} spark={sparkClicks} />
        <KpiCard label="Unique visitors" value={data.totalVisitors.toLocaleString()} delta="+8.5%" positive icon={Users} spark={sparkVisitors} />
        <KpiCard label="Page views" value={data.views.toLocaleString()} delta="+11.9%" positive icon={Eye} spark={sparkViews} />
        <KpiCard label="Avg. CTR" value={`${data.avgCtr}%`} delta="+2.1pp" positive icon={TrendingUp} spark={sparkCtr} />
      </div>

      {/* Trend + Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="border-b border-border/40 flex-row items-center justify-between space-y-0 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Clicks vs Visitors
            </CardTitle>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Clicks</span>
              <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Visitors</span>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gVis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="visitors" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} fill="url(#gVis)" />
                  <Area type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gClicks)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="border-b border-border/40 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-primary" /> Traffic sources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="h-40 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={REFERRERS}
                    dataKey="value"
                    innerRadius={44}
                    outerRadius={68}
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {REFERRERS.map((r) => (
                      <Cell key={r.name} fill={r.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold tabular-nums">{data.totalVisitors.toLocaleString()}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">visitors</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {REFERRERS.map((r) => (
                <div key={r.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
                    <span>{r.name}</span>
                  </div>
                  <span className="font-medium tabular-nums text-muted-foreground">{r.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top links */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/40 flex-row items-center justify-between space-y-0 py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" /> Link performance
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">Sorted by clicks · last {RANGE_DAYS[range]} days</span>
        </CardHeader>
        <CardContent className="p-0">
          {linkStats.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Add links to your bio to start tracking clicks.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {linkStats.map((l, i) => (
                <div key={l.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={cn(
                        "w-7 h-7 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0",
                        i === 0 ? "bg-primary/15 text-primary border border-primary/25" : "bg-muted text-muted-foreground",
                      )}>
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{l.title}</span>
                          {l.highlight && (
                            <Badge variant="outline" className="h-4 px-1 text-[9px] border-primary/30 text-primary">
                              FEATURED
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{l.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CTR</p>
                        <p className="text-xs font-semibold tabular-nums">{l.ctr}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Clicks</p>
                        <p className="text-xs font-semibold tabular-nums">{l.clicks.toLocaleString()}</p>
                      </div>
                      <span className={cn(
                        "text-xs font-semibold tabular-nums w-14 text-right",
                        l.change >= 0 ? "text-emerald-500" : "text-rose-500",
                      )}>
                        {l.change >= 0 ? "+" : ""}{l.change}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                      style={{ width: `${Math.max(4, (l.clicks / topLinkClicks) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Devices + Heatmap + Geo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/40 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" /> Devices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={devices} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={60} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {devices.map((_, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {devices.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <d.icon className="h-3.5 w-3.5" style={{ color: DEVICE_COLORS[i] }} />
                    {d.name}
                  </span>
                  <span className="font-semibold tabular-nums">{d.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="border-b border-border/40 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Peak hours
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, di) => (
                <div key={day} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-7">{day}</span>
                  <div className="flex gap-[2px] flex-1">
                    {heatmap[di].map((v, hi) => {
                      const intensity = v / heatMax;
                      return (
                        <div
                          key={hi}
                          className="flex-1 h-3 rounded-sm"
                          style={{
                            background: `hsl(var(--primary) / ${0.08 + intensity * 0.85})`,
                          }}
                          title={`${day} ${hi}:00 · ${v} clicks`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 text-[10px] text-muted-foreground">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:00</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Peak window: <span className="font-medium text-foreground">6-9pm</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="border-b border-border/40 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Top locations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {GEO.map((g) => (
              <div key={g.country} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{g.flag}</span>
                    {g.country}
                  </span>
                  <span className="font-semibold tabular-nums text-muted-foreground">{g.pct}%</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${g.pct * 2.5}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Footer insight */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Insight</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your top link{" "}
              <span className="font-medium text-foreground">{linkStats[0]?.title ?? "—"}</span> is
              driving {topLinkClicks.toLocaleString()} clicks. Consider pinning a second high-intent
              link near the top to lift CTR further.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-xs shrink-0">
            Open editor <ArrowUpRight className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        Analytics shown are illustrative. Real click tracking activates once your bio page is
        published to a live URL.
      </p>
    </div>
  );
}
