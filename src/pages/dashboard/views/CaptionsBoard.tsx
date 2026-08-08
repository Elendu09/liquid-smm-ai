import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Copy, Send, Sparkles, Trash2, X, CheckSquare } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useMcpInbox } from "@/hooks/useMcpInbox";
import { logMcpCall } from "@/hooks/useMcpActivity";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { isGuestSession } from "@/hooks/useGuest";
import { cn } from "@/lib/utils";
import { PanelSection } from "@/components/shared/PanelSection";
import { MediaThumb } from "@/components/shared/MediaThumb";

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

// Figma-style test preview images — proves image preview renders in card
const CAPTION_PREVIEWS: Record<string, string> = {
  c1: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&auto=format&fit=crop&q=60",
  c2: "https://images.unsplash.com/photo-1590650046871-92c887180603?w=600&auto=format&fit=crop&q=60", // studio / video vibe
  c3: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60",
};
const FALLBACK_PREVIEW = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60";

function captionPreviewUrl(c: Caption): string | undefined {
  if ((c as unknown as { imageUrl?: string }).imageUrl) return (c as unknown as { imageUrl: string }).imageUrl;
  return CAPTION_PREVIEWS[c.id] ?? FALLBACK_PREVIEW;
}
function isVideoPreview(c: Caption): boolean {
  // demo: c2 is a reel — show as video with play overlay
  if (c.id === "c2") return true;
  const v = (c as unknown as { imageUrl?: string }).imageUrl;
  return !!v && /\.(mp4|webm|mov)(?:\?|#|$)/i.test(v);
}

export default function CaptionsBoard() {
  const navigate = useNavigate();
  const [view, setView] = useViewMode("library-captions", "kanban");
  const { items, setItems, add, update, remove } = useLocalCollection<Caption>("library", "captions");
  const { add: addScheduled } = useScheduledPosts();
  const { drain } = useMcpInbox();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Caption | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmQueue, setConfirmQueue] = useState(false);
  const defaultStart = () => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setSeconds(0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  };
  const [queueStartAt, setQueueStartAt] = useState<string>(defaultStart());
  const [queueIntervalMin, setQueueIntervalMin] = useState<number>(15);

  useEffect(() => {
    if (items.length === 0 && isGuestSession()) setItems(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drain any caption drafts queued by MCP tools (from ChatGPT/Claude etc.)
  useEffect(() => {
    const pending = drain("caption-draft");
    if (pending.length === 0) return;
    const now = new Date().toISOString();
    const drafts: Caption[] = pending.map((p) => {
      const pl = p.payload as {
        title?: string;
        body?: string;
        hashtags?: string[];
        platformIds?: string[];
      };
      return {
        id: crypto.randomUUID(),
        title: pl.title ?? "MCP caption",
        body: pl.body ?? "",
        hashtags: pl.hashtags ?? [],
        platformIds: pl.platformIds ?? [],
        tags: ["mcp"],
        status: "draft",
        createdAt: now,
      };
    });
    setItems((prev) => [...drafts, ...prev]);
    toast.success(`Added ${drafts.length} MCP caption${drafts.length > 1 ? "s" : ""} to library`);
    logMcpCall({
      tool: "create_caption_draft",
      status: "success",
      summary: `Applied ${drafts.length} caption draft(s) from MCP inbox`,
      resources: drafts.map((d) => ({ kind: "caption", id: d.id, label: d.title })),
      payload: { count: drafts.length },
    });
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

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedCaptions = useMemo(() => items.filter((c) => selected.has(c.id)), [items, selected]);

  const bulkCopy = async () => {
    if (selectedCaptions.length === 0) return;
    const text = selectedCaptions
      .map((c) => (c.hashtags.length > 0 ? `${c.body}\n\n${c.hashtags.map((h) => `#${h}`).join(" ")}` : c.body))
      .join("\n\n---\n\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${selectedCaptions.length} captions`);
    } catch {
      toast.error("Could not copy");
    }
  };

  const bulkQueue = () => {
    if (selectedCaptions.length === 0) return;
    const startMs = queueStartAt ? new Date(queueStartAt).getTime() : Date.now() + 60 * 60 * 1000;
    if (Number.isNaN(startMs)) {
      toast.error("Invalid start time");
      return;
    }
    const stepMs = Math.max(0, Math.round(queueIntervalMin)) * 60 * 1000;
    selectedCaptions.forEach((c, i) => {
      const full = c.hashtags.length > 0 ? `${c.body}\n\n${c.hashtags.map((h) => `#${h}`).join(" ")}` : c.body;
      addScheduled({
        caption: full,
        scheduledAt: new Date(startMs + i * stepMs).toISOString(),
        platformIds: c.platformIds.length > 0 ? c.platformIds : ["instagram"],
        hashtags: c.hashtags,
      });
    });
    toast.success(`Queued ${selectedCaptions.length} captions`);
    setSelected(new Set());
    setConfirmQueue(false);
  };

  const bulkDelete = () => {
    if (selectedCaptions.length === 0) return;
    const ids = new Set(selectedCaptions.map((c) => c.id));
    setItems((prev) => prev.filter((c) => !ids.has(c.id)));
    toast.success(`Deleted ${ids.size} captions`);
    setSelected(new Set());
    setConfirmDelete(false);
  };

  const card = (c: Caption, dense = false) => {
    const isSelected = selected.has(c.id);
    const preview = captionPreviewUrl(c);
    const isVideo = isVideoPreview(c);
    // For dense list, we keep image small; for grid kanban, full preview
    return (
      <div className={cn("group overflow-hidden flex flex-col", isSelected && "ring-2 ring-primary/50")}>
        {/* Image preview header — test image proves preview renders; video gets Play overlay */}
        {preview && (
          <button
            type="button"
            onClick={() => setEditing(c)}
            className={cn(
              "relative block w-full overflow-hidden bg-muted/30 text-left",
              dense ? "h-20" : "aspect-[16/10]",
            )}
            aria-label={`Preview ${c.title}`}
          >
            <MediaThumb
              url={isVideo ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" : preview}
              alt={c.title}
              className="h-full w-full"
              onPlay={(u) => window.open(u, "_blank", "noopener")}
            />
            {/* subtle top fade */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        <div className={cn(dense ? "p-2.5" : "p-3")}>
          <div className="flex items-start gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleSelect(c.id)}
              aria-label={`Select ${c.title}`}
              className="mt-0.5 shrink-0"
            />
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/10">
              <FileText className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold tracking-tight truncate leading-none">{c.title}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{c.body || "No text yet"}</p>
              <div className="flex flex-wrap items-center gap-1 mt-2">
                {c.platformIds.slice(0, 4).map((p) => (
                  <PlatformIcon key={p} platform={p} size="xs" showBackground />
                ))}
                {c.tags.slice(0, 3).map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-1 mt-3 border-t border-border/40 pt-2">
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {new Date(c.createdAt).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Copy caption" onClick={() => copy(c)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Insert into queue" onClick={() => insertIntoQueue(c)}>
                <Send className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Send to studio" onClick={() => sendToStudio(c)}>
                <Sparkles className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2" onClick={() => setEditing(c)}>
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
        </div>
      </div>
    );
  };


  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8 space-y-4">
      <PanelSection
        icon={FileText}
        title="Captions"
        description="Reusable copy — every card shows a live image preview on top; videos get a Play overlay."
        accent="from-violet-500 via-violet-500/50 to-transparent"
        action={
          <Button size="sm" onClick={startNew} aria-label="New caption">
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">New caption</span>
          </Button>
        }
      >
        <ToolbarBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search captions…"
          viewToggle={<ViewToggle value={view} onChange={setView} />}
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
      </PanelSection>

      {/* Sticky bulk-action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] sm:w-auto max-w-[42rem]">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md shadow-2xl p-2 pl-3">
            <div className="flex items-center gap-1.5 pr-2 border-r border-border/60">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold whitespace-nowrap">
                {selected.size} selected
              </span>
            </div>
            <Button size="sm" variant="ghost" onClick={bulkCopy} aria-label="Copy selected captions">
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmQueue(true)}
              aria-label="Insert selected captions into queue"
            >
              <Send className="h-3.5 w-3.5 mr-1" /> Queue
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => selectedCaptions[0] && sendToStudio(selectedCaptions[0])}
              disabled={selectedCaptions.length === 0}
              aria-label="Send first selected caption to studio"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Studio
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete selected captions"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} captions?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes them from your library. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmQueue} onOpenChange={(o) => { if (o) setQueueStartAt(defaultStart()); setConfirmQueue(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Queue {selected.size} posts?</AlertDialogTitle>
            <AlertDialogDescription>
              Match your campaign plan by setting when the first post goes out and the gap between each caption.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            <div>
              <label htmlFor="queue-start" className="text-xs font-medium text-muted-foreground mb-1 block">
                Start time
              </label>
              <Input
                id="queue-start"
                type="datetime-local"
                value={queueStartAt}
                onChange={(e) => setQueueStartAt(e.target.value)}
                aria-label="Queue start time"
              />
            </div>
            <div>
              <label htmlFor="queue-interval" className="text-xs font-medium text-muted-foreground mb-1 block">
                Interval (minutes)
              </label>
              <Input
                id="queue-interval"
                type="number"
                min={0}
                step={5}
                value={queueIntervalMin}
                onChange={(e) => setQueueIntervalMin(Number(e.target.value) || 0)}
                aria-label="Minutes between posts"
              />
            </div>
          </div>
          {selectedCaptions.length > 0 && queueStartAt && (
            <p className="text-[11px] text-muted-foreground -mt-1">
              First: {new Date(queueStartAt).toLocaleString()} · Last:{" "}
              {new Date(
                new Date(queueStartAt).getTime() +
                  (selectedCaptions.length - 1) * Math.max(0, queueIntervalMin) * 60_000,
              ).toLocaleString()}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={bulkQueue}>Queue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


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
