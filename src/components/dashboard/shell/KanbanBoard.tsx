import { ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";

export interface KanbanColumnDef<S extends string = string> {
  id: S;
  label: string;
  tint?: string; // tailwind class for a subtle accent, uses tokens
  /** Top stroke color class for the column header, e.g. "bg-primary". */
  stroke?: string;
  emptyLabel?: string;
}

/** Semantic stroke palette — maps status id to meaningful color. Failed must be red, not yellow. */
const SEMANTIC_STROKES: Record<string, string> = {
  // Queue / Publish
  queued: "bg-slate-500",
  scheduled: "bg-slate-500",
  sending: "bg-sky-500",
  completed: "bg-emerald-500",
  sent: "bg-emerald-500",
  failed: "bg-destructive",
  error: "bg-destructive",
  paused: "bg-amber-500",
  // Create / Captions / Drafts
  draft: "bg-slate-400",
  review: "bg-amber-500",
  "in review": "bg-amber-500",
  ready: "bg-sky-500",
  archived: "bg-zinc-400",
  published: "bg-emerald-500",
  // Inbox / Engage
  new: "bg-primary",
  replied: "bg-sky-500",
  snoozed: "bg-amber-500",
  resolved: "bg-emerald-500",
  pending: "bg-amber-500",
  approved: "bg-emerald-500",
  rejected: "bg-destructive",
};

/** Fallback palette when no semantic match (by index) */
const DEFAULT_STROKES = [
  "bg-primary",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-destructive",
  "bg-violet-500",
];

function resolveStroke(col: KanbanColumnDef<string>, index: number): string {
  if (col.stroke) return col.stroke;
  const key = col.id.toLowerCase().trim();
  if (SEMANTIC_STROKES[key]) return SEMANTIC_STROKES[key];
  // also try label
  const labelKey = col.label.toLowerCase().trim();
  if (SEMANTIC_STROKES[labelKey]) return SEMANTIC_STROKES[labelKey];
  return DEFAULT_STROKES[index % DEFAULT_STROKES.length];
}


interface KanbanBoardProps<T, S extends string> {
  columns: KanbanColumnDef<S>[];
  items: T[];
  getStatus: (item: T) => S;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  onMove?: (item: T, from: S, to: S) => void;
  className?: string;
}

export function KanbanBoard<T, S extends string>({
  columns,
  items,
  getStatus,
  getKey,
  renderItem,
  onMove,
  className,
}: KanbanBoardProps<T, S>) {
  const dragging = useRef<{ item: T; from: S } | null>(null);

  return (
    <div
      className={cn(
        "flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:mx-0 sm:px-0",
        className,
      )}
    >
      {columns.map((col, ci) => {
        const colItems = items.filter((i) => getStatus(i) === col.id);
        const stroke = resolveStroke(col as KanbanColumnDef<string>, ci);
        return (
          <section
            key={col.id}
            aria-label={col.label}
            onDragOver={(e) => {
              if (onMove && dragging.current) e.preventDefault();
            }}
            onDrop={() => {
              if (!onMove || !dragging.current) return;
              const d = dragging.current;
              if (d.from !== col.id) onMove(d.item, d.from, col.id);
              dragging.current = null;
            }}
            className={cn(
              "snap-start shrink-0 w-[85vw] sm:w-72 md:w-80 flex flex-col",
              col.tint,
            )}
          >
            <header className="pt-2">
              <div className={cn("h-[3px] w-full rounded-full", stroke)} />
              <div className="flex items-center justify-between gap-2 px-0.5 py-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                  {col.label}
                </h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {colItems.length}
                </span>
              </div>
            </header>

            <div className="flex-1 px-0.5 pb-2 space-y-2 min-h-[120px]">
              {colItems.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {col.emptyLabel ?? "Nothing here"}
                </p>
              ) : (
                colItems.map((item) => (
                  <div
                    key={getKey(item)}
                    draggable={!!onMove}
                    onDragStart={() => {
                      dragging.current = { item, from: col.id };
                    }}
                    onDragEnd={() => {
                      dragging.current = null;
                    }}
                    className="rounded-lg bg-card border border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                  >
                    {renderItem(item)}
                  </div>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
