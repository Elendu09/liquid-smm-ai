import { useMemo, useState } from "react";
import {
  CalendarDays, Plus, ChevronLeft, ChevronRight, MoreHorizontal,
  Search, Trash2, Copy, ExternalLink, Clock, ListFilter, Sparkles, X,
  Star, Repeat2, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewPostDialog } from "@/components/create/NewPostDialog";
import { EventDetailsDialog } from "@/components/publish/EventDetailsDialog";
import { AiFillWeekDialog } from "@/components/publish/AiFillWeekDialog";
import { RecyclingRulesDialog } from "@/components/publish/RecyclingRulesDialog";
import { BulkCsvImportDialog } from "@/components/publish/BulkCsvImportDialog";
import { ApprovalBadge } from "@/components/publish/ApprovalControls";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useScheduledPosts, type ScheduledPost } from "@/hooks/useScheduledPosts";
import { useBestTimes } from "@/hooks/useBestTimes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ViewMode = "month" | "week" | "list" | "feed";

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Left color bar for the timeline list view — encodes send + approval state. */
function statusBar(p: ScheduledPost): string {
  if (p.status === "failed") return "bg-rose-500";
  if (p.status === "completed") return "bg-emerald-500";
  if (p.status === "sending") return "bg-blue-500 animate-pulse";
  if (p.status === "paused") return "bg-amber-500";
  if (p.approvalStatus === "approved") return "bg-emerald-400/70";
  if (p.approvalStatus === "pending") return "bg-amber-400/70";
  if (p.approvalStatus === "rejected") return "bg-rose-400/70";
  return "bg-primary/60";
}

function StatusPill({ post }: { post: ScheduledPost }) {
  const map: Record<string, { label: string; cls: string }> = {
    failed:    { label: "Failed · retry",   cls: "bg-rose-500/15 text-rose-500 border-rose-500/30" },
    completed: { label: "Sent",             cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
    sending:   { label: "Sending…",         cls: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
    paused:    { label: "Paused",           cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
    queued:    { label: "Scheduled",        cls: "bg-primary/10 text-primary border-primary/30" },
  };
  const key = post.status ?? "queued";
  const s = map[key] ?? map.queued;
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium", s.cls)}>
      {key === "sending" && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
      {s.label}
    </span>
  );
}

export const ContentCalendar = () => {
  const { posts, update, remove, add } = useScheduledPosts();
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [view, setView] = useState<ViewMode>("month");
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [fillWeekOpen, setFillWeekOpen] = useState(false);
  const [recycleOpen, setRecycleOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [showBestTimes, setShowBestTimes] = useState(true);
  const [detailsPost, setDetailsPost] = useState<ScheduledPost | null>(null);

  const bestTimes = useBestTimes();

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const allPlatforms = useMemo(() => {
    const s = new Set<string>();
    posts.forEach((p) => p.platformIds.forEach((id) => s.add(id)));
    return Array.from(s);
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (platformFilter.length && !p.platformIds.some((id) => platformFilter.includes(id))) return false;
      if (search && !p.caption.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [posts, platformFilter, search]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    filtered.forEach((p) => {
      const d = new Date(p.scheduledAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    map.forEach((arr) => arr.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));
    return map;
  }, [filtered]);

  const getPostsForDate = (d: Date) =>
    postsByDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [];

  // Month grid
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthCells: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) monthCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) monthCells.push(new Date(year, month, d));
  while (monthCells.length % 7 !== 0) monthCells.push(null);

  // Week grid (7 days starting from Sunday of cursor week)
  const weekStart = useMemo(() => {
    const d = new Date(cursor);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [cursor]);
  const weekCells: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total: filtered.length,
      upcoming: filtered.filter((p) => new Date(p.scheduledAt).getTime() >= now).length,
      thisMonth: filtered.filter((p) => {
        const d = new Date(p.scheduledAt);
        return d.getMonth() === month && d.getFullYear() === year;
      }).length,
      platforms: allPlatforms.length,
    };
  }, [filtered, month, year, allPlatforms.length]);

  const shift = (delta: number) => {
    if (view === "week") {
      const d = new Date(cursor);
      d.setDate(d.getDate() + delta * 7);
      setCursor(d);
    } else {
      setCursor(new Date(year, month + delta, 1));
    }
  };

  const today = () => {
    setCursor(new Date());
    setSelectedDay(new Date());
  };

  const togglePlatformFilter = (p: string) =>
    setPlatformFilter((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  const handleDrop = (target: Date) => {
    if (!dragId) return;
    const post = posts.find((p) => p.id === dragId);
    if (!post) return;
    const orig = new Date(post.scheduledAt);
    const next = new Date(target);
    next.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
    update(post.id, { scheduledAt: next.toISOString() });
    toast.success(`Moved to ${next.toLocaleDateString()}`);
    setDragId(null);
    setDropTarget(null);
  };

  const duplicatePost = (p: ScheduledPost) => {
    add({
      caption: p.caption,
      mediaUrl: p.mediaUrl,
      scheduledAt: p.scheduledAt,
      platformIds: [...p.platformIds],
      hashtags: p.hashtags,
    });
    toast.success("Post duplicated");
  };

  const renderChip = (p: ScheduledPost, compact = false) => (
    <div
      key={p.id}
      draggable
      onDragStart={() => setDragId(p.id)}
      onDragEnd={() => { setDragId(null); setDropTarget(null); }}
      onClick={(e) => { e.stopPropagation(); setDetailsPost(p); }}
      className={cn(
        "group text-[10px] sm:text-[11px] rounded-md px-1 sm:px-1.5 py-0.5 sm:py-1 border cursor-grab active:cursor-grabbing",
        "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15 transition-colors",
        "flex items-center gap-1 min-w-0 max-w-full overflow-hidden",
        dragId === p.id && "opacity-50",
      )}
    >
      <Clock className="h-2.5 w-2.5 shrink-0 opacity-70" strokeWidth={2} />
      <span className="tabular-nums font-medium shrink-0 truncate">{fmtTime(p.scheduledAt)}</span>
      {!compact && (
        <>
          <div className="hidden sm:flex -space-x-1 shrink-0">
            {p.platformIds.slice(0, 2).map((id) => (
              <div key={id} className="rounded-full ring-1 ring-background">
                <PlatformIcon platform={id} size="xs" showBackground />
              </div>
            ))}
          </div>
          <span className="truncate text-foreground/80 min-w-0">{p.caption.slice(0, 24)}</span>
        </>
      )}
    </div>
  );

  const DayCell = ({ date }: { date: Date | null }) => {
    if (!date) return <div className="min-h-[100px] rounded-lg border border-dashed border-border/30 bg-muted/10" />;
    const dayPosts = getPostsForDate(date);
    const isToday = sameDay(date, new Date());
    const isSelected = selectedDay && sameDay(date, selectedDay);
    const key = date.toISOString();
    return (
      <div
        onClick={() => setSelectedDay(date)}
        onDragOver={(e) => { if (dragId) { e.preventDefault(); setDropTarget(key); } }}
        onDragLeave={() => setDropTarget((t) => (t === key ? null : t))}
        onDrop={() => handleDrop(date)}
        className={cn(
          "min-w-0 min-h-[70px] sm:min-h-[100px] md:min-h-[120px] p-1 sm:p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-1 overflow-hidden",
          "hover:border-primary/50",
          isSelected ? "border-primary bg-primary/5" : "border-border/50 bg-card/40",
          isToday && !isSelected && "bg-primary/[0.06] border-primary/30",
          dropTarget === key && "border-primary bg-primary/10 ring-2 ring-primary/40",
        )}
      >
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-[11px] sm:text-xs font-semibold h-5 min-w-5 px-1 inline-flex items-center justify-center rounded-full",
            isToday ? "bg-primary text-primary-foreground" : "text-foreground/80",
          )}>
            {date.getDate()}
          </span>
          <div className="flex items-center gap-1">
            {showBestTimes && bestTimes.isBestDay(date) && (
              <Star
                className="h-2.5 w-2.5 text-amber-500 fill-amber-500/60"
                strokeWidth={1.5}
                aria-label="Best time to post"
              />
            )}
            {dayPosts.length > 0 && (
              <span className="hidden sm:inline text-[10px] text-muted-foreground tabular-nums">{dayPosts.length}</span>
            )}
          </div>
        </div>

        {/* Mobile: compact dot row (chips overflow tiny cells) */}
        <div className="sm:hidden flex-1 flex items-end">
          {dayPosts.length > 0 && (
            <div className="flex flex-wrap gap-0.5 w-full">
              {dayPosts.slice(0, 6).map((p) => (
                <span
                  key={p.id}
                  className="h-1.5 w-1.5 rounded-full bg-primary/70"
                  title={fmtTime(p.scheduledAt)}
                />
              ))}
              {dayPosts.length > 6 && (
                <span className="text-[9px] text-muted-foreground leading-none self-center">+{dayPosts.length - 6}</span>
              )}
            </div>
          )}
        </div>

        {/* Desktop/tablet: full chips */}
        <div className="hidden sm:block flex-1 space-y-1 overflow-hidden">
          {dayPosts.slice(0, 3).map((p) => renderChip(p, true))}
          {dayPosts.length > 3 && (
            <div className="text-[10px] text-muted-foreground text-center pt-0.5">+{dayPosts.length - 3} more</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-auto">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarDays className="h-4 w-4 text-primary" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-base font-bold leading-tight">Content Calendar</h3>
            <p className="text-[11px] text-muted-foreground">Plan, drag, and reschedule posts</p>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/40">
          {(["month", "week", "list", "feed"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "text-xs font-medium capitalize px-2.5 py-1 rounded-md transition-colors",
                view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>

        <Button size="sm" variant="outline" onClick={today}>Today</Button>
        <Button
          size="sm"
          variant={showBestTimes ? "default" : "outline"}
          onClick={() => setShowBestTimes((v) => !v)}
          title="Toggle best-time overlay"
        >
          <Star className={cn("h-4 w-4 sm:mr-1", showBestTimes && "fill-current")} />
          <span className="hidden sm:inline">Best times</span>
        </Button>
        <Button size="sm" variant="outline" onClick={() => setRecycleOpen(true)}>
          <Repeat2 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Recycle</span>
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCsvOpen(true)}>
          <Upload className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Import CSV</span>
        </Button>
        <Button size="sm" variant="outline" onClick={() => setFillWeekOpen(true)}>
          <Sparkles className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">AI Fill Week</span>
        </Button>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Schedule</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-40 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search captions…" className="pl-8 h-9" />
        </div>
        {allPlatforms.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <ListFilter className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Platforms</span>
                {platformFilter.length > 0 && (
                  <Badge className="ml-1.5 h-4 px-1 text-[10px]">{platformFilter.length}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <div className="space-y-1">
                {allPlatforms.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePlatformFilter(p)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-muted transition-colors",
                      platformFilter.includes(p) && "bg-primary/10 text-primary",
                    )}
                  >
                    <PlatformIcon platform={p} size="xs" />
                    <span className="capitalize">{p}</span>
                  </button>
                ))}
                {platformFilter.length > 0 && (
                  <button
                    onClick={() => setPlatformFilter([])}
                    className="w-full text-[11px] text-muted-foreground hover:text-foreground pt-1"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Total", value: stats.total },
          { label: "Upcoming", value: stats.upcoming },
          { label: "This month", value: stats.thisMonth },
          { label: "Platforms", value: stats.platforms },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-lg font-bold tabular-nums">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Nav header */}
      {(view === "month" || view === "week") && (
        <div className="rounded-2xl border border-border/60 bg-card p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h4 className="text-sm sm:text-base font-semibold">
              {view === "month"
                ? `${months[month]} ${year}`
                : `${weekCells[0].toLocaleDateString()} – ${weekCells[6].toLocaleDateString()}`}
            </h4>
            <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-1.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {(view === "month" ? monthCells : weekCells).map((d, i) => (
              <DayCell key={i} date={d} />
            ))}
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="relative space-y-4 pb-20">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
              <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground mb-2" strokeWidth={1.5} />
              <p className="text-sm font-medium">No scheduled posts</p>
              <Button size="sm" onClick={() => setNewOpen(true)} className="mt-3">
                <Plus className="h-4 w-4 mr-1" /> Schedule your first post
              </Button>
            </div>
          ) : (
            Object.entries(
              [...filtered]
                .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
                .reduce<Record<string, ScheduledPost[]>>((acc, p) => {
                  const d = new Date(p.scheduledAt);
                  const key = d.toDateString();
                  (acc[key] ||= []).push(p);
                  return acc;
                }, {}),
            ).map(([dayKey, dayPosts]) => {
              const d = new Date(dayKey);
              const isToday = sameDay(d, new Date());
              const lastTime = dayPosts.length
                ? new Date(dayPosts[dayPosts.length - 1].scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : null;
              return (
                <section key={dayKey} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                  <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                    <div className="flex items-center gap-2">
                      {isToday && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden />}
                      <span className="text-sm font-semibold">
                        {isToday ? "Today" : d.toLocaleDateString([], { weekday: "long" })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {d.toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
                      {dayPosts.length} {dayPosts.length === 1 ? "post" : "posts"}
                    </span>
                  </header>
                  <ul className="divide-y divide-border/60">
                    {dayPosts.map((p) => (
                      <li key={p.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => setDetailsPost(p)}
                          className="w-full text-left flex items-stretch gap-3 p-3 sm:p-4 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex flex-col items-end justify-start pt-0.5 w-14 sm:w-16 shrink-0">
                            <span className="text-sm font-semibold tabular-nums">
                              {new Date(p.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(p.scheduledAt).toLocaleTimeString([], { hour: "2-digit", hour12: false })}h
                            </span>
                          </div>
                          <div
                            className={cn("w-1 rounded-full shrink-0", statusBar(p))}
                            aria-hidden
                          />
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium line-clamp-2 flex-1">{p.caption || "(no caption)"}</p>
                              <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-7 w-7">
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => duplicatePost(p)}>
                                      <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedDay(new Date(p.scheduledAt))}>
                                      <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open day
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => { remove(p.id); toast.success("Deleted"); }}>
                                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <StatusPill post={p} />
                              {p.approvalStatus && p.approvalStatus !== "draft" && (
                                <ApprovalBadge status={p.approvalStatus} />
                              )}
                              {p.platformIds.slice(0, 3).map((id) => (
                                <span key={id} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
                                  <PlatformIcon platform={id} size="xs" />
                                  <span className="capitalize hidden sm:inline">{id}</span>
                                </span>
                              ))}
                              {p.platformIds.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">+{p.platformIds.length - 3}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {lastTime && (
                    <footer className="px-4 py-2 text-[11px] text-muted-foreground bg-muted/20 border-t border-border/60 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> No posts after {lastTime}
                    </footer>
                  )}
                </section>
              );
            })
          )}

          {/* Floating quick-schedule FAB */}
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="fixed bottom-24 lg:bottom-8 right-4 sm:right-6 z-30 inline-flex items-center gap-1.5 h-12 px-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            aria-label="Quick schedule"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-semibold">Quick Schedule</span>
          </button>
        </div>
      )}


      {view === "feed" && (
        <div className="max-w-2xl mx-auto space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
              <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground mb-2" strokeWidth={1.5} />
              <p className="text-sm font-medium">No scheduled posts</p>
              <Button size="sm" onClick={() => setNewOpen(true)} className="mt-3">
                <Plus className="h-4 w-4 mr-1" /> Schedule your first post
              </Button>
            </div>
          ) : (
            [...filtered]
              .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
              .map((p) => {
                const d = new Date(p.scheduledAt);
                const relative = (() => {
                  const diff = d.getTime() - Date.now();
                  const abs = Math.abs(diff);
                  const mins = Math.round(abs / 60000);
                  const hours = Math.round(mins / 60);
                  const days = Math.round(hours / 24);
                  const fmt = days >= 1 ? `${days}d` : hours >= 1 ? `${hours}h` : `${mins}m`;
                  return diff >= 0 ? `in ${fmt}` : `${fmt} ago`;
                })();
                return (
                  <article
                    key={p.id}
                    className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <header className="flex items-center gap-3 p-3 sm:p-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <CalendarDays className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold">
                            {d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                          <span className="text-xs text-muted-foreground">· {fmtTime(p.scheduledAt)}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{relative}</span>
                          <StatusPill post={p} />
                          {p.approvalStatus && p.approvalStatus !== "draft" && (
                            <ApprovalBadge status={p.approvalStatus} />
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {p.platformIds.map((id) => (
                            <div key={id} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <PlatformIcon platform={id} size="xs" />
                              <span className="capitalize">{id}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailsPost(p)}>
                            <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicatePost(p)}>
                            <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => { remove(p.id); toast.success("Deleted"); }}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </header>
                    <div className="px-3 sm:px-4 pb-3">
                      <p className="text-sm whitespace-pre-wrap">{p.caption || "(no caption)"}</p>
                    </div>
                    {p.mediaUrl && (
                      <div className="border-y border-border/60 bg-muted/20">
                        <img src={p.mediaUrl} alt="" className="w-full max-h-[420px] object-cover" />
                      </div>
                    )}
                    <footer className="grid grid-cols-3 divide-x divide-border/60 border-t border-border/60">
                      <button
                        onClick={() => setDetailsPost(p)}
                        className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Details
                      </button>
                      <button
                        onClick={() => duplicatePost(p)}
                        className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" /> Duplicate
                      </button>
                      <button
                        onClick={() => { remove(p.id); toast.success("Deleted"); }}
                        className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </footer>
                  </article>
                );
              })
          )}
        </div>
      )}

      {/* Day details sheet */}
      <Sheet open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <SheetContent className="w-full sm:max-w-md [&>button.absolute]:hidden">
          {selectedDay && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {selectedDay.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" onClick={() => setNewOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                    <SheetClose className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground backdrop-blur transition hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </SheetClose>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                {getPostsForDate(selectedDay).length === 0 ? (
                  <div className="text-center py-10">
                    <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground mb-2" strokeWidth={1.5} />
                    <p className="text-sm text-muted-foreground">Nothing scheduled</p>
                  </div>
                ) : (
                  getPostsForDate(selectedDay).map((p) => (
                    <div key={p.id} className="rounded-xl border border-border/60 bg-card p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold tabular-nums">{fmtTime(p.scheduledAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => duplicatePost(p)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { remove(p.id); toast.success("Deleted"); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm">{p.caption}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {p.platformIds.map((id) => (
                          <div key={id} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted">
                            <PlatformIcon platform={id} size="xs" />
                            <span className="capitalize">{id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <NewPostDialog open={newOpen} onOpenChange={setNewOpen} />
      <AiFillWeekDialog open={fillWeekOpen} onOpenChange={setFillWeekOpen} startDate={selectedDay ?? undefined} />
      <RecyclingRulesDialog open={recycleOpen} onOpenChange={setRecycleOpen} />
      <BulkCsvImportDialog open={csvOpen} onOpenChange={setCsvOpen} />
      <EventDetailsDialog post={detailsPost} open={!!detailsPost} onOpenChange={(o) => !o && setDetailsPost(null)} />
    </div>
  );
};
