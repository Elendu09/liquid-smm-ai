import { BarChart3, Eye, Heart, TrendingUp, MessageSquare, Percent } from "lucide-react";
import { METRIC_LABEL, type MetricId } from "@/hooks/useCustomReports";
import { cn } from "@/lib/utils";

const ICON: Record<MetricId, typeof Eye> = {
  impressions: Eye,
  reach: TrendingUp,
  engagement: Heart,
  followers: BarChart3,
  replies: MessageSquare,
  ctr: Percent,
};

const METRICS = Object.keys(METRIC_LABEL) as MetricId[];

export function MetricPalette({ onAdd }: { onAdd: (metric: MetricId) => void }) {
  return (
    <aside className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-2">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Metrics
      </h3>
      <div className="space-y-1.5">
        {METRICS.map((m) => {
          const Icon = ICON[m];
          return (
            <button
              key={m}
              onClick={() => onAdd(m)}
              className={cn(
                "w-full flex items-center gap-2 rounded-lg border border-border/50 bg-background/40",
                "px-2.5 py-1.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/[0.05]",
                "group"
              )}
              title={`Add ${METRIC_LABEL[m]} chart`}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-muted/60 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <span className="text-xs font-medium flex-1">{METRIC_LABEL[m]}</span>
              <span className="text-[10px] text-muted-foreground/60 group-hover:text-primary">+ add</span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground/70 pt-1 border-t border-border/40">
        Click a metric to drop it onto the canvas.
      </p>
    </aside>
  );
}
