import { useMemo } from "react";
import { Hash, TrendingUp, TrendingDown } from "lucide-react";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { cn } from "@/lib/utils";

/**
 * Aggregates hashtag usage across scheduled + completed posts and
 * derives a lightweight performance score:
 *   score = uses × 10  +  completedShare × 40  +  freshnessBonus
 * Freshness = penalises tags whose last use is >30d old.
 */
export function HashtagPerformanceCard() {
  const { posts } = useScheduledPosts();

  const stats = useMemo(() => {
    const map = new Map<string, { uses: number; completed: number; lastUsed: number }>();
    const captionTagRe = /#([\p{L}\p{N}_]+)/gu;

    for (const p of posts) {
      const set = new Set<string>();
      (p.hashtags ?? []).forEach((h) => set.add(h.replace(/^#/, "").toLowerCase()));
      const captionMatches = p.caption?.matchAll(captionTagRe);
      if (captionMatches) for (const m of captionMatches) set.add(m[1].toLowerCase());

      const t = new Date(p.scheduledAt).getTime();
      const isCompleted = p.status === "completed";
      for (const tag of set) {
        const prev = map.get(tag) ?? { uses: 0, completed: 0, lastUsed: 0 };
        map.set(tag, {
          uses: prev.uses + 1,
          completed: prev.completed + (isCompleted ? 1 : 0),
          lastUsed: Math.max(prev.lastUsed, t),
        });
      }
    }

    const now = Date.now();
    return Array.from(map.entries())
      .map(([tag, v]) => {
        const completedShare = v.uses > 0 ? v.completed / v.uses : 0;
        const ageDays = (now - v.lastUsed) / (1000 * 60 * 60 * 24);
        const freshness = Math.max(0, 20 - ageDays * 0.5);
        const score = Math.round(v.uses * 10 + completedShare * 40 + freshness);
        return { tag, ...v, score, ageDays };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [posts]);

  const maxScore = stats[0]?.score ?? 1;

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 space-y-3">
      <header className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Hash className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Hashtag performance</h3>
          <p className="text-[11px] text-muted-foreground">Ranked by usage, send success rate, and freshness.</p>
        </div>
      </header>

      {stats.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          No hashtags detected yet. Add them to captions or the hashtag field to see performance.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {stats.map((s) => {
            const trendingUp = s.ageDays < 14 && s.uses >= 2;
            return (
              <li key={s.tag} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-foreground/90 truncate w-32">#{s.tag}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full", trendingUp ? "bg-emerald-500" : "bg-primary")}
                    style={{ width: `${Math.round((s.score / maxScore) * 100)}%` }}
                  />
                </div>
                <span className="tabular-nums text-muted-foreground w-10 text-right">{s.uses}×</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 tabular-nums w-10 justify-end",
                    trendingUp ? "text-emerald-500" : "text-muted-foreground",
                  )}
                >
                  {trendingUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {s.score}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
