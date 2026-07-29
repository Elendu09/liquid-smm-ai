import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { Users, MessageSquare, X, ArrowUpRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useAnalyticsSeries } from "@/hooks/useAnalyticsSeries";
import { useInboxMessages } from "@/hooks/useInboxMessages";
import { cn } from "@/lib/utils";

interface Props {
  onClose: () => void;
  onOpenInbox?: () => void;
}

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/**
 * Right-side insights rail for the calendar. Mirrors the reference layout:
 * a followers snapshot chart (top) + an unresolved conversations preview (bottom).
 */
export function CalendarInsightsPanel({ onClose, onOpenInbox }: Props) {
  const followers = useAnalyticsSeries("followers", "90D");
  const engagement = useAnalyticsSeries("engagement", "90D");
  const { items: comments } = useInboxMessages("comment");
  const { items: dms } = useInboxMessages("dm");

  const unresolved = useMemo(() => {
    return [...comments, ...dms]
      .filter((i) => i.status === "new" || i.status === "snoozed")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4);
  }, [comments, dms]);

  const chartData = useMemo(() => {
    return followers.series.slice(-12).map((p, i) => ({
      idx: i,
      followers: p.value,
      engagement: engagement.series[followers.series.length - 12 + i]?.value ?? 0,
    }));
  }, [followers.series, engagement.series]);

  const delta = followers.delta;
  const positive = delta >= 0;

  return (
    <aside className="hidden xl:flex flex-col w-[300px] shrink-0 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">Live insights</span>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-border/60 hover:bg-muted transition"
          aria-label="Close insights"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Followers snapshot */}
      <div className="p-4 border-b border-border/60 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Users className="h-3 w-3" /> Followers
            </div>
            <p className="text-2xl font-bold tabular-nums mt-0.5">{fmtCompact(followers.latest || 0)}</p>
            <p className={cn("text-[11px] font-medium mt-0.5", positive ? "text-emerald-500" : "text-rose-500")}>
              {positive ? "+" : ""}{fmtCompact(delta)} <span className="text-muted-foreground font-normal">last 90d</span>
            </p>
          </div>
        </div>
        <div className="h-24 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Tooltip
                cursor={{ stroke: "hsl(var(--primary))", strokeDasharray: "2 2" }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelFormatter={() => ""}
              />
              <Line type="monotone" dataKey="followers" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="engagement" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Followers</span>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> Engagement</span>
        </div>
      </div>

      {/* Unresolved conversations */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">Unresolved</span>
            {unresolved.length > 0 && (
              <span className="ml-1 h-4 min-w-4 px-1 inline-flex items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-semibold tabular-nums">
                {unresolved.length}
              </span>
            )}
          </div>
          {onOpenInbox && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={onOpenInbox}>
              Open <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
          {unresolved.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-muted-foreground">
              All caught up
            </div>
          ) : (
            unresolved.map((m) => (
              <button
                key={m.id}
                onClick={onOpenInbox}
                className="w-full text-left flex items-start gap-2.5 rounded-xl border border-border/50 bg-background/60 hover:bg-muted/40 hover:border-primary/40 p-2.5 transition-all"
              >
                <div className="relative shrink-0">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {(m.author || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-card">
                    <PlatformIcon platform={m.platform} size="xs" showBackground />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{m.author || "Unknown"}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug mt-0.5">
                    {m.message}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
