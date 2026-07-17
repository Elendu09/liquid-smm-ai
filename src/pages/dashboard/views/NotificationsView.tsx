import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ExternalLink,
  Settings,
  Trash2,
  Sparkles,
  Trophy,
  AlertCircle,
  Clock,
  Info,
  Sparkle,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { EmptyState } from "@/components/dashboard/shell";
import {
  NotificationSettingsDialog,
  useNotificationPrefs,
} from "@/components/activity/NotificationSettingsDialog";
import { NotificationExtrasDialog } from "@/components/activity/NotificationExtrasDialog";
import { Webhook } from "lucide-react";

const TYPE_META: Record<
  Notification["type"],
  { icon: typeof Bell; className: string; label: string }
> = {
  engagement: { icon: Sparkles, className: "text-primary bg-primary/10", label: "Engagement" },
  milestone: { icon: Trophy, className: "text-amber-500 bg-amber-500/10", label: "Milestone" },
  alert: { icon: AlertCircle, className: "text-destructive bg-destructive/10", label: "Alert" },
  reminder: { icon: Clock, className: "text-blue-500 bg-blue-500/10", label: "Reminder" },
  system: { icon: Info, className: "text-muted-foreground bg-muted", label: "System" },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export function NotificationsView() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const prefs = useNotificationPrefs();
  const [filter, setFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const visible = useMemo(() => {
    const bySearch = notifications.filter((n) => {
      const q = search.toLowerCase().trim();
      if (q && !`${n.title} ${n.message}`.toLowerCase().includes(q)) return false;
      if (filter === "unread" && n.read) return false;
      if (filter === "read" && !n.read) return false;
      // Respect category prefs.
      if (!prefs[n.type]) return false;
      return true;
    });
    return bySearch;
  }, [notifications, filter, search, prefs]);

  // Group by groupKey — ungrouped items get unique keys so they stay as singletons.
  const grouped = useMemo(() => {
    const map = new Map<string, Notification[]>();
    for (const n of visible) {
      const key = n.groupKey ?? `__solo:${n.id}`;
      const arr = map.get(key) ?? [];
      arr.push(n);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      items,
      lead: items[0],
      isGroup: !key.startsWith("__solo:") && items.length > 1,
    }));
  }, [visible]);

  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const runAiSummary = async () => {
    setAiLoading(true);
    setAiSummary(null);
    try {
      const { data, error } = await supabase.functions.invoke("notif-ai-summary");
      if (error) throw error;
      setAiSummary((data as { summary?: string })?.summary ?? "No summary available.");
    } catch {
      toast.error("Couldn't generate summary");
    } finally {
      setAiLoading(false);
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allChecked = visible.length > 0 && visible.every((n) => selected.has(n.id));
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(visible.map((n) => n.id)));
  };

  const bulkMarkRead = () => {
    selected.forEach((id) => markAsRead(id));
    toast.success(`Marked ${selected.size} as read`);
    setSelected(new Set());
  };

  const bulkDelete = () => {
    const count = selected.size;
    selected.forEach((id) => deleteNotification(id));
    toast.success(`Deleted ${count}`);
    setSelected(new Set());
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <Badge className="h-5 px-1.5 text-[10px]">{unreadCount} unread</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Product alerts, milestones, and account signals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={runAiSummary} disabled={aiLoading}>
            <Sparkle className="h-4 w-4 mr-1.5" />
            {aiLoading ? "Summarizing…" : "AI summary"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              markAllAsRead();
              toast.success("All marked as read");
            }}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 mr-1.5" /> Mark all read
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-1.5" /> Settings
          </Button>
        </div>
      </div>

      {aiSummary && (
        <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-3 text-sm">
          <div className="flex items-center gap-2 text-primary mb-1.5 text-xs font-medium">
            <Sparkle className="h-3.5 w-3.5" /> AI summary
          </div>
          <div className="whitespace-pre-wrap text-foreground/90">{aiSummary}</div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Search notifications…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                "px-2.5 h-9 rounded-md border text-xs whitespace-nowrap transition-colors",
                filter === f.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk bar */}
      {visible.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-card/60 p-2 pl-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
            {selected.size > 0 ? `${selected.size} selected` : `Select all (${visible.length})`}
          </label>
          {selected.size > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={bulkMarkRead}>
                <Check className="h-3.5 w-3.5 mr-1.5" /> Read
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={bulkDelete}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Feed */}
      {visible.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="Nothing to show"
          description={
            search
              ? "No notifications match your search."
              : "You're all caught up. New alerts will appear here."
          }
        />
      ) : (
        <ul className="space-y-2">
          {grouped.map(({ key, items, lead, isGroup }) => {
            const expanded = expandedGroups.has(key);
            const shown = isGroup && !expanded ? [lead] : items;
            return (
              <li key={key} className="space-y-1">
                {shown.map((n, idx) => {
                  const meta = TYPE_META[n.type];
                  const Icon = meta.icon;
                  const isSelected = selected.has(n.id);
                  const showGroupChip = isGroup && idx === 0 && !expanded;
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "group relative rounded-xl border transition-all overflow-hidden",
                        !n.read
                          ? "bg-primary/[0.03] border-primary/30"
                          : "bg-card/60 border-border/60 hover:bg-muted/40",
                        isGroup && expanded && idx > 0 && "ml-6",
                      )}
                    >
                      <div className="flex items-start gap-3 p-3">
                        <Checkbox
                          className="mt-1.5"
                          checked={isSelected}
                          onCheckedChange={() => toggle(n.id)}
                          aria-label={`Select ${n.title}`}
                        />
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                            meta.className,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium truncate">{n.title}</p>
                            {!n.read && (
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            )}
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                              {meta.label}
                            </Badge>
                            {showGroupChip && (
                              <button
                                type="button"
                                onClick={() => toggleGroup(key)}
                                className="inline-flex items-center gap-1 text-[10px] h-4 px-1.5 rounded-full border border-primary/40 text-primary hover:bg-primary/10"
                              >
                                +{items.length - 1} more
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            )}
                            {isGroup && expanded && idx === 0 && (
                              <button
                                type="button"
                                onClick={() => toggleGroup(key)}
                                className="inline-flex items-center gap-1 text-[10px] h-4 px-1.5 rounded-full border border-border/60 text-muted-foreground hover:bg-muted"
                              >
                                Collapse
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] text-muted-foreground">
                              {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                            </span>
                            {n.actionUrl && (
                              <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[11px]"
                              >
                                <Link to={n.actionUrl} onClick={() => markAsRead(n.id)}>
                                  View <ExternalLink className="h-3 w-3 ml-1" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!n.read && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              aria-label="Mark as read"
                              onClick={() => markAsRead(n.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            aria-label="Delete"
                            onClick={() => {
                              deleteNotification(n.id);
                              toast.success("Notification removed");
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </li>
            );
          })}
        </ul>
      )}

      <NotificationSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <NotificationExtrasDialog open={extrasOpen} onOpenChange={setExtrasOpen} />
    </div>
  );
}
