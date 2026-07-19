import { RefreshCw, Sparkles, TrendingUp, AlertTriangle, Activity, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomeSummary } from "@/hooks/useHomeSummary";
import { cn } from "@/lib/utils";

const PULSE_STYLES = {
  positive: {
    bar: "bg-emerald-500",
    label: "Positive pulse",
    icon: TrendingUp,
    tint: "text-emerald-400",
  },
  mixed: {
    bar: "bg-amber-500",
    label: "Mixed pulse",
    icon: Activity,
    tint: "text-amber-400",
  },
  attention: {
    bar: "bg-rose-500",
    label: "Needs attention",
    icon: AlertTriangle,
    tint: "text-rose-400",
  },
} as const;

export function HomeSummaryCard() {
  const { summary, loading, error, refresh } = useHomeSummary();
  const pulse = summary ? PULSE_STYLES[summary.pulse] : PULSE_STYLES.positive;
  const PulseIcon = pulse.icon;

  return (
    <section
      aria-label="AI daily brief"
      className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] via-card to-card backdrop-blur-sm"
    >
      <div className={cn("absolute left-0 top-0 h-full w-1", pulse.bar)} />
      <div className="p-4 sm:p-5 pl-5 sm:pl-6">
        <header className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                Your daily brief
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <PulseIcon className={cn("h-3 w-3", pulse.tint)} strokeWidth={2} />
                <span className={pulse.tint}>{pulse.label}</span>
                {summary && (
                  <span className="text-muted-foreground/70">
                    · updated {formatDistanceToNow(new Date(summary.generatedAt), { addSuffix: true })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 shrink-0"
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh summary"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </header>

        {loading && !summary ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ) : error && !summary ? (
          <p className="text-sm text-muted-foreground">
            Couldn't build the brief right now.{" "}
            <button className="text-primary hover:underline" onClick={refresh}>
              Try again
            </button>
          </p>
        ) : summary ? (
          <div className="space-y-3">
            <h2 className="font-serif text-lg sm:text-xl leading-snug text-foreground">
              {summary.headline}
            </h2>
            {summary.highlights.length > 0 && (
              <ul className="space-y-1.5">
                {summary.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            )}
            {summary.nextAction && (
              <div className="flex items-center gap-2 pt-1 mt-1 border-t border-border/40">
                <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" strokeWidth={2} />
                <span className="text-xs font-medium text-foreground">Next:</span>
                <span className="text-xs text-muted-foreground">{summary.nextAction}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Connect an account to see your first AI-written daily brief here.
          </p>
        )}
      </div>
    </section>
  );
}
