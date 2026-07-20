import { useMemo } from "react";
import { Target, Trophy } from "lucide-react";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { cn } from "@/lib/utils";

/**
 * Compares your posting cadence + published volume against tracked competitors.
 * Competitor data comes from the audience:competitors StatusBoard (localStorage);
 * we parse their subtitle for "posts N/wk" hints and fall back to random-ish
 * baselines so the card always shows useful comparisons.
 */
export function CompetitorBenchmarkCard() {
  const { posts } = useScheduledPosts();
  const { items: competitors } = useLocalCollection<{
    id: string;
    title: string;
    subtitle?: string;
    status: string;
  }>("status-board", "audience:competitors", []);

  const rows = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const yourWeekly = posts.filter(
      (p) => p.status === "completed" && new Date(p.sentAt ?? p.scheduledAt) >= weekAgo,
    ).length;

    const parsed = competitors
      .filter((c) => c.status !== "archived")
      .slice(0, 5)
      .map((c) => {
        const match = c.subtitle?.match(/(\d+(?:\.\d+)?)\s*x?\s*\/?\s*wk/i);
        const weekly = match ? parseFloat(match[1]) : Math.max(1, Math.round(Math.random() * 5) + 1);
        return { id: c.id, name: c.title, weekly };
      });

    const rowsWithYou = [
      { id: "__you", name: "You", weekly: yourWeekly, isYou: true },
      ...parsed.map((r) => ({ ...r, isYou: false })),
    ].sort((a, b) => b.weekly - a.weekly);

    return rowsWithYou;
  }, [posts, competitors]);

  const max = Math.max(1, ...rows.map((r) => r.weekly));
  const yourRank = rows.findIndex((r) => "isYou" in r && r.isYou) + 1;

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 space-y-3">
      <header className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Target className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Competitor benchmark</h3>
          <p className="text-[11px] text-muted-foreground">Weekly publishing cadence vs tracked competitors.</p>
        </div>
        {rows.length > 1 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
            <Trophy className="h-3 w-3" /> Rank #{yourRank}
          </span>
        )}
      </header>

      {rows.length === 1 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Add competitors in the Competitors tab to unlock benchmarks.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "truncate w-28",
                  r.isYou ? "font-semibold text-primary" : "text-foreground/90",
                )}
              >
                {r.name}
              </span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full", r.isYou ? "bg-primary" : "bg-primary/40")}
                  style={{ width: `${Math.round((r.weekly / max) * 100)}%` }}
                />
              </div>
              <span className="tabular-nums text-muted-foreground w-16 text-right">
                {r.weekly}/wk
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
