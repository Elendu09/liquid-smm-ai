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

/** Default stroke palette applied by column index when none is supplied. */
const DEFAULT_STROKES = [
  "bg-primary",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-destructive",
  "bg-violet-500",
];


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
        const stroke = col.stroke ?? DEFAULT_STROKES[ci % DEFAULT_STROKES.length];
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

            <div className="flex-1 p-2 space-y-2 min-h-[120px]">
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
