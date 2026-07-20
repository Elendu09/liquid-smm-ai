import { useMemo } from "react";
import { Sparkles, Clock } from "lucide-react";
import { useBestTimes } from "@/hooks/useBestTimes";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * ML-style best-time-to-post insights.
 * Blends observed send history with baseline defaults to score every
 * weekday × hour slot on a 0–100 scale.
 */
export function BestTimeInsightsCard() {
  const { byDow, topHoursFor } = useBestTimes();
  const { posts } = useScheduledPosts();

  const scoreGrid = useMemo(() => {
    // Build a 7x24 score grid: count of completed posts + baseline weight.
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const p of posts) {
      if (p.status !== "completed") continue;
      const dt = new Date(p.sentAt ?? p.scheduledAt);
      grid[dt.getDay()][dt.getHours()] += 1;
    }
    // Overlay best hours from useBestTimes with a floor weight.
    for (let d = 0; d < 7; d++) {
      const hours = byDow[d] ?? [];
      hours.forEach((h, i) => {
        grid[d][h] += 3 - i; // 3, 2, 1 falloff
      });
    }
    const max = Math.max(1, ...grid.flat());
    return grid.map((row) => row.map((v) => Math.round((v / max) * 100)));
  }, [posts, byDow]);

  const topSlots = useMemo(() => {
    const slots: { dow: number; hour: number; score: number }[] = [];
    scoreGrid.forEach((row, d) =>
      row.forEach((score, h) => {
        if (score > 0) slots.push({ dow: d, hour: h, score });
      }),
    );
    return slots.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [scoreGrid]);

  const fmtHour = (h: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:00 ${period}`;
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 space-y-4">
      <header className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Best times to post</h3>
          <p className="text-[11px] text-muted-foreground">Blends your send history with baseline engagement patterns.</p>
        </div>
      </header>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-grid grid-cols-[auto_repeat(24,1fr)] gap-0.5 text-[9px] text-muted-foreground">
          <div />
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="text-center tabular-nums">
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
          {DAYS.map((d, dow) => (
            <>
              <div key={`l-${dow}`} className="pr-1 text-right self-center">{d}</div>
              {Array.from({ length: 24 }).map((_, h) => {
                const score = scoreGrid[dow][h];
                return (
                  <div
                    key={`c-${dow}-${h}`}
                    className={cn(
                      "h-5 rounded-sm border border-border/30",
                      score === 0
                        ? "bg-muted/40"
                        : score < 25
                          ? "bg-primary/15"
                          : score < 60
                            ? "bg-primary/40"
                            : "bg-primary/80",
                    )}
                    title={`${d} ${fmtHour(h)} · score ${score}`}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Top slots list */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Top recommended slots</p>
        {topSlots.length === 0 ? (
          <p className="text-xs text-muted-foreground">Publish more posts to unlock personalised insights.</p>
        ) : (
          topSlots.map((s) => (
            <div key={`${s.dow}-${s.hour}`} className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3 text-primary" />
              <span className="font-medium w-24">{DAYS[s.dow]} · {fmtHour(s.hour)}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${s.score}%` }} />
              </div>
              <span className="tabular-nums text-muted-foreground w-8 text-right">{s.score}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
