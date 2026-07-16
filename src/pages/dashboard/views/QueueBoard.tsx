import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Trash2,
  Clock,
  Calendar as CalendarIcon,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { format, parseISO, isBefore } from "date-fns";
import { useMcpInbox } from "@/hooks/useMcpInbox";
import { logMcpCall } from "@/hooks/useMcpActivity";
import {
  ToolbarBar,
  ViewToggle,
  useViewMode,
  KanbanBoard,
  ListView,
  type KanbanColumnDef,
} from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useScheduledPosts, type ScheduledPost, type SendStatus } from "@/hooks/useScheduledPosts";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { SmartPostScheduler } from "@/components/automation/SmartPostScheduler";
import { PlatformGate } from "@/components/shared/PlatformGate";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type Column = "queued" | "sending" | "completed" | "failed";

const columns: KanbanColumnDef<Column>[] = [
  { id: "queued", label: "Queued", emptyLabel: "No queued posts" },
  { id: "sending", label: "Sending", emptyLabel: "Nothing sending right now" },
  { id: "completed", label: "Completed", emptyLabel: "Nothing published yet" },
  { id: "failed", label: "Failed", emptyLabel: "No failures — 🎉" },
];

function deriveStatus(p: ScheduledPost): Column {
  const s = p.status;
  if (s === "sending" || s === "completed" || s === "failed") return s;
  // queued or unset: still awaiting send-time
  if (p.scheduledAt && isBefore(parseISO(p.scheduledAt), new Date())) return "sending";
  return "queued";
}

function StatusPill({ post }: { post: ScheduledPost }) {
  const s: SendStatus = post.status ?? "queued";
  if (s === "sending") {
    return (
      <Badge variant="secondary" className="gap-1 border-primary/30 bg-primary/10 text-primary">
        <Loader2 className="h-3 w-3 animate-spin" />
        Sending {Math.round(post.sendProgress ?? 0)}%
      </Badge>
    );
  }
  if (s === "completed") {
    return (
      <Badge variant="secondary" className="gap-1 border-brand-green/30 bg-brand-green/10 text-brand-green">
        <CheckCircle2 className="h-3 w-3" />
        Sent
      </Badge>
    );
  }
  if (s === "failed") {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="h-3 w-3" />
      Queued
    </Badge>
  );
}

function PostCard({
  post,
  onDelete,
  onReschedule,
  onRetry,
}: {
  post: ScheduledPost;
  onDelete: () => void;
  onReschedule: () => void;
  onRetry: () => void;
}) {
  const status: SendStatus = post.status ?? "queued";
  const tz = post.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm line-clamp-3 text-foreground flex-1">{post.caption || "Untitled post"}</p>
        <StatusPill post={post} />
      </div>
      {status === "sending" && (
        <Progress value={post.sendProgress ?? 0} className="h-1" />
      )}
      {status === "failed" && post.error && (
        <p className="text-[11px] text-destructive/90">{post.error}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {post.platformIds?.slice(0, 4).map((id) => (
          <PlatformIcon key={id} platform={id} className="h-4 w-4" />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1" title={tz}>
          <Clock className="h-3 w-3" />
          {post.scheduledAt ? format(parseISO(post.scheduledAt), "MMM d, HH:mm") : "No date"}
          <span className="opacity-60">· {tz.split("/").pop()}</span>
        </span>
        <div className="flex items-center gap-1">
          {status === "failed" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Retry send"
              onClick={onRetry}
            >
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Reschedule post"
            onClick={onReschedule}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            aria-label="Delete post"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function QueueBoard() {
  const [view, setView] = useViewMode("publish-queue", "kanban");
  const { posts, add, remove, update } = useScheduledPosts();
  const { drain } = useMcpInbox();
  const [search, setSearch] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState<ScheduledPost | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");

  useEffect(() => {
    const pending = drain("scheduled-post");
    if (pending.length === 0) return;
    const added: ScheduledPost[] = [];
    pending.forEach((p) => {
      const pl = p.payload as {
        caption?: string;
        platformIds?: string[];
        scheduledAt?: string;
        hashtags?: string[];
        mediaUrl?: string;
        timezone?: string;
      };
      const rec = add({
        caption: pl.caption ?? "",
        platformIds: pl.platformIds ?? ["instagram"],
        scheduledAt: pl.scheduledAt ?? new Date().toISOString(),
        hashtags: pl.hashtags,
        mediaUrl: pl.mediaUrl,
        timezone: pl.timezone,
      });
      added.push(rec);
    });
    toast.success(`Added ${added.length} approved MCP post${added.length > 1 ? "s" : ""} to queue`);
    logMcpCall({
      tool: "queue_cross_platform_post",
      status: "success",
      summary: `Applied ${added.length} approved cross-platform post(s)`,
      resources: added.map((r) => ({ kind: "scheduled-post", id: r.id, label: r.caption.slice(0, 60) })),
      payload: { count: added.length },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      posts.filter((p) =>
        !search ? true : p.caption?.toLowerCase().includes(search.toLowerCase()),
      ),
    [posts, search],
  );

  const handleDelete = (id: string) => {
    remove(id);
    toast.success("Post removed from queue");
  };

  const openReschedule = (post: ScheduledPost) => {
    setRescheduling(post);
    setRescheduleValue(post.scheduledAt?.slice(0, 16) ?? "");
  };
  const confirmReschedule = () => {
    if (!rescheduling || !rescheduleValue) return;
    update(rescheduling.id, {
      scheduledAt: new Date(rescheduleValue).toISOString(),
      status: "queued",
      sendProgress: 0,
      error: undefined,
      sentAt: undefined,
    });
    toast.success("Post rescheduled");
    setRescheduling(null);
  };

  const retrySend = (post: ScheduledPost) => {
    update(post.id, {
      status: "queued",
      sendProgress: 0,
      error: undefined,
      scheduledAt: new Date(Date.now() - 1000).toISOString(),
    });
    toast.success("Retrying send…");
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      <ToolbarBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search posts…"
        viewToggle={<ViewToggle value={view} onChange={setView} />}
        actions={
          <Button
            size="sm"
            onClick={() => setComposerOpen(true)}
            className="min-h-9"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">New post</span>
          </Button>
        }
      />

      {view === "kanban" ? (
        <KanbanBoard<ScheduledPost, Column>
          columns={columns}
          items={filtered}
          getKey={(p) => p.id}
          getStatus={deriveStatus}
          onMove={(item, _from, to) => {
            if (to === "queued") {
              update(item.id, { status: "queued", sendProgress: 0, error: undefined });
            } else if (to === "completed") {
              update(item.id, { status: "completed", sendProgress: 100 });
            } else if (to === "failed") {
              update(item.id, { status: "failed", sendProgress: 100, error: "Marked failed manually" });
            }
            toast.success(`Moved to ${to}`);
          }}
          renderItem={(p) => (
            <PostCard
              post={p}
              onDelete={() => handleDelete(p.id)}
              onReschedule={() => openReschedule(p)}
              onRetry={() => retrySend(p)}
            />
          )}
        />
      ) : (
        <ListView
          items={filtered}
          getKey={(p) => p.id}
          emptyLabel="No posts in your queue yet — hit New post to add one."
          renderItem={(p) => (
            <div className="p-4">
              <PostCard
                post={p}
                onDelete={() => handleDelete(p.id)}
                onReschedule={() => openReschedule(p)}
                onRetry={() => retrySend(p)}
              />
            </div>
          )}
        />
      )}

      {rescheduling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 space-y-4 shadow-lg">
            <h3 className="font-semibold">Reschedule post</h3>
            <Input
              type="datetime-local"
              value={rescheduleValue}
              onChange={(e) => setRescheduleValue(e.target.value)}
              aria-label="New scheduled time"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRescheduling(null)}>
                Cancel
              </Button>
              <Button onClick={confirmReschedule} disabled={!rescheduleValue}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <Sheet open={composerOpen} onOpenChange={setComposerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>Compose scheduled post</SheetTitle>
            <SheetDescription>
              Plan a single post or bulk-schedule across time slots and platforms.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 sm:px-6 pb-6 pt-4">
            <PlatformGate toolKey="scheduler">
              {(ctx) => <SmartPostScheduler selectedPlatforms={ctx.platforms} />}
            </PlatformGate>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
