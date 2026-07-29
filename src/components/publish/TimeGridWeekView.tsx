import { useMemo, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import type { ScheduledPost } from "@/hooks/useScheduledPosts";

interface Props {
  weekCells: Date[];
  posts: ScheduledPost[];
  onSelect: (p: ScheduledPost) => void;
  onDropAt: (date: Date, hour: number, evt: React.DragEvent) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  dragId: string | null;
  hours?: number[];
  /** Called with new start ISO and duration in minutes. */
  onResize?: (id: string, newStartIso: string, durationMin: number) => void;
  /** Called when an empty cell is clicked. */
  onCellClick?: (date: Date, hour: number) => void;
  /** Return duration for a post; defaults to 30 min. */
  getDurationMin?: (p: ScheduledPost) => number;
}

const ROW_HEIGHT = 68; // px per hour, matches min-h on cells
const MIN_DURATION = 15;
const SNAP_MIN = 15;

/**
 * Vertical time-grid week view — hour rows × 7 day columns.
 * Cards support drag-to-move, drag-to-resize (top/bottom handles), and
 * empty-slot click to create.
 */
export function TimeGridWeekView({
  weekCells,
  posts,
  onSelect,
  onDropAt,
  onDragStart,
  onDragEnd,
  dragId,
  hours = [6, 9, 12, 13, 15, 17, 19, 21],
  onResize,
  onCellClick,
  getDurationMin,
}: Props) {
  const now = new Date();
  const isToday = (d: Date) =>
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();

  const durationOf = useCallback(
    (p: ScheduledPost) => Math.max(MIN_DURATION, getDurationMin?.(p) ?? 30),
    [getDurationMin],
  );

  const byDayHour = useMemo(() => {
    const m = new Map<string, ScheduledPost[]>();
    for (const p of posts) {
      const d = new Date(p.scheduledAt);
      const key = `${d.toDateString()}|${d.getHours()}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(p);
    }
    return m;
  }, [posts]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Resize state (top or bottom handle)
  const [resizing, setResizing] = useState<{
    id: string;
    edge: "top" | "bottom";
    startY: number;
    startIso: string;
    startDuration: number;
    liveStartIso: string;
    liveDuration: number;
  } | null>(null);

  const beginResize = (
    e: React.PointerEvent,
    post: ScheduledPost,
    edge: "top" | "bottom",
  ) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setResizing({
      id: post.id,
      edge,
      startY: e.clientY,
      startIso: post.scheduledAt,
      startDuration: durationOf(post),
      liveStartIso: post.scheduledAt,
      liveDuration: durationOf(post),
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!resizing) return;
    const deltaPx = e.clientY - resizing.startY;
    const deltaMin =
      Math.round((deltaPx / ROW_HEIGHT) * 60 / SNAP_MIN) * SNAP_MIN;
    if (resizing.edge === "bottom") {
      const newDur = Math.max(MIN_DURATION, resizing.startDuration + deltaMin);
      setResizing({ ...resizing, liveDuration: newDur });
    } else {
      const start = new Date(resizing.startIso);
      const shifted = new Date(start.getTime() + deltaMin * 60000);
      const newDur = Math.max(MIN_DURATION, resizing.startDuration - deltaMin);
      setResizing({ ...resizing, liveStartIso: shifted.toISOString(), liveDuration: newDur });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!resizing) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    onResize?.(resizing.id, resizing.liveStartIso, resizing.liveDuration);
    setResizing(null);
  };

  return (
    <div ref={scrollRef} className="overflow-x-auto -mx-2 sm:mx-0">
      <div className="min-w-[720px] grid" style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}>
        {/* Header row */}
        <div />
        {weekCells.map((d, i) => {
          const today = isToday(d);
          return (
            <div
              key={i}
              className={cn(
                "px-2 py-2 text-center border-b border-border/60",
                today && "bg-primary/[0.06] rounded-t-lg",
              )}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {d.toLocaleDateString([], { weekday: "short" })}
              </div>
              <div
                className={cn(
                  "text-lg font-bold tabular-nums leading-tight mt-0.5",
                  today ? "text-primary" : "text-foreground/90",
                )}
              >
                {String(d.getDate()).padStart(2, "0")}
              </div>
            </div>
          );
        })}

        {/* Hour rows */}
        {hours.map((h) => (
          <RowFragment
            key={h}
            hour={h}
            weekCells={weekCells}
            byDayHour={byDayHour}
            onSelect={onSelect}
            onDropAt={onDropAt}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            dragId={dragId}
            isToday={isToday}
            durationOf={durationOf}
            beginResize={beginResize}
            resizing={resizing}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onCellClick={onCellClick}
          />
        ))}
      </div>

      {/* Floating time chip while resizing */}
      {resizing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold shadow-lg pointer-events-none tabular-nums">
          {new Date(resizing.liveStartIso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          {" · "}
          {resizing.liveDuration}m
        </div>
      )}
    </div>
  );
}

function RowFragment({
  hour, weekCells, byDayHour, onSelect, onDropAt, onDragStart, onDragEnd, dragId, isToday,
  durationOf, beginResize, resizing, onPointerMove, onPointerUp, onCellClick,
}: {
  hour: number;
  weekCells: Date[];
  byDayHour: Map<string, ScheduledPost[]>;
  onSelect: (p: ScheduledPost) => void;
  onDropAt: (d: Date, h: number, e: React.DragEvent) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  dragId: string | null;
  isToday: (d: Date) => boolean;
  durationOf: (p: ScheduledPost) => number;
  beginResize: (e: React.PointerEvent, p: ScheduledPost, edge: "top" | "bottom") => void;
  resizing: { id: string; liveDuration: number; liveStartIso: string } | null;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onCellClick?: (date: Date, hour: number) => void;
}) {
  const label = hour === 0 ? "12 am" : hour < 12 ? `${hour} am` : hour === 12 ? "12 pm" : `${hour - 12} pm`;
  return (
    <>
      <div className="text-[10px] tabular-nums text-muted-foreground pr-2 py-3 text-right border-r border-border/40">
        {label}
      </div>
      {weekCells.map((d, i) => {
        const key = `${d.toDateString()}|${hour}`;
        const items = byDayHour.get(key) ?? [];
        const today = isToday(d);
        const empty = items.length === 0;
        return (
          <div
            key={i}
            onDragOver={(e) => { if (dragId) e.preventDefault(); }}
            onDrop={(e) => onDropAt(d, hour, e)}
            onClick={() => { if (empty && onCellClick) onCellClick(d, hour); }}
            style={{ minHeight: ROW_HEIGHT }}
            className={cn(
              "relative border-b border-r border-border/40 p-1 space-y-1 transition-colors",
              today ? "bg-primary/[0.04]" : "hover:bg-muted/40",
              empty && onCellClick && "cursor-pointer hover:bg-primary/[0.06] group/cell",
            )}
          >
            {empty && onCellClick && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none">
                + Schedule
              </span>
            )}
            {items.map((p) => {
              const isResizing = resizing?.id === p.id;
              const dur = isResizing ? resizing.liveDuration : durationOf(p);
              const startIso = isResizing ? resizing.liveStartIso : p.scheduledAt;
              const height = Math.max(28, (dur / 60) * ROW_HEIGHT - 6);
              return (
                <div
                  key={p.id}
                  className={cn(
                    "relative w-full rounded-lg border border-border/60 bg-card/90 hover:border-primary/50 shadow-sm transition-all group",
                    dragId === p.id && "opacity-40",
                    isResizing && "ring-2 ring-primary/60 shadow-lg",
                  )}
                  style={{ height }}
                >
                  {/* Top resize handle */}
                  <div
                    onPointerDown={(e) => beginResize(e, p, "top")}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    className="absolute top-0 inset-x-0 h-1.5 cursor-ns-resize rounded-t-lg opacity-0 group-hover:opacity-100 bg-primary/40 hover:bg-primary transition-colors"
                    aria-label="Resize start time"
                  />
                  <button
                    type="button"
                    draggable
                    onDragStart={() => onDragStart(p.id)}
                    onDragEnd={onDragEnd}
                    onClick={(e) => { e.stopPropagation(); onSelect(p); }}
                    className="w-full h-full text-left px-2 py-1.5 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        {p.platformIds.slice(0, 1).map((id) => (
                          <PlatformIcon key={id} platform={id} size="xs" showBackground />
                        ))}
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          {new Date(startIso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>
                      <span className="text-[9px] tabular-nums text-muted-foreground/70">{dur}m</span>
                    </div>
                    <p className="text-[11px] font-medium leading-tight line-clamp-2 text-foreground/90">
                      {p.caption || "Untitled"}
                    </p>
                  </button>
                  {/* Bottom resize handle */}
                  <div
                    onPointerDown={(e) => beginResize(e, p, "bottom")}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    className="absolute bottom-0 inset-x-0 h-1.5 cursor-ns-resize rounded-b-lg opacity-0 group-hover:opacity-100 bg-primary/40 hover:bg-primary transition-colors flex items-center justify-center"
                    aria-label="Resize duration"
                  >
                    <span className="h-0.5 w-6 rounded-full bg-primary-foreground/60" />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
