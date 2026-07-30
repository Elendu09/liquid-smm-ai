import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { limitLabel } from "@/config/plans";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** Hide the plan name header row. */
  bare?: boolean;
}

/**
 * Live quota meters (posts, channels, credits, seats) for the active plan.
 * Reused by the dashboard header popover and Settings › Billing.
 */
export function QuotaMeters({ className, bare }: Props) {
  const { plan, meters, nextPlan } = usePlan();

  return (
    <div className={cn("space-y-3", className)}>
      {!bare && (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Current plan</p>
            <p className="font-['Instrument_Serif'] text-2xl leading-none tracking-tight">
              {plan.name}
            </p>
          </div>
          {nextPlan && (
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 h-8 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade
            </Link>
          )}
        </div>
      )}

      <ul className="space-y-2.5">
        {meters.map((m) => {
          const over = m.cap !== null && m.used >= m.cap;
          const near = !over && m.pct >= 80;
          return (
            <li key={m.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-muted-foreground">{m.label}</span>
                <span
                  className={cn(
                    "tabular-nums font-medium",
                    over && "text-destructive",
                    near && "text-amber-500",
                  )}
                >
                  {m.used.toLocaleString()} / {limitLabel(m.cap)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    over ? "bg-destructive" : near ? "bg-amber-500" : "bg-primary",
                  )}
                  style={{ width: `${m.cap === null ? 8 : Math.max(2, m.pct)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
