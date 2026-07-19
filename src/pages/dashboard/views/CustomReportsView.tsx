import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { LayoutDashboard } from "lucide-react";
import { toPng } from "html-to-image";
import { MetricPalette } from "@/components/analytics/MetricPalette";
import { ChartCard } from "@/components/analytics/ChartCard";
import { ChartInspector } from "@/components/analytics/ChartInspector";
import { ReportHeader } from "@/components/analytics/ReportHeader";
import {
  useCustomReports,
  type MetricId,
  type ChartCardConfig,
  type RangeKey,
  METRIC_LABEL,
} from "@/hooks/useCustomReports";
import { useAccounts } from "@/contexts/AccountContext";

export default function CustomReportsView() {
  const { reports, add, update, remove, duplicate, upsertCard, removeCard } = useCustomReports();
  const { accounts } = useAccounts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeId, setActiveId] = useState<string | null>(() => {
    const fromUrl = searchParams.get("report");
    return fromUrl || reports[0]?.id || null;
  });
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Keep URL in sync with active report + range for shareable links.
  const active = reports.find((r) => r.id === activeId) ?? reports[0] ?? null;
  useEffect(() => {
    if (!active) return;
    const next = new URLSearchParams(searchParams);
    next.set("report", active.id);
    next.set("range", active.range);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.range]);

  // Read range from URL on load if it differs.
  useEffect(() => {
    const urlRange = searchParams.get("range") as RangeKey | null;
    if (active && urlRange && urlRange !== active.range) {
      update(active.id, { range: urlRange });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seedBase = useMemo(() => {
    const total = accounts.reduce((s, a) => s + a.followers, 0);
    return Math.max(1000, total || 4200);
  }, [accounts]);

  const selectedCard = active?.cards.find((c) => c.id === selectedCardId) ?? null;

  const handleAddMetric = (metric: MetricId) => {
    if (!active) return;
    const card: ChartCardConfig = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: METRIC_LABEL[metric],
      metric,
      viz: metric === "followers" ? "kpi" : "line",
      color: "hsl(var(--primary))",
      compare: metric !== "followers",
    };
    upsertCard(active.id, card);
    setSelectedCardId(card.id);
  };

  const handleCreate = (name: string) => {
    const r = add(name);
    setActiveId(r.id);
    setSelectedCardId(null);
    toast.success(`Report "${name}" created`);
  };

  const handleDuplicate = () => {
    if (!active) return;
    const copy = duplicate(active.id);
    if (copy) {
      setActiveId(copy.id);
      toast.success(`Duplicated as "${copy.name}"`);
    }
  };

  const handleDelete = () => {
    if (!active || reports.length <= 1) return;
    const name = active.name;
    remove(active.id);
    const fallback = reports.find((r) => r.id !== active.id);
    setActiveId(fallback?.id ?? null);
    setSelectedCardId(null);
    toast.success(`Deleted "${name}"`);
  };

  const handleCopyLink = () => {
    if (!active) return;
    const url = new URL(window.location.href);
    url.searchParams.set("report", active.id);
    url.searchParams.set("range", active.range);
    navigator.clipboard.writeText(url.toString());
  };

  const handleExportPng = async () => {
    if (!canvasRef.current || !active) return;
    try {
      const dataUrl = await toPng(canvasRef.current, {
        backgroundColor: getComputedStyle(document.body).backgroundColor || "#0a0f1e",
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${active.name.replace(/\s+/g, "-").toLowerCase()}.png`;
      a.click();
      toast.success("PNG downloaded");
    } catch (e) {
      toast.error("PNG export failed");
      console.error(e);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      <ReportHeader
        reports={reports}
        activeId={active?.id ?? null}
        onSelect={(id) => { setActiveId(id); setSelectedCardId(null); }}
        onCreate={handleCreate}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onRename={(name) => active && update(active.id, { name })}
        onRangeChange={(r) => active && update(active.id, { range: r })}
        onCopyLink={handleCopyLink}
        onExportPng={handleExportPng}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_240px] gap-4">
        <MetricPalette onAdd={handleAddMetric} />

        <div
          ref={canvasRef}
          className="min-h-[380px] rounded-xl border border-dashed border-border/50 bg-card/20 p-3"
        >
          {!active || active.cards.length === 0 ? (
            <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center gap-2 py-10">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <LayoutDashboard className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <p className="text-sm font-medium">Empty canvas</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Pick a metric from the left rail to add your first chart. Every card can be resized, coloured, and compared to a previous period.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {active.cards.map((card) => (
                <ChartCard
                  key={card.id}
                  card={card}
                  range={active.range}
                  seedBase={seedBase}
                  selected={selectedCardId === card.id}
                  onSelect={() => setSelectedCardId(card.id)}
                  onRemove={() => {
                    removeCard(active.id, card.id);
                    if (selectedCardId === card.id) setSelectedCardId(null);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <ChartInspector
          card={selectedCard}
          onChange={(patch) => {
            if (!active || !selectedCard) return;
            upsertCard(active.id, { ...selectedCard, ...patch });
          }}
        />
      </div>
    </div>
  );
}
