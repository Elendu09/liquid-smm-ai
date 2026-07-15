import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Clock, Calendar as CalendarIcon, Plus, ChevronDown } from "lucide-react";
import { format, parseISO, isBefore } from "date-fns";
import {
  PageHeader,
  ToolbarBar,
  ViewToggle,
  useViewMode,
  KanbanBoard,
  ListView,
  type KanbanColumnDef,
} from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { useScheduledPosts, type ScheduledPost } from "@/hooks/useScheduledPosts";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { SmartPostScheduler } from "@/components/automation/SmartPostScheduler";
import { PlatformGate } from "@/components/shared/PlatformGate";
import { Input } from "@/components/ui/input";

type Status = "draft" | "scheduled" | "published" | "failed";

const columns: KanbanColumnDef<Status>[] = [
  { id: "draft", label: "Draft", emptyLabel: "No drafts" },
  { id: "scheduled", label: "Scheduled", emptyLabel: "No upcoming posts" },
  { id: "published", label: "Published", emptyLabel: "Nothing published yet" },
  { id: "failed", label: "Failed", emptyLabel: "No failures — 🎉" },
];

function deriveStatus(p: ScheduledPost & { status?: Status }): Status {
  if (p.status) return p.status;
  if (!p.scheduledAt) return "draft";
  return isBefore(parseISO(p.scheduledAt), new Date()) ? "published" : "scheduled";
}

function PostCard({
  post,
  onDelete,
  onReschedule,
}: {
  post: ScheduledPost;
  onDelete: () => void;
  onReschedule: () => void;
}) {
  return (
    <div className="p-3 space-y-2">
      <p className="text-sm line-clamp-3 text-foreground">{post.caption || "Untitled post"}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {post.platformIds?.slice(0, 4).map((id) => (
          <PlatformIcon key={id} platform={id} className="h-4 w-4" />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {post.scheduledAt ? format(parseISO(post.scheduledAt), "MMM d, HH:mm") : "No date"}
        </span>
        <div className="flex items-center gap-1">
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
  const { posts, remove, update } = useScheduledPosts();
  const [search, setSearch] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState<ScheduledPost | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");

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
    update(rescheduling.id, { scheduledAt: new Date(rescheduleValue).toISOString() });
    toast.success("Post rescheduled");
    setRescheduling(null);
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
            onClick={() => setComposerOpen((v) => !v)}
            className="min-h-9"
            aria-expanded={composerOpen}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">New post</span>
          </Button>
        }
      />

      {view === "kanban" ? (
        <KanbanBoard<ScheduledPost & { status?: Status }, Status>
          columns={columns}
          items={filtered}
          getKey={(p) => p.id}
          getStatus={deriveStatus}
          onMove={(item, _from, to) => {
            update(item.id, { ...(item as any), status: to } as any);
            toast.success(`Moved to ${to}`);
          }}
          renderItem={(p) => (
            <PostCard
              post={p}
              onDelete={() => handleDelete(p.id)}
              onReschedule={() => openReschedule(p)}
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

      {composerOpen && (
        <section className="mt-6 rounded-xl border border-border/60 bg-card/50 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Compose</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setComposerOpen(false)}
              aria-label="Close composer"
            >
              <ChevronDown className="h-4 w-4 mr-1" />
              Hide
            </Button>
          </div>
          <PlatformGate toolKey="scheduler">
            {(ctx) => <SmartPostScheduler selectedPlatforms={ctx.platforms} />}
          </PlatformGate>
        </section>
      )}
    </div>
  );
}
