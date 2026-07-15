import { ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";

export interface KanbanColumnDef<S extends string = string> {
  id: S;
  label: string;
  tint?: string; // tailwind class for a subtle accent, uses tokens
  emptyLabel?: string;
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
      {columns.map((col) => {
        const colItems = items.filter((i) => getStatus(i) === col.id);
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
              "snap-start shrink-0 w-[85vw] sm:w-72 md:w-80 flex flex-col rounded-xl border border-border/60 bg-muted/30",
              col.tint,
            )}
          >
            <header className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {col.label}
              </h3>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-background text-foreground/70">
                {colItems.length}
              </span>
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
