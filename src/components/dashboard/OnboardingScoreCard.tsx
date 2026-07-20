import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ArrowRight, Gauge, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboardingScore } from "@/hooks/useOnboardingScore";
import { cn } from "@/lib/utils";

/**
 * Buffer-style setup score surfaced on the dashboard home. Gives users a
 * single 0–100 metric of workspace readiness plus the next best actions —
 * a "what's next" queue that highlights the top 3 unfinished items with
 * point rewards so users know exactly what to do next.
 */
export function OnboardingScoreCard() {
  const { items, score, earned, total } = useOnboardingScore();
  if (score === 100) return null;

  const pending = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);
  const nextThree = pending.slice(0, 3);

  const tone =
    score >= 75 ? "text-brand-green" : score >= 40 ? "text-brand-orange" : "text-primary";
  const toneBg =
    score >= 75 ? "bg-brand-green/10" : score >= 40 ? "bg-brand-orange/10" : "bg-primary/10";
  const stage =
    score >= 90 ? "Almost there" : score >= 60 ? "Great progress" : score >= 30 ? "Getting started" : "Just beginning";

  return (
    <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-3 sm:p-6 space-y-3 sm:space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", toneBg, tone)}>
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Setup score · {stage}</p>
            <h3 className="text-lg font-semibold leading-tight">
              <span className={tone}>{score}</span>
              <span className="text-muted-foreground text-sm font-normal"> / 100</span>
              <span className="text-muted-foreground text-xs font-normal ml-2">
                · {done.length}/{items.length} done
              </span>
            </h3>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[11px] text-muted-foreground">Points</p>
          <p className="text-sm font-semibold tabular-nums">
            {earned}<span className="text-muted-foreground font-normal">/{total}</span>
          </p>
        </div>

      </div>

      <Progress value={score} className="h-2 hidden sm:block" />

      {/* What's next — top 3 pending actions */}
      {nextThree.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> What's next
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {nextThree.map((i, idx) => {
              const body = (
                <div className="h-full rounded-xl border border-border/60 bg-background/40 hover:bg-background/70 hover:border-primary/40 p-3 transition-colors flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "h-6 w-6 rounded-full text-[11px] font-semibold flex items-center justify-center",
                      idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}>
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-semibold tabular-nums text-brand-green bg-brand-green/10 px-1.5 py-0.5 rounded-full">
                      +{i.points}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-snug flex-1">{i.label}</p>
                  {i.href && (
                    <div className="flex items-center gap-1 text-[11px] text-primary">
                      Do it <ArrowRight className="h-3 w-3" />
                    </div>
                  )}
                </div>
              );
              return i.href ? (
                <Link key={i.id} to={i.href} className="block">{body}</Link>
              ) : (
                <div key={i.id}>{body}</div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed collapse — small chips */}
      {done.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-[11px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5 select-none">
            <Trophy className="h-3 w-3" /> Completed ({done.length})
            <span className="group-open:hidden">· show</span>
            <span className="hidden group-open:inline">· hide</span>
          </summary>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {done.map((i) => (
              <li key={i.id} className="inline-flex items-center gap-1 text-[11px] rounded-full bg-brand-green/10 text-brand-green px-2 py-0.5">
                <CheckCircle2 className="h-3 w-3" /> {i.label}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Full checklist — collapsed by default */}
      <details>
        <summary className="cursor-pointer text-[11px] uppercase tracking-[0.18em] text-muted-foreground select-none">
          View full checklist
        </summary>
        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {items.map((i) => {
            const row = (
              <>
                {i.done ? (
                  <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={cn("truncate", i.done && "line-through text-muted-foreground")}>{i.label}</span>
                <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">+{i.points}</span>
              </>
            );
            return (
              <li key={i.id} className="text-xs">
                {i.href && !i.done ? (
                  <Link to={i.href} className="flex items-center gap-2 py-1 hover:text-foreground text-foreground/80">
                    {row}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 py-1">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      </details>
    </section>
  );
}
