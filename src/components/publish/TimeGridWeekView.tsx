import { useMemo, useRef } from "react";
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
  hours?: number[]; // hours to show on the left rail
}

/**
 * Vertical time-grid week view — hour rows × 7 day columns.
 * Posts render as absolutely positioned cards inside their day/hour cell.
 * Today's column gets a soft accent tint (reference: image_97).
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
}: Props) {
  const now = new Date();
  const isToday = (d: Date) =>
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();

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
          />
        ))}
      </div>
    </div>
  );
}

function RowFragment({
  hour, weekCells, byDayHour, onSelect, onDropAt, onDragStart, onDragEnd, dragId, isToday,
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
        return (
          <div
            key={i}
            onDragOver={(e) => { if (dragId) e.preventDefault(); }}
            onDrop={(e) => onDropAt(d, hour, e)}
            className={cn(
              "relative min-h-[68px] border-b border-r border-border/40 p-1 space-y-1 transition-colors",
              today ? "bg-primary/[0.04]" : "hover:bg-muted/40",
            )}
          >
            {items.map((p) => (
              <button
                key={p.id}
                draggable
                onDragStart={() => onDragStart(p.id)}
                onDragEnd={onDragEnd}
                onClick={() => onSelect(p)}
                className={cn(
                  "w-full text-left rounded-lg border border-border/60 bg-card/90 hover:bg-card hover:border-primary/50 shadow-sm px-2 py-1.5 transition-all",
                  dragId === p.id && "opacity-40",
                )}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1 min-w-0">
                    {p.platformIds.slice(0, 1).map((id) => (
                      <PlatformIcon key={id} platform={id} size="xs" showBackground />
                    ))}
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {new Date(p.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] font-medium leading-tight line-clamp-2 text-foreground/90">
                  {p.caption || "Untitled"}
                </p>
              </button>
            ))}
          </div>
        );
      })}
    </>
  );
}
