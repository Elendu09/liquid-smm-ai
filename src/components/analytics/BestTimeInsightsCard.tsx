import { Sparkles, Clock, TrendingUp } from "lucide-react";
import { useBestTimeScoring } from "@/hooks/useBestTimeScoring";
import { useGuest } from "@/hooks/useGuest";
import { cn } from "@/lib/utils";
import { WhyThisRecommendation } from "@/components/analytics/WhyThisRecommendation";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * ML-lite best-time-to-post insights. Blends real engagement data from
 * post_metrics with baseline defaults; every slot flags whether the score
 * came from observed posts ("learned") or baseline research.
 */
export function BestTimeInsightsCard() {
  const { isGuest } = useGuest();
  const { grid, topSlots, meta, hasRealData, loading } = useBestTimeScoring(90);

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
          <p className="text-[11px] text-muted-foreground">
            {isGuest
              ? "Demo signal — sign in to unlock learned recommendations."
              : hasRealData
                ? "Learned from your real post engagement, filled in with baseline research."
                : loading
                  ? "Loading scoring…"
                  : "Baseline research shown — scores will refine as posts collect metrics."}
          </p>
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
            <div key={`row-${dow}`} className="contents">
              <div className="pr-1 text-right self-center">{d}</div>
              {Array.from({ length: 24 }).map((_, h) => {
                const score = grid[dow][h];
                const info = meta[dow][h];
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
                      info.source === "baseline" && "border-dashed",
                    )}
                    title={`${d} ${fmtHour(h)} · score ${score}${info.samples ? ` · ${info.samples} posts · ${info.avgEngagement}% ER` : " · baseline"}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Solid = learned from your posts · dashed = baseline pattern.
        </p>
      </div>

      {/* Top slots list */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Top recommended slots</p>
          <WhyThisRecommendation
            variant="inline"
            reasons={
              hasRealData
                ? [
                    "Scores blend your observed post engagement (last 90 days) with baseline research.",
                    "Learned slots use real samples; baseline slots use platform-level research.",
                    "Higher engagement rate and more samples increase confidence.",
                  ]
                : [
                    "Baseline research from platform publishing studies — no personal posts yet.",
                    "Scores will refine as your posts collect engagement.",
                    "Post at these times first to teach the model fastest.",
                  ]
            }
            confidence={hasRealData ? Math.min(95, 40 + topSlots.reduce((a, s) => a + (s.samples ?? 0), 0) * 2) : 45}
          />
        </div>
        {topSlots.length === 0 ? (
          <p className="text-xs text-muted-foreground">Publish more posts to unlock personalised insights.</p>
        ) : (
          topSlots.slice(0, 5).map((s) => (
            <div key={`${s.dow}-${s.hour}`} className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3 text-primary" />
              <span className="font-medium w-24">{DAYS[s.dow]} · {fmtHour(s.hour)}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${s.score}%` }} />
              </div>
              <span className="tabular-nums text-muted-foreground w-8 text-right">{s.score}</span>
              {s.source === "learned" ? (
                <span className="text-[10px] text-emerald-500 inline-flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />
                  {s.samples}p
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground/70 w-10 text-right">baseline</span>
              )}
              <WhyThisRecommendation
                variant="icon"
                reasons={
                  s.source === "learned"
                    ? [
                        `Learned from ${s.samples} post${(s.samples ?? 0) !== 1 ? "s" : ""} in this slot — ${s.avgEngagement ?? 0}% avg ER.`,
                        "More samples in this slot will raise confidence.",
                      ]
                    : [
                        "Baseline pattern — no observed posts yet in this slot.",
                        "Publish here to start collecting learned data.",
                      ]
                }
                confidence={s.source === "learned" ? Math.min(90, 50 + (s.samples ?? 0) * 8) : 35}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
