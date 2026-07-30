import { LineChart, BarChart3, AreaChart, Gauge } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  type ChartCardConfig,
  METRIC_LABEL,
  type MetricId,
  type VizType,
} from "@/hooks/useCustomReports";
import { useScopedAccounts } from "@/hooks/useScopedAccounts";
import { cn } from "@/lib/utils";

const VIZ_OPTIONS: { id: VizType; label: string; Icon: typeof LineChart }[] = [
  { id: "line", label: "Line", Icon: LineChart },
  { id: "bar", label: "Bar", Icon: BarChart3 },
  { id: "area", label: "Area", Icon: AreaChart },
  { id: "kpi", label: "KPI", Icon: Gauge },
];

const PRESET_COLORS = [
  "hsl(var(--primary))",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
];

export function ChartInspector({
  card,
  onChange,
}: {
  card: ChartCardConfig | null;
  onChange: (patch: Partial<ChartCardConfig>) => void;
}) {
  const { accounts } = useScopedAccounts();

  if (!card) {
    return (
      <aside className="rounded-xl border border-dashed border-border/60 bg-card/40 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Select a chart card to edit its metric, visualisation, and comparison.
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Inspector
      </h3>

      <div>
        <Label className="text-[10px]">Name</Label>
        <Input
          className="h-8 text-xs"
          value={card.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={METRIC_LABEL[card.metric]}
        />
      </div>

      <div>
        <Label className="text-[10px]">Metric</Label>
        <select
          value={card.metric}
          onChange={(e) => onChange({ metric: e.target.value as MetricId })}
          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
        >
          {(Object.keys(METRIC_LABEL) as MetricId[]).map((m) => (
            <option key={m} value={m}>{METRIC_LABEL[m]}</option>
          ))}
        </select>
      </div>

      <div>
        <Label className="text-[10px]">Visualisation</Label>
        <div className="grid grid-cols-4 gap-1 mt-1">
          {VIZ_OPTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onChange({ viz: id })}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 rounded-md border text-[9px] transition-colors",
                card.viz === id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 hover:bg-muted text-muted-foreground",
              )}
              title={label}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-[10px]">Platform filter</Label>
        <select
          value={card.platformId ?? ""}
          onChange={(e) => onChange({ platformId: e.target.value || undefined })}
          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value="">All platforms</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.platformId}>{a.displayName || a.platformId}</option>
          ))}
        </select>
      </div>

      <div>
        <Label className="text-[10px]">Colour</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ color: c })}
              style={{ background: c }}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform",
                card.color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105",
              )}
              aria-label={`Colour ${c}`}
            />
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-border/40">
        <span>Compare vs previous period</span>
        <Switch
          checked={!!card.compare}
          onCheckedChange={(v) => onChange({ compare: v })}
        />
      </label>
    </aside>
  );
}
