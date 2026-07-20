import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ArrowRight, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboardingScore } from "@/hooks/useOnboardingScore";
import { cn } from "@/lib/utils";

/**
 * Buffer-style setup score surfaced on the dashboard home. Gives users a
 * single 0–100 metric of workspace readiness plus the next best action.
 */
export function OnboardingScoreCard() {
  const { items, score, nextUp } = useOnboardingScore();
  if (score === 100) return null;

  const tone =
    score >= 75 ? "text-brand-green" : score >= 40 ? "text-brand-orange" : "text-primary";

  return (
    <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center", tone)}>
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Setup score</p>
            <h3 className="text-lg font-semibold leading-tight">
              <span className={tone}>{score}</span>
              <span className="text-muted-foreground text-sm font-normal"> / 100</span>
            </h3>
          </div>
        </div>
        {nextUp?.href && (
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link to={nextUp.href}>
              Next: {nextUp.label} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
        )}
      </div>

      <Progress value={score} className="h-2" />

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
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
    </section>
  );
}
