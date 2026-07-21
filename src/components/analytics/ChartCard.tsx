import { useMemo } from "react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { X, GripVertical, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type ChartCardConfig,
  METRIC_LABEL,
  METRIC_UNIT,
  RANGE_DAYS,
  type RangeKey,
} from "@/hooks/useCustomReports";
import { useCardSeries } from "@/hooks/useAnalyticsSeries";
import { cn } from "@/lib/utils";

export function ChartCard({
  card,
  range,
  seedBase: _seedBase,
  selected,
  onSelect,
  onRemove,
}: {
  card: ChartCardConfig;
  range: RangeKey;
  seedBase: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const days = RANGE_DAYS[range];
  const { series: data, isDemo, loading } = useCardSeries(card.metric, days, card.platformId);
  const compareDays = days;
  const { series: compareRaw } = useCardSeries(card.metric, compareDays * 2, card.platformId);
  const compareData = useMemo(() => {
    if (!card.compare) return null;
    // Prior period = the first half of a double-length window.
    return compareRaw.slice(0, days).map((p, i) => ({ ...p, date: data[i]?.date ?? p.date }));
  }, [card.compare, compareRaw, days, data]);

  const total = data.reduce((s, d) => s + d.value, 0);
  const avg = data.length ? total / data.length : 0;
  const last = data[data.length - 1]?.value ?? 0;
  const first = data[0]?.value ?? 0;
  const delta = first ? ((last - first) / first) * 100 : 0;
  const unit = METRIC_UNIT[card.metric];
  const color = card.color || "hsl(var(--primary))";

  const merged = compareData
    ? data.map((d, i) => ({ ...d, prev: compareData[i]?.value ?? 0 }))
    : data;

  return (
    <article
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl border bg-card/70 backdrop-blur-sm transition-all cursor-pointer",
        selected ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary))]" : "border-border/60 hover:border-border",
      )}
    >
      <header className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-semibold truncate">{card.name || METRIC_LABEL[card.metric]}</h4>
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground/70">{card.viz}</span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {METRIC_LABEL[card.metric]}
            {card.platformId ? ` · ${card.platformId}` : ""}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="Remove card"
        >
          <X className="h-3 w-3" />
        </Button>
      </header>

      <div className="px-3 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tabular-nums">
            {card.viz === "kpi"
              ? formatValue(last, unit)
              : formatValue(card.metric === "engagement" || card.metric === "ctr" ? avg : total, unit)}
          </span>
          {card.compare && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums",
                delta >= 0 ? "text-emerald-500" : "text-rose-500",
              )}
            >
              {delta >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
            </span>
          )}
        </div>

        {card.viz !== "kpi" && (
          <div className="h-24 -mx-1 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              {card.viz === "line" ? (
                <LineChart data={merged} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border) / 0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontSize: 10 }} />
                  {card.compare && <Line type="monotone" dataKey="prev" stroke="hsl(var(--muted-foreground))" strokeWidth={1} dot={false} strokeDasharray="3 3" />}
                  <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
                </LineChart>
              ) : card.viz === "bar" ? (
                <BarChart data={merged} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border) / 0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontSize: 10 }} />
                  <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={merged} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`fill-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border) / 0.4)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#fill-${card.id})`} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {card.viz === "kpi" && (
          <p className="text-[10px] text-muted-foreground mt-1">
            avg {formatValue(avg, unit)} over last {days} days
          </p>
        )}
      </div>
    </article>
  );
}

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 11,
  padding: "4px 8px",
};

function formatValue(v: number, unit: string): string {
  if (unit === "%") return `${v.toFixed(1)}%`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}
