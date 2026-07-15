import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Film } from "lucide-react";
import {
  ToolbarBar,
  ViewToggle,
  useViewMode,
  KanbanBoard,
  ListView,
  type KanbanColumnDef,
} from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalCollection } from "@/hooks/useLocalCollection";

type StoryStatus = "idea" | "ready" | "scheduled" | "live";

interface StoryItem {
  id: string;
  title: string;
  scheduledAt?: string;
  status: StoryStatus;
  createdAt: string;
}

const columns: KanbanColumnDef<StoryStatus>[] = [
  { id: "idea", label: "Idea" },
  { id: "ready", label: "Ready" },
  { id: "scheduled", label: "Scheduled" },
  { id: "live", label: "Live" },
];

const seed: StoryItem[] = [
  { id: "s1", title: "BTS of shoot 🎬", status: "idea", createdAt: new Date().toISOString() },
  { id: "s2", title: "Product teaser", status: "ready", createdAt: new Date().toISOString() },
  { id: "s3", title: "Q&A poll", status: "scheduled", scheduledAt: new Date(Date.now()+864e5).toISOString(), createdAt: new Date().toISOString() },
];

export default function StoryBoard() {
  const [view, setView] = useViewMode("publish-stories", "kanban");
  const { items, setItems, add, update, remove } = useLocalCollection<StoryItem>("publish", "stories");
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => { if (items.length === 0) setItems(seed); }, [items.length, setItems]);

  const filtered = useMemo(
    () => items.filter((i) => !search || i.title.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  const addStory = () => {
    if (!newTitle.trim()) return;
    add({ id: crypto.randomUUID(), title: newTitle.trim(), status: "idea", createdAt: new Date().toISOString() });
    setNewTitle("");
    toast.success("Story added");
  };

  const card = (i: StoryItem) => (
    <div className="p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Film className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm font-medium flex-1">{i.title}</p>
      </div>
      {i.scheduledAt && (
        <p className="text-[11px] text-muted-foreground">
          {new Date(i.scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
      <div className="flex justify-end">
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
          <div className="flex gap-1.5">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStory()}
              placeholder="New story idea…"
              className="h-9 w-40 sm:w-56"
              aria-label="New story title"
            />
            <Button size="sm" onClick={addStory} disabled={!newTitle.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
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
    </div>
  );
}
