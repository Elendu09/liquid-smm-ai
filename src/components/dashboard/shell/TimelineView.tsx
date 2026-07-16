import { useMemo } from "react";
import { CheckCircle2, XCircle, Clock3, Bot, Send, FileText, Bell, Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TimelineCategory = "post" | "bot" | "delivery" | "report" | "notification";
export type TimelineStatus = "success" | "failed" | "pending" | "info";

export interface TimelineEvent {
  id: string;
  title: string;
  subtitle?: string;
  category: TimelineCategory;
  status: TimelineStatus;
  timestamp: string; // ISO
  platform?: string;
}

const CATEGORY_ICON: Record<TimelineCategory, LucideIcon> = {
  post: Send,
  bot: Bot,
  delivery: CheckCircle2,
  report: FileText,
  notification: Bell,
};

const STATUS_STYLES: Record<TimelineStatus, { dot: string; ring: string; badge: string; icon: LucideIcon }> = {
  success: {
    dot: "bg-brand-green",
    ring: "ring-brand-green/30",
    badge: "text-brand-green",
    icon: CheckCircle2,
  },
  failed: {
    dot: "bg-destructive",
    ring: "ring-destructive/30",
    badge: "text-destructive",
    icon: XCircle,
  },
  pending: {
    dot: "bg-brand-orange",
    ring: "ring-brand-orange/30",
    badge: "text-brand-orange",
    icon: Clock3,
  },
  info: {
    dot: "bg-primary",
    ring: "ring-primary/30",
    badge: "text-primary",
    icon: Bell,
  },
};

function dayLabel(d: Date) {
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const iso = d.toDateString();
  if (iso === today.toDateString()) return "Today";
  if (iso === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function timeLabel(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

interface TimelineViewProps {
  events: TimelineEvent[];
  emptyLabel?: string;
  onSelect?: (event: TimelineEvent) => void;
  onDelete?: (event: TimelineEvent) => void;
}

export function TimelineView({ events, emptyLabel = "No activity yet.", onSelect, onDelete }: TimelineViewProps) {
  const groups = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const buckets = new Map<string, TimelineEvent[]>();
    for (const ev of sorted) {
      const key = dayLabel(new Date(ev.timestamp));
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(ev);
    }
    return Array.from(buckets.entries());
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border/60 rounded-xl">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card">
      {groups.map(([day, items]) => (
        <section key={day}>
          <header className="px-4 py-2 bg-muted/60 border-b border-border/60">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{day}</h4>
          </header>
          <ol className="relative px-4 py-3">
            <span aria-hidden className="absolute left-[27px] top-0 bottom-0 w-px bg-border/60" />
            {items.map((ev) => {
              const CatIcon = CATEGORY_ICON[ev.category];
              const style = STATUS_STYLES[ev.status];
              const interactive = Boolean(onSelect);
              return (
                <li key={ev.id} className="relative pl-10 py-1 group">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-[19px] top-[18px] h-3.5 w-3.5 rounded-full ring-4 ring-background",
                      style.dot,
                    )}
                  />
                  <div
                    role={interactive ? "button" : undefined}
                    tabIndex={interactive ? 0 : undefined}
                    onClick={interactive ? () => onSelect?.(ev) : undefined}
                    onKeyDown={
                      interactive
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onSelect?.(ev);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      "flex items-start gap-3 rounded-lg p-1.5 -m-1.5 transition-colors",
                      interactive && "cursor-pointer hover:bg-muted/60 focus:bg-muted/60 focus:outline-none",
                    )}
                  >
                    <div
                      className={cn(
                        "shrink-0 w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center ring-1",
                        style.ring,
                      )}
                    >
                      <CatIcon className={cn("h-4 w-4", style.badge)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium truncate">{ev.title}</p>
                        <time className="text-[11px] text-muted-foreground shrink-0">
                          {timeLabel(new Date(ev.timestamp))}
                        </time>
                      </div>
                      {ev.subtitle && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{ev.subtitle}</p>
                      )}
                    </div>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-60 group-hover:opacity-100"
                        aria-label={`Delete ${ev.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(ev);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
