import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, Plus, Trash2, GitCommitVertical, LayoutGrid, List, Filter } from "lucide-react";
import {
  ToolbarBar,
  ViewToggle,
  useViewMode,
  KanbanBoard,
  ListView,
  TimelineView,
  type TimelineEvent,
  type TimelineCategory,
  type StatusItem,
} from "@/components/dashboard/shell";
import { EmptyState as SharedEmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { isGuestSession } from "@/hooks/useGuest";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useRunHistory, type RunRecord } from "@/hooks/useRunHistory";
import { cn } from "@/lib/utils";
import { RunDetailsDrawer } from "@/components/activity/RunDetailsDrawer";
import {
  RunFiltersDialog,
  DEFAULT_FILTERS,
  type RunFilters,
} from "@/components/activity/RunFiltersDialog";
import { BulkClearDialog } from "@/components/activity/BulkClearDialog";

const runSeed: StatusItem[] = [
  { id: "r1", title: "Auto-reply to @jordan.creates", subtitle: "Engagement bot · Instagram", status: "success", meta: "2m ago", createdAt: new Date(Date.now() - 2 * 60_000).toISOString() },
  { id: "r2", title: "Publish scheduled post", subtitle: "Scheduler · Twitter", status: "success", meta: "12m ago", createdAt: new Date(Date.now() - 12 * 60_000).toISOString() },
  { id: "r3", title: "Sync competitor stats", subtitle: "Competitor tracker", status: "pending", meta: "running", createdAt: new Date(Date.now() - 30 * 60_000).toISOString() },
  { id: "r4", title: "Post story", subtitle: "Story automation · IG", status: "failed", meta: "auth expired", createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString() },
  { id: "r5", title: "Weekly report generated", subtitle: "Reports · All platforms", status: "success", meta: "yesterday", createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString() },
];

const columns = [
  { id: "pending", label: "Pending" },
  { id: "success", label: "Success" },
  { id: "failed", label: "Failed" },
] as const;

const CATEGORY_FILTERS: { id: "all" | TimelineCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "post", label: "Posts" },
  { id: "bot", label: "Bot" },
  { id: "delivery", label: "Delivery" },
  { id: "report", label: "Reports" },
];

function categoryOf(item: StatusItem): TimelineCategory {
  const s = ((item.subtitle ?? "") + " " + item.title).toLowerCase();
  if (s.includes("bot") || s.includes("auto-reply") || s.includes("dm")) return "bot";
  if (s.includes("publish") || s.includes("post") || s.includes("story")) return "post";
  if (s.includes("report") || s.includes("audit")) return "report";
  if (s.includes("sync") || s.includes("delivery")) return "delivery";
  return "delivery";
}

export function ActivityFeedView() {
  const [view, setView] = useViewMode("activity-runs", "timeline");
  const { items, setItems, add, update, remove } = useLocalCollection<StatusItem>("activity", "runs");
  const { posts } = useScheduledPosts();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | TimelineCategory>("all");
  const [newTitle, setNewTitle] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<RunFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [detailsFor, setDetailsFor] = useState<StatusItem | null>(null);

  const activeAdvancedCount =
    (advancedFilters.category !== "all" ? 1 : 0) +
    (advancedFilters.status !== "all" ? 1 : 0) +
    (advancedFilters.from ? 1 : 0) +
    (advancedFilters.to ? 1 : 0);

  useEffect(() => {
    if (items.length === 0 && isGuestSession()) setItems(runSeed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const merged: TimelineEvent[] = useMemo(() => {
    const fromRuns: TimelineEvent[] = items.map((i) => ({
      id: i.id,
      title: i.title,
      subtitle: i.subtitle,
      category: categoryOf(i),
      status:
        i.status === "success"
          ? "success"
          : i.status === "failed"
            ? "failed"
            : i.status === "pending"
              ? "pending"
              : "info",
      timestamp: i.createdAt,
    }));
    const today = new Date();
    const fromPosts: TimelineEvent[] = posts
      .filter((p) => {
        const d = new Date(p.scheduledAt);
        return d.toDateString() === today.toDateString() && d.getTime() <= Date.now();
      })
      .map((p) => ({
        id: `post-${p.id}`,
        title: "Scheduled post published",
        subtitle: p.caption.slice(0, 80),
        category: "post",
        status: "success",
        timestamp: p.scheduledAt,
      }));
    return [...fromRuns, ...fromPosts];
  }, [items, posts]);

  const filtered = useMemo(() => {
    const fromTs = advancedFilters.from ? new Date(advancedFilters.from).getTime() : 0;
    const toTs = advancedFilters.to
      ? new Date(advancedFilters.to).getTime() + 24 * 3_600_000
      : Number.POSITIVE_INFINITY;
    return merged.filter((e) => {
      if (filter !== "all" && e.category !== filter) return false;
      if (advancedFilters.category !== "all" && e.category !== advancedFilters.category) return false;
      if (advancedFilters.status !== "all" && e.status !== advancedFilters.status) return false;
      const ts = new Date(e.timestamp).getTime();
      if (ts < fromTs || ts > toTs) return false;
      if (!search) return true;
      return (e.title + " " + (e.subtitle ?? "")).toLowerCase().includes(search.toLowerCase());
    });
  }, [merged, filter, search, advancedFilters]);

  const filteredItems = useMemo(() => {
    const ids = new Set(filtered.map((e) => e.id));
    return items.filter((i) => ids.has(i.id));
  }, [items, filtered]);

  const addItem = () => {
    if (!newTitle.trim()) return;
    add({
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    setNewTitle("");
    toast.success("Added");
  };

  const rerun = (run: StatusItem) => {
    add({
      id: crypto.randomUUID(),
      title: run.title,
      subtitle: run.subtitle,
      status: "pending",
      meta: "re-running",
      createdAt: new Date().toISOString(),
    });
    toast.success("Re-run queued");
  };

  const handleBulkClear = (scope: "all" | "success" | "failed" | "old") => {
    const cutoff = Date.now() - 7 * 24 * 3_600_000;
    setItems((prev) =>
      prev.filter((i) => {
        if (scope === "all") return false;
        if (scope === "success") return i.status !== "success";
        if (scope === "failed") return i.status !== "failed";
        if (scope === "old") return new Date(i.createdAt).getTime() >= cutoff;
        return true;
      }),
    );
    toast.success(`Cleared ${scope === "all" ? "all runs" : scope + " runs"}`);
  };

  const card = (i: StatusItem) => (
    <div className="flex items-start gap-3 p-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Clock className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{i.title}</p>
        {i.subtitle && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{i.subtitle}</p>}
        {i.meta && <p className="text-[11px] text-muted-foreground mt-1">{i.meta}</p>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
        aria-label={`Delete ${i.title}`}
        onClick={() => {
          remove(i.id);
          toast.success("Deleted");
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      <ToolbarBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search activity…"
        filters={
          <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={cn(
                  "px-2.5 h-8 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                  filter === f.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
        viewToggle={
          <ViewToggle
            value={view}
            onChange={setView}
            options={[
              { value: "timeline", label: "Timeline", icon: GitCommitVertical },
              { value: "kanban", label: "Columns", icon: LayoutGrid },
              { value: "list", label: "List", icon: List },
            ]}
          />
        }
        actions={
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={activeAdvancedCount ? "default" : "outline"}
              onClick={() => setFiltersOpen(true)}
              aria-label="More filters"
            >
              <Filter className="h-4 w-4 mr-1.5" />
              Filters
              {activeAdvancedCount > 0 && (
                <Badge className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">{activeAdvancedCount}</Badge>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setBulkOpen(true)}
              disabled={items.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Clear
            </Button>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Manual entry…"
              className="h-9 w-32 sm:w-56"
              aria-label="Manual entry"
            />
            <Button size="sm" onClick={addItem} disabled={!newTitle.trim()} aria-label="Add">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {filtered.length === 0 && !isGuestSession() ? (
        <SharedEmptyState
          variant={items.length === 0 ? "connect-account" : "create-first"}
          title={items.length === 0 ? "No activity yet" : "No runs match your filters"}
          description={
            items.length === 0
              ? "Connect a social account — automations, publishes, and system runs will stream here."
              : "Try clearing filters or widening the date range."
          }
          ctaLabel={items.length === 0 ? "Connect account" : undefined}
          ctaHref={items.length === 0 ? "/dashboard/settings/connected" : undefined}
        />
      ) : view === "timeline" ? (
        <TimelineView
          events={filtered}
          onSelect={(ev) => {
            const found = items.find((i) => i.id === ev.id);
            if (found) setDetailsFor(found);
            else toast.message(ev.title, { description: ev.subtitle });
          }}
          onDelete={(ev) => {
            remove(ev.id);
            toast.success("Deleted");
          }}
        />
      ) : view === "kanban" ? (
        <KanbanBoard
          columns={columns as any}
          items={filteredItems}
          getKey={(i) => i.id}
          getStatus={(i) => i.status as any}
          onMove={(item, _from, to) => {
            update(item.id, { status: to as string });
            toast.success(`Moved to ${to}`);
          }}
          renderItem={(i) => (
            <button type="button" className="w-full text-left" onClick={() => setDetailsFor(i)}>
              {card(i)}
            </button>
          )}
        />
      ) : (
        <ListView
          items={filteredItems}
          getKey={(i) => i.id}
          renderItem={(i) => (
            <button type="button" className="w-full text-left" onClick={() => setDetailsFor(i)}>
              {card(i)}
            </button>
          )}
        />
      )}

      <RunFiltersDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={advancedFilters}
        onApply={setAdvancedFilters}
      />
      <BulkClearDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        totalCount={items.length}
        onConfirm={(scope) => {
          handleBulkClear(scope);
          setBulkOpen(false);
        }}
      />
      <RunDetailsDrawer
        open={!!detailsFor}
        onOpenChange={(v) => !v && setDetailsFor(null)}
        run={detailsFor}
        onRerun={rerun}
        onDelete={(id) => {
          remove(id);
          toast.success("Deleted");
        }}
      />
    </div>
  );
}
