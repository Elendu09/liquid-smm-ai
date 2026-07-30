import { useMemo } from "react";
import { Target, Trophy } from "lucide-react";
import { useScopedAccounts } from "@/hooks/useScopedAccounts";
import { useCompetitors } from "@/hooks/useCompetitors";
import { buildBenchmarks } from "@/lib/benchmarks";
import { cn } from "@/lib/utils";

/**
 * Compact benchmark card: your strongest channel versus tracked competitors on a
 * blended reach + engagement score. Data is real (competitors table + connected
 * channels) — no localStorage mocks.
 */
export function CompetitorBenchmarkCard() {
  const { accounts } = useScopedAccounts();
  const { items: competitors } = useCompetitors();

  const summary = useMemo(
    () => buildBenchmarks(accounts, competitors, "all"),
    [accounts, competitors],
  );

  const rows = summary.rows.slice(0, 6);
  const max = Math.max(1, ...rows.map((r) => r.score));

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 space-y-3">
      <header className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Target className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Competitor benchmark</h3>
          <p className="text-[11px] text-muted-foreground">
            Blended reach + engagement score vs tracked competitors.
          </p>
        </div>
        {summary.yourRank > 0 && rows.length > 1 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
            <Trophy className="h-3 w-3" /> Rank #{summary.yourRank}
          </span>
        )}
      </header>

      {rows.length <= 1 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Add competitors in Audience → Competitors to unlock benchmarks.
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
                {r.label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full", r.isYou ? "bg-primary" : "bg-primary/40")}
                  style={{ width: `${Math.round((r.score / max) * 100)}%` }}
                />
              </div>
              <span className="tabular-nums text-muted-foreground w-20 text-right">
                {r.engagement.toFixed(1)}% · {r.score}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
