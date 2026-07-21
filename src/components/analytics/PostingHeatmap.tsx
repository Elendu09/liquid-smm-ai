import { Fragment, useMemo } from "react";
import { Clock } from "lucide-react";
import { useGuest } from "@/hooks/useGuest";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function PostingHeatmap() {
  const { isGuest } = useGuest();
  const { posts } = useScheduledPosts();

  const grid = useMemo(() => {
    if (isGuest) {
      return DAYS.map((_d, di) =>
        HOURS.map((h) => {
          const seed = (di + 1) * 31 + (h + 1) * 7;
          const base = Math.sin(seed) * 0.5 + Math.cos(seed / 3) * 0.5 + 1;
          const boost = (h >= 17 && h <= 21 ? 0.4 : 0) + (di >= 5 ? 0.2 : 0);
          return Math.max(0, Math.min(1, base * 0.4 + boost + 0.1));
        }),
      );
    }
    // Real: count completed posts by weekday × hour, normalise to 0..1.
    const raw: number[][] = DAYS.map(() => HOURS.map(() => 0));
    for (const p of posts) {
      if (p.status !== "completed") continue;
      const dt = new Date(p.sentAt ?? p.scheduledAt);
      // JS: 0=Sun, 1=Mon..; convert to Mon-first index.
      const jsDow = dt.getDay();
      const di = jsDow === 0 ? 6 : jsDow - 1;
      raw[di][dt.getHours()] += 1;
    }
    const max = Math.max(1, ...raw.flat());
    return raw.map((row) => row.map((v) => v / max));
  }, [isGuest, posts]);

  const hasData = grid.some((row) => row.some((v) => v > 0));

  const best = useMemo(() => {
    let top = { d: 0, h: 0, v: 0 };
    grid.forEach((row, d) =>
      row.forEach((v, h) => {
        if (v > top.v) top = { d, h, v };
      }),
    );
    return top;
  }, [grid]);

  if (!isGuest && !hasData) {
    return (
      <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
        <header className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Best times to post</h3>
        </header>
        <EmptyState
          icon={Clock}
          title="No posting history yet"
          description="Publish a few posts and this heatmap will surface the weekday × hour slots that perform best."
          ctaLabel="Schedule a post"
          ctaHref="/dashboard/publish/calendar"
          compact
        />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
      <header className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Best times to post
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Peak: <span className="text-primary font-medium">{DAYS[best.d]} · {best.h}:00</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Low</span>
          <div className="flex gap-0.5">
            {[0.15, 0.35, 0.55, 0.75, 0.95].map((v, i) => (
              <span key={i} className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: `hsl(var(--primary) / ${v})` }} />
            ))}
          </div>
          <span>High</span>
        </div>
      </header>
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="min-w-[520px]">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: "32px repeat(24, minmax(0, 1fr))" }}>
            <div />
            {HOURS.map((h) => (
              <div key={h} className="text-[9px] text-muted-foreground text-center tabular-nums">
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
            {DAYS.map((d, di) => (
              <Fragment key={d}>
                <div className="text-[10px] text-muted-foreground pr-1 flex items-center">{d}</div>
                {HOURS.map((h) => {
                  const v = grid[di][h];
                  const isBest = di === best.d && h === best.h;
                  return (
                    <div
                      key={`${d}-${h}`}
                      title={`${d} ${h}:00 · ${(v * 100).toFixed(0)}%`}
                      className={cn(
                        "aspect-square rounded-sm transition-transform hover:scale-125",
                        isBest && "ring-1 ring-primary ring-offset-1 ring-offset-background",
                      )}
                      style={{ backgroundColor: `hsl(var(--primary) / ${0.08 + v * 0.85})` }}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
