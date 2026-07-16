import { useMemo, useState } from "react";
import {
  CalendarDays, Plus, ChevronLeft, ChevronRight, MoreHorizontal,
  Search, Trash2, Copy, ExternalLink, Clock, ListFilter, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewPostDialog } from "@/components/create/NewPostDialog";
import { EventDetailsDialog } from "@/components/publish/EventDetailsDialog";
import { AiFillWeekDialog } from "@/components/publish/AiFillWeekDialog";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useScheduledPosts, type ScheduledPost } from "@/hooks/useScheduledPosts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ViewMode = "month" | "week" | "list";

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  const [detailsPost, setDetailsPost] = useState<ScheduledPost | null>(null);

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
        "group text-[11px] rounded-md px-1.5 py-1 border cursor-grab active:cursor-grabbing",
        "bg-primary/10 border-primary/30 text-primary hover:bg-primary/15 transition-colors",
        "flex items-center gap-1 min-w-0",
        dragId === p.id && "opacity-50",
      )}
    >
      <Clock className="h-2.5 w-2.5 shrink-0 opacity-70" strokeWidth={2} />
      <span className="tabular-nums font-medium shrink-0">{fmtTime(p.scheduledAt)}</span>
      {!compact && (
        <>
          <div className="flex -space-x-1 shrink-0">
            {p.platformIds.slice(0, 2).map((id) => (
              <div key={id} className="rounded-full ring-1 ring-background">
                <PlatformIcon platform={id} size="xs" showBackground />
              </div>
            ))}
          </div>
          <span className="truncate text-foreground/80">{p.caption.slice(0, 24)}</span>
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
          "min-h-[100px] md:min-h-[120px] p-1.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-1",
          "hover:border-primary/50",
          isSelected ? "border-primary bg-primary/5" : "border-border/50 bg-card/40",
          isToday && !isSelected && "bg-primary/[0.06] border-primary/30",
          dropTarget === key && "border-primary bg-primary/10 ring-2 ring-primary/40",
        )}
      >
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-xs font-semibold h-5 min-w-5 px-1 inline-flex items-center justify-center rounded-full",
            isToday ? "bg-primary text-primary-foreground" : "text-foreground/80",
          )}>
            {date.getDate()}
          </span>
          {dayPosts.length > 0 && (
            <span className="text-[10px] text-muted-foreground">{dayPosts.length}</span>
          )}
        </div>
        <div className="flex-1 space-y-1 overflow-hidden">
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
          {(["month", "week", "list"] as ViewMode[]).map((v) => (
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
      {view !== "list" && (
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
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground mb-2" strokeWidth={1.5} />
              <p className="text-sm font-medium">No scheduled posts</p>
              <Button size="sm" onClick={() => setNewOpen(true)} className="mt-3">
                <Plus className="h-4 w-4 mr-1" /> Schedule your first post
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {[...filtered]
                .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
                .map((p) => (
                  <li key={p.id} className="p-3 sm:p-4 hover:bg-muted/40 transition-colors flex items-center gap-3">
                    <div className="flex flex-col items-center min-w-14">
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {new Date(p.scheduledAt).toLocaleDateString([], { month: "short" })}
                      </span>
                      <span className="text-lg font-bold tabular-nums leading-none">
                        {new Date(p.scheduledAt).getDate()}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{fmtTime(p.scheduledAt)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{p.caption}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {p.platformIds.map((id) => (
                          <PlatformIcon key={id} platform={id} size="xs" />
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
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {/* Day details sheet */}
      <Sheet open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedDay && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>
                    {selectedDay.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <Button size="sm" onClick={() => setNewOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
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
      <EventDetailsDialog post={detailsPost} open={!!detailsPost} onOpenChange={(o) => !o && setDetailsPost(null)} />
    </div>
  );
};
