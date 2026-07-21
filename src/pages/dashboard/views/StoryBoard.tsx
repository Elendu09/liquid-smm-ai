import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Film, Zap, Pencil } from "lucide-react";
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
import { useStories } from "@/hooks/useStories";
import { isGuestSession } from "@/hooks/useGuest";
import { NewStoryDialog, type StoryItemFull, type StorySlide } from "@/components/publish/NewStoryDialog";
import { PublishStoryDialog } from "@/components/publish/PublishStoryDialog";

type StoryStatus = "idea" | "ready" | "scheduled" | "live";

const columns: KanbanColumnDef<StoryStatus>[] = [
  { id: "idea", label: "Idea", emptyLabel: "Empty — brainstorm one below." },
  { id: "ready", label: "Ready", emptyLabel: "Nothing polished yet." },
  { id: "scheduled", label: "Scheduled", emptyLabel: "No stories scheduled." },
  { id: "live", label: "Live", emptyLabel: "Nothing live right now." },
];

/** Seed a helpful first story so the board isn't blank on first load. */
const seed: StoryItemFull[] = [
  {
    id: "s1",
    title: "BTS of shoot 🎬",
    status: "idea",
    slides: [{ id: crypto.randomUUID(), type: "image", caption: "Setting up the lights" }] as StorySlide[],
    createdAt: new Date().toISOString(),
  },
];

export default function StoryBoard() {
  const [view, setView] = useViewMode("publish-stories", "kanban");
  const { items, setItems, add, update, remove } = useStories();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<StoryItemFull | null>(null);
  const [publishing, setPublishing] = useState<StoryItemFull | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  // Seed a friendly starter story ONLY for guests on first visit.
  useEffect(() => {
    if (items.length === 0 && isGuestSession()) setItems(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => items.filter((i) => !search || i.title.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  const handleSave = (story: StoryItemFull) => {
    const exists = items.some((i) => i.id === story.id);
    if (exists) update(story.id, story);
    else add(story);
  };

  const card = (i: StoryItemFull) => (
    <div className="p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Film className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{i.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {i.slides?.length ?? 0} slide{(i.slides?.length ?? 0) === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      {i.scheduledAt && (
        <Badge variant="secondary" className="text-[10px]">
          {new Date(i.scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </Badge>
      )}
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost" size="icon" className="h-7 w-7"
          aria-label="Edit story" onClick={() => setEditing(i)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon" className="h-7 w-7 text-primary"
          aria-label="Publish story" onClick={() => setPublishing(i)}
        >
          <Zap className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
          aria-label="Delete story" onClick={() => { remove(i.id); toast.success("Story deleted"); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      <ToolbarBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search stories…"
        viewToggle={<ViewToggle value={view} onChange={setView} />}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setNewOpen(true); }} className="min-h-9">
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">New story</span>
          </Button>
        }
      />

      {view === "kanban" ? (
        <KanbanBoard
          columns={columns}
          items={filtered}
          getKey={(i) => i.id}
          getStatus={(i) => i.status}
          onMove={(item, _from, to) => { update(item.id, { status: to }); toast.success(`Moved to ${to}`); }}
          renderItem={card}
        />
      ) : (
        <ListView items={filtered} getKey={(i) => i.id} renderItem={(i) => <div className="p-4">{card(i)}</div>} />
      )}

      <NewStoryDialog
        open={newOpen || !!editing}
        onOpenChange={(o) => { if (!o) { setNewOpen(false); setEditing(null); } }}
        onSave={handleSave}
        initial={editing}
      />
      <PublishStoryDialog
        story={publishing}
        open={!!publishing}
        onOpenChange={(o) => !o && setPublishing(null)}
        onUpdate={update}
      />
    </div>
  );
}
