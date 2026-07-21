import { useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp, Sparkles, Rocket, Flag } from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { cn } from "@/lib/utils";
import { StoryTooltip, SceneCallout } from "./StoryTooltip";
import { useGuest } from "@/hooks/useGuest";
import { EmptyState } from "@/components/shared/EmptyState";

const followerData = [
  { month: "Jan", followers: 12400, engagement: 4.2 },
  { month: "Feb", followers: 14200, engagement: 4.8 },
  { month: "Mar", followers: 16800, engagement: 5.1 },
  { month: "Apr", followers: 19500, engagement: 5.4 },
  { month: "May", followers: 24300, engagement: 6.2 },
  { month: "Jun", followers: 31200, engagement: 7.1 },
];

function findBiggestJump() {
  let best = { index: 1, delta: 0 };
  for (let i = 1; i < followerData.length; i++) {
    const d = followerData[i].followers - followerData[i - 1].followers;
    if (d > best.delta) best = { index: i, delta: d };
  }
  return best;
}

function project(months: number) {
  const out = [...followerData.map((d) => ({ ...d, projected: null as number | null }))];
  const last = followerData[followerData.length - 1];
  const first = followerData[0];
  const growth = (last.followers - first.followers) / (followerData.length - 1);
  let current = last.followers;
  const monthNames = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let i = 0; i < months; i++) {
    current += growth;
    out.push({
      month: monthNames[i],
      followers: null as any,
      engagement: null as any,
      projected: Math.round(current),
    });
  }
  return out;
}

function useReducedMotion() {
  const [rm, setRm] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setRm(mq.matches);
    const l = () => setRm(mq.matches);
    mq.addEventListener("change", l);
    return () => mq.removeEventListener("change", l);
  }, []);
  return rm;
}

function Scene({
  index,
  title,
  eyebrow,
  icon: Icon,
  children,
  chart,
}: {
  index: number;
  title: string;
  eyebrow: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  chart: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const rm = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setInView(true)),
      { rootMargin: "-20% 0px -20% 0px", threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      aria-labelledby={`scene-${index}-title`}
      className="min-h-[80vh] md:min-h-[90vh] grid md:grid-cols-2 gap-6 md:gap-10 items-center py-10 md:py-16 border-b border-border/40 last:border-0"
    >
      <div className="md:sticky md:top-24">
        <div
          className={cn(
            "transition-all duration-700 ease-out",
            inView ? "opacity-100 translate-y-0" : "opacity-0",
            !inView && !rm && "translate-y-6",
          )}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Icon className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h3 id={`scene-${index}-title`} className="text-2xl md:text-4xl font-bold leading-tight mb-3">
            {title}
          </h3>
          <div className="text-sm md:text-base text-muted-foreground space-y-3 max-w-md">{children}</div>
        </div>
      </div>
      <div
        className={cn(
          "transition-all duration-1000 ease-out delay-150",
          inView ? "opacity-100 scale-100" : "opacity-0",
          !inView && !rm && "scale-95",
        )}
      >
        <div className="glass-card p-4 sm:p-6">{chart}</div>
      </div>
    </section>
  );
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

export function GrowthStory() {
  const { isGuest } = useGuest();
  const jump = useMemo(findBiggestJump, []);
  const projected = useMemo(() => project(6), []);
  const start = followerData[0];
  const now = followerData[followerData.length - 1];
  const growthPct = Math.round(((now.followers - start.followers) / start.followers) * 100);
  const jumpPoint = followerData[jump.index];

  if (!isGuest) {
    return (
      <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-muted/20 via-background to-background overflow-hidden">
        <div className="p-6 md:p-10 border-b border-border/40">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Your growth story</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            A scroll-through of how your presence evolves once you have at least a few months of follower and
            engagement history to look back on.
          </p>
        </div>
        <div className="p-6 md:p-10">
          <EmptyState
            icon={TrendingUp}
            title="Not enough history yet"
            description="Connect an account and let a few weeks of follower and engagement data accumulate — we'll narrate the story here."
            ctaLabel="Connect account"
            ctaHref="/dashboard/settings/connected"
          />
        </div>
      </div>
    );
  }


  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-muted/20 via-background to-background overflow-hidden">
      <div className="p-6 md:p-10 border-b border-border/40">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Your growth story</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          A scroll-through of how your presence has evolved — where you started, the moments that mattered, and
          where you're headed.
        </p>
      </div>
      <div className="px-4 sm:px-6 md:px-10">
        <Scene
          index={1}
          eyebrow="Chapter 1"
          title="Where you started"
          icon={Flag}
          chart={
            <div className="text-center py-8">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">6 months ago</p>
              <p className="text-5xl md:text-6xl font-bold mt-2">{start.followers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">followers</p>
              <div className="mt-6 inline-flex items-baseline gap-1 px-3 py-1.5 rounded-lg bg-muted/60">
                <span className="text-2xl font-bold text-primary">{start.engagement}%</span>
                <span className="text-xs text-muted-foreground">engagement rate</span>
              </div>
            </div>
          }
        >
          <p>
            You had {start.followers.toLocaleString()} followers and a {start.engagement}% engagement rate. Solid
            foundation — but the real story starts next.
          </p>
          <SceneCallout
            kpi={`Baseline: ${start.followers.toLocaleString()} followers · ${start.engagement}% ER`}
            formula="baseline = followers[0], engagement_rate[0]"
            insight="This is the anchor every later delta is measured against."
          />
        </Scene>

        <Scene
          index={2}
          eyebrow="Chapter 2"
          title="The turning point"
          icon={Sparkles}
          chart={
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={followerData}>
                  <defs>
                    <linearGradient id="storyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(v) => `${v / 1000}k`}
                  />
                  <Tooltip content={<StoryTooltip kpi="Followers" unit="" data={followerData} dataKey="followers" />} />

                  <Area
                    type="monotone"
                    dataKey="followers"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#storyGrad)"
                  />
                  <ReferenceDot
                    x={jumpPoint.month}
                    y={jumpPoint.followers}
                    r={7}
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--background))"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          }
        >
          <p>
            In <span className="text-foreground font-semibold">{jumpPoint.month}</span> you gained{" "}
            <span className="text-primary font-semibold">+{jump.delta.toLocaleString()}</span> followers in a
            single month — your biggest jump.
          </p>
          <p>Whatever you did that month, do more of it.</p>
          <SceneCallout
            kpi={`Biggest MoM delta: +${jump.delta.toLocaleString()} · ${jumpPoint.month}`}
            formula="delta[m] = followers[m] − followers[m−1]"
            insight="Peak month growth points to which content or campaign compounded fastest."
          />
        </Scene>

        <Scene
          index={3}
          eyebrow="Chapter 3"
          title="Engagement compounds"
          icon={TrendingUp}
          chart={
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={followerData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<StoryTooltip kpi="Engagement rate" unit="%" data={followerData} dataKey="engagement" />} />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive
                    animationDuration={1200}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          }
        >
          <p>
            Engagement climbed from{" "}
            <span className="text-foreground font-semibold">{start.engagement}%</span> to{" "}
            <span className="text-primary font-semibold">{now.engagement}%</span> — a{" "}
            {Math.round(((now.engagement - start.engagement) / start.engagement) * 100)}% lift.
          </p>
          <p>Bigger audience and a more engaged one. That's the compounding effect.</p>
          <SceneCallout
            kpi={`Engagement lift: +${(now.engagement - start.engagement).toFixed(1)} pts`}
            formula="lift = (er[now] − er[start]) / er[start]"
            insight="Follower growth without engagement lift means noise. Both climbed together."
          />
        </Scene>

        <Scene
          index={4}
          eyebrow="Chapter 4"
          title="Where you're headed"
          icon={Rocket}
          chart={
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projected}>
                  <defs>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(v) => `${v / 1000}k`}
                  />
                  <Tooltip content={<StoryTooltip kpi="Followers (projected)" unit="" data={projected as unknown as Array<Record<string, number | string | null>>} dataKey="followers" />} />
                  <Area
                    type="monotone"
                    dataKey="followers"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#projGrad)"
                  />
                  <Line
                    type="monotone"
                    dataKey="projected"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          }
        >
          <p>
            You're at <span className="text-foreground font-semibold">{now.followers.toLocaleString()}</span>{" "}
            followers, up{" "}
            <span className="text-primary font-semibold">{growthPct}%</span> from where you started.
          </p>
          <p>
            At the current pace, you're on track for{" "}
            <span className="text-primary font-semibold">
              {(projected[projected.length - 1].projected ?? 0).toLocaleString()}
            </span>{" "}
            followers in the next 6 months.
          </p>
          <SceneCallout
            kpi={`Projected 6-month: ${(projected[projected.length - 1].projected ?? 0).toLocaleString()}`}
            formula="projected[m] = last + avg_monthly_growth × m"
            insight="Straight-line projection from your observed growth. Any campaign lift compounds on top."
          />
        </Scene>
      </div>
    </div>
  );
}
