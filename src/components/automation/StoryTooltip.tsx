import type { TooltipProps } from "recharts";

interface StoryTooltipProps extends TooltipProps<number, string> {
  kpi: string;
  unit?: string;
  data: Array<Record<string, number | string | null>>;
  dataKey: string;
}

export function StoryTooltip({ active, payload, label, kpi, unit = "", data, dataKey }: StoryTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const raw = payload[0]?.value;
  const value = typeof raw === "number" ? raw : Number(raw);
  if (Number.isNaN(value)) return null;

  const idx = data.findIndex((d) => d.month === label);
  const prev = idx > 0 ? Number(data[idx - 1]?.[dataKey] ?? NaN) : NaN;
  const delta = Number.isNaN(prev) ? null : value - prev;
  const pct = delta !== null && prev > 0 ? (delta / prev) * 100 : null;

  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-md p-3 shadow-xl text-xs min-w-[180px]">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{kpi}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-lg font-bold text-foreground tabular-nums">
          {value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        </span>
        <span className="text-[11px] text-muted-foreground">{unit}</span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      {delta !== null && (
        <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">vs prior</span>
          <span
            className={
              delta > 0
                ? "text-emerald-500 font-semibold tabular-nums"
                : delta < 0
                  ? "text-destructive font-semibold tabular-nums"
                  : "text-muted-foreground tabular-nums"
            }
          >
            {delta > 0 ? "+" : ""}
            {delta.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            {unit}
            {pct !== null && (
              <span className="text-[10px] font-normal ml-1 opacity-70">
                ({pct > 0 ? "+" : ""}
                {pct.toFixed(1)}%)
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

export function SceneCallout({
  kpi,
  formula,
  insight,
}: {
  kpi: string;
  formula: string;
  insight: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide font-semibold text-primary">KPI</span>
        <span className="text-sm font-semibold text-foreground">{kpi}</span>
      </div>
      <p className="text-[11px] font-mono text-muted-foreground">{formula}</p>
      <p className="text-xs text-muted-foreground">{insight}</p>
    </div>
  );
}
