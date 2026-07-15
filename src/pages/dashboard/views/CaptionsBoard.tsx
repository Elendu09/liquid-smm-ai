import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Copy, Send, Sparkles, Trash2, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";

type CaptionStatus = "draft" | "ready" | "archived";

export interface Caption {
  id: string;
  title: string;
  body: string;
  hashtags: string[];
  platformIds: string[];
  tags: string[];
  status: CaptionStatus;
  createdAt: string;
}

const columns: KanbanColumnDef<CaptionStatus>[] = [
  { id: "draft", label: "Drafts" },
  { id: "ready", label: "Ready" },
  { id: "archived", label: "Archived" },
];

const seed: Caption[] = [
  {
    id: "c1",
    title: "Product launch teaser",
    body: "Something huge drops next Tuesday. Turn on notifications so you don't miss it 🚀",
    hashtags: ["launch", "comingSoon", "stayTuned"],
    platformIds: ["instagram", "twitter"],
    tags: ["launch"],
    status: "ready",
    createdAt: new Date().toISOString(),
  },
  {
    id: "c2",
    title: "Behind the scenes reel",
    body: "A day in our studio in 30 seconds. Wait for the ending 👀",
    hashtags: ["bts", "reel", "studio"],
    platformIds: ["instagram", "tiktok"],
    tags: ["bts"],
    status: "draft",
    createdAt: new Date().toISOString(),
  },
  {
    id: "c3",
    title: "Old sale caption",
    body: "Winter sale ends tonight!",
    hashtags: ["sale"],
    platformIds: ["facebook"],
    tags: ["sale", "seasonal"],
    status: "archived",
    createdAt: new Date().toISOString(),
  },
];

const PLATFORM_OPTIONS = ["instagram", "tiktok", "youtube", "twitter", "facebook", "linkedin"];

export default function CaptionsBoard() {
  const navigate = useNavigate();
  const [view, setView] = useViewMode("library-captions", "kanban");
  const { items, setItems, add, update, remove } = useLocalCollection<Caption>("library", "captions");
  const { add: addScheduled } = useScheduledPosts();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Caption | null>(null);

  useEffect(() => {
    if (items.length === 0) setItems(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((c) =>
        !search
          ? true
          : (c.title + c.body + c.hashtags.join(" ") + c.tags.join(" "))
              .toLowerCase()
              .includes(search.toLowerCase()),
      ),
    [items, search],
  );

  const startNew = () => {
    const c: Caption = {
      id: crypto.randomUUID(),
      title: "Untitled caption",
      body: "",
      hashtags: [],
      platformIds: [],
      tags: [],
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    add(c);
    setEditing(c);
  };

  const copy = async (c: Caption) => {
    try {
      const text = c.hashtags.length > 0 ? `${c.body}\n\n${c.hashtags.map((h) => `#${h}`).join(" ")}` : c.body;
      await navigator.clipboard.writeText(text);
      toast.success("Caption copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const insertIntoQueue = (c: Caption) => {
    const full = c.hashtags.length > 0 ? `${c.body}\n\n${c.hashtags.map((h) => `#${h}`).join(" ")}` : c.body;
    addScheduled({
      caption: full,
      scheduledAt: new Date().toISOString(),
      platformIds: c.platformIds.length > 0 ? c.platformIds : ["instagram"],
      hashtags: c.hashtags,
    });
    toast.success("Added to publish queue");
  };

  const sendToStudio = (c: Caption) => {
    navigate(`/dashboard/create/studio?draftId=${encodeURIComponent(c.id)}`);
  };

  const card = (c: Caption, dense = false) => (
    <div className={cn(dense ? "p-3" : "p-3")}>
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{c.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{c.body || "No text yet"}</p>
          <div className="flex flex-wrap items-center gap-1 mt-2">
            {c.platformIds.slice(0, 4).map((p) => (
              <PlatformIcon key={p} platform={p} size="xs" showBackground />
            ))}
            {c.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-1 mt-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Copy caption" onClick={() => copy(c)}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Insert into queue" onClick={() => insertIntoQueue(c)}>
          <Send className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Send to studio" onClick={() => sendToStudio(c)}>
          <Sparkles className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(c)}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          aria-label="Delete caption"
          onClick={() => {
            remove(c.id);
            toast.success("Deleted");
          }}
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
        searchPlaceholder="Search captions…"
        viewToggle={<ViewToggle value={view} onChange={setView} />}
        actions={
          <Button size="sm" onClick={startNew} aria-label="New caption">
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">New caption</span>
          </Button>
        }
      />

      {view === "kanban" ? (
        <KanbanBoard
          columns={columns}
          items={filtered}
          getKey={(c) => c.id}
          getStatus={(c) => c.status}
          onMove={(item, _from, to) => {
            update(item.id, { status: to });
            toast.success(`Moved to ${to}`);
          }}
          renderItem={(c) => card(c)}
        />
      ) : (
        <ListView items={filtered} getKey={(c) => c.id} renderItem={(c) => card(c, true)} />
      )}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {editing && (
            <>
              <SheetHeader>
                <SheetTitle>Edit caption</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                  <Input
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    aria-label="Caption title"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Body</label>
                  <Textarea
                    value={editing.body}
                    onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                    rows={6}
                    aria-label="Caption body"
                    placeholder="Write your caption…"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Hashtags (space separated, no #)
                  </label>
                  <Input
                    value={editing.hashtags.join(" ")}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        hashtags: e.target.value.split(/\s+/).map((h) => h.replace(/^#/, "")).filter(Boolean),
                      })
                    }
                    aria-label="Hashtags"
                    placeholder="launch comingSoon"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Platforms</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PLATFORM_OPTIONS.map((p) => {
                      const active = editing.platformIds.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() =>
                            setEditing({
                              ...editing,
                              platformIds: active
                                ? editing.platformIds.filter((x) => x !== p)
                                : [...editing.platformIds, p],
                            })
                          }
                          aria-pressed={active}
                          aria-label={`Toggle ${p}`}
                          className={cn(
                            "px-2.5 h-9 rounded-md border flex items-center gap-1.5 text-xs transition-colors",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/60 text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <PlatformIcon platform={p} size="xs" />
                          <span className="capitalize">{p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags</label>
                  <Input
                    value={editing.tags.join(" ")}
                    onChange={(e) =>
                      setEditing({ ...editing, tags: e.target.value.split(/\s+/).filter(Boolean) })
                    }
                    aria-label="Tags"
                    placeholder="launch seasonal"
                  />
                </div>
              </div>
              <SheetFooter className="gap-2 sm:gap-2">
                <Button variant="ghost" onClick={() => setEditing(null)} aria-label="Cancel">
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button
                  onClick={() => {
                    update(editing.id, editing);
                    toast.success("Caption saved");
                    setEditing(null);
                  }}
                  aria-label="Save caption"
                >
                  Save
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
