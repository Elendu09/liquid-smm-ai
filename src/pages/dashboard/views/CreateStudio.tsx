import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Send, Save, Trash2, Plus, Image as ImageIcon, Heart, MessageCircle, Share2, Copy, CalendarPlus, Sparkles } from "lucide-react";
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
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { useLocalCollection } from "@/hooks/useLocalCollection";
import { useMcpInbox } from "@/hooks/useMcpInbox";
import { logMcpCall } from "@/hooks/useMcpActivity";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { useAccounts } from "@/contexts/AccountContext";
import { NewPostDialog } from "@/components/create/NewPostDialog";
import { cn } from "@/lib/utils";


type DraftStatus = "draft" | "review" | "scheduled";

interface Draft {
  id: string;
  title: string;
  status: DraftStatus;
  caption: string;
  platform: string;
  mediaUrl?: string;
  scheduledAt?: string;
  createdAt: string;
}

const columns: KanbanColumnDef<DraftStatus>[] = [
  { id: "draft", label: "Draft" },
  { id: "review", label: "In review" },
  { id: "scheduled", label: "Scheduled" },
];

const seed: Draft[] = [
  {
    id: "d1",
    title: "Launch teaser",
    status: "draft",
    caption: "Something big is coming next week 👀 #stayTuned",
    platform: "instagram",
    createdAt: new Date().toISOString(),
  },
  {
    id: "d2",
    title: "Product tips carousel",
    status: "review",
    caption: "5 things you didn't know about our latest feature 🧵",
    platform: "twitter",
    createdAt: new Date().toISOString(),
  },
];

function InstagramPreview({ draft, handle }: { draft: Draft; handle: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm max-w-sm mx-auto">
      <header className="flex items-center gap-2 p-3 border-b border-border/60">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{handle}</p>
          <p className="text-[10px] text-muted-foreground">Sponsored</p>
        </div>
        <PlatformIcon platform={draft.platform} size="xs" />
      </header>
      <div className="aspect-square bg-muted flex items-center justify-center">
        {draft.mediaUrl ? (
          <img src={draft.mediaUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-10 h-10 text-muted-foreground" />
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-3 text-foreground/80">
          <Heart className="h-5 w-5" />
          <MessageCircle className="h-5 w-5" />
          <Share2 className="h-5 w-5" />
        </div>
        <p className="text-xs leading-relaxed whitespace-pre-wrap">
          <span className="font-semibold">{handle}</span>{" "}
          {draft.caption || "Your caption will appear here…"}
        </p>
      </div>
    </div>
  );
}

export default function CreateStudio() {
  const [view, setView] = useViewMode("create-studio", "kanban");
  const { items: drafts, setItems, add, update, remove } = useLocalCollection<Draft>("create", "drafts");
  const { add: addScheduled } = useScheduledPosts();
  const { accounts } = useAccounts();
  const { drain } = useMcpInbox();

  // Drain any caption drafts queued by MCP tool calls into the Studio.
  useEffect(() => {
    const pending = drain("caption-draft");
    if (pending.length === 0) return;
    const now = new Date().toISOString();
    const created: Draft[] = pending.map((p) => {
      const pl = p.payload as {
        title?: string;
        body?: string;
        hashtags?: string[];
        platformIds?: string[];
      };
      const body =
        (pl.hashtags?.length ?? 0) > 0
          ? `${pl.body ?? ""}\n\n${(pl.hashtags ?? []).map((h) => `#${h}`).join(" ")}`
          : (pl.body ?? "");
      return {
        id: crypto.randomUUID(),
        title: pl.title ?? "MCP draft",
        status: "draft",
        caption: body,
        platform: pl.platformIds?.[0] ?? accounts[0]?.platformId ?? "instagram",
        createdAt: now,
      };
    });
    setItems((prev) => [...created, ...prev]);
    toast.success(`Loaded ${created.length} MCP draft${created.length > 1 ? "s" : ""} into studio`);
    logMcpCall({
      tool: "create_caption_draft",
      status: "success",
      summary: `Applied ${created.length} MCP draft(s) into Studio`,
      resources: created.map((d) => ({ kind: "caption", id: d.id, label: d.title })),
      payload: { count: created.length },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Draft | null>(null);
  const [newPostOpen, setNewPostOpen] = useState(false);

  const duplicateDraft = (d: Draft) => {
    const copy: Draft = {
      ...d,
      id: crypto.randomUUID(),
      title: `${d.title} (copy)`,
      status: "draft",
      scheduledAt: undefined,
      createdAt: new Date().toISOString(),
    };
    add(copy);
    toast.success("Duplicated");
  };

  const sendToQueue = (d: Draft) => {
    if (!d.caption.trim()) {
      toast.error("Draft has no caption");
      return;
    }
    const when = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    addScheduled({
      caption: d.caption,
      mediaUrl: d.mediaUrl,
      scheduledAt: when,
      platformIds: [d.platform],
    });
    update(d.id, { status: "scheduled", scheduledAt: when });
    toast.success("Sent to queue (in 1h)");
  };


  useMemo(() => {
    if (drafts.length === 0) setItems(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill from ?draftId=<captionId> — pulls a caption from the Library
  useEffect(() => {
    const draftId = searchParams.get("draftId");
    if (!draftId) return;
    try {
      const raw = window.localStorage.getItem("smmpilot:library:captions");
      if (!raw) return;
      const captions = JSON.parse(raw) as Array<{
        id: string;
        title: string;
        body: string;
        hashtags: string[];
        platformIds: string[];
      }>;
      const cap = captions.find((c) => c.id === draftId);
      if (!cap) return;
      const body =
        cap.hashtags.length > 0
          ? `${cap.body}\n\n${cap.hashtags.map((h) => `#${h}`).join(" ")}`
          : cap.body;
      const newDraft: Draft = {
        id: crypto.randomUUID(),
        title: cap.title,
        status: "draft",
        caption: body,
        platform: cap.platformIds[0] ?? accounts[0]?.platformId ?? "instagram",
        createdAt: new Date().toISOString(),
      };
      add(newDraft);
      setEditing(newDraft);
      toast.success("Caption loaded into studio");
      const next = new URLSearchParams(searchParams);
      next.delete("draftId");
      setSearchParams(next, { replace: true });
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(
    () =>
      drafts.filter((d) =>
        !search ? true : (d.title + d.caption).toLowerCase().includes(search.toLowerCase()),
      ),
    [drafts, search],
  );

  const startNew = () => {
    const d: Draft = {
      id: crypto.randomUUID(),
      title: "Untitled draft",
      status: "draft",
      caption: "",
      platform: accounts[0]?.platformId ?? "instagram",
      createdAt: new Date().toISOString(),
    };
    add(d);
    setEditing(d);
  };

  const saveDraft = () => {
    if (!editing) return;
    update(editing.id, editing);
    toast.success("Draft saved");
  };

  const scheduleDraft = () => {
    if (!editing || !scheduleAt) return;
    addScheduled({
      caption: editing.caption,
      mediaUrl: editing.mediaUrl,
      scheduledAt: new Date(scheduleAt).toISOString(),
      platformIds: [editing.platform],
    });
    update(editing.id, { status: "scheduled", scheduledAt: new Date(scheduleAt).toISOString() });
    toast.success("Scheduled — check the Publish queue");
    setScheduleAt("");
    setEditing(null);
  };

  const handle = accounts.find((a) => a.platformId === editing?.platform)?.username ?? "yourbrand";

  const card = (d: Draft, dense = false) => (
    <div className={cn(dense ? "p-3" : "p-3")}>
      <div className="flex items-start gap-2">
        <PlatformIcon platform={d.platform} size="xs" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{d.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {d.caption || "No caption yet"}
          </p>
        </div>
      </div>
      {d.scheduledAt && (
        <p className="text-[11px] text-muted-foreground mt-2">
          {new Date(d.scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
      <div className="flex justify-end gap-1 mt-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(d)}>
          Open
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Duplicate draft"
          onClick={() => duplicateDraft(d)}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-primary hover:text-primary"
          aria-label="Send to queue"
          onClick={() => sendToQueue(d)}
        >
          <CalendarPlus className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          aria-label="Delete draft"
          onClick={() => setConfirmDelete(d)}
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
        searchPlaceholder="Search drafts…"
        viewToggle={<ViewToggle value={view} onChange={setView} />}
        actions={
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setNewPostOpen(true)}>
              <Sparkles className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">AI post</span>
            </Button>
            <Button size="sm" onClick={startNew}>
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">New draft</span>
            </Button>
          </div>
        }

      />

      {view === "kanban" ? (
        <KanbanBoard
          columns={columns}
          items={filtered}
          getKey={(d) => d.id}
          getStatus={(d) => d.status}
          onMove={(item, _from, to) => { update(item.id, { status: to }); toast.success(`Moved to ${to}`); }}
          renderItem={(d) => card(d)}
        />
      ) : (
        <ListView items={filtered} getKey={(d) => d.id} renderItem={(d) => card(d, true)} />
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-background/85 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-4xl sm:rounded-2xl border border-border bg-card shadow-xl flex flex-col sm:max-h-[90vh]">
            <header className="flex items-center gap-2 p-4 border-b border-border/60 flex-shrink-0">
              <Input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="border-0 shadow-none text-lg font-semibold h-auto p-0 focus-visible:ring-0"
                aria-label="Draft title"
              />
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)} aria-label="Close editor">
                Close
              </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Platform</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {["instagram", "twitter", "tiktok", "linkedin", "facebook"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setEditing({ ...editing, platform: p })}
                        aria-pressed={editing.platform === p}
                        aria-label={`Preview as ${p}`}
                        className={cn(
                          "p-2 rounded-lg border transition-colors min-h-9 min-w-9",
                          editing.platform === p
                            ? "border-primary bg-primary/10"
                            : "border-border/60 hover:bg-muted",
                        )}
                      >
                        <PlatformIcon platform={p} size="xs" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Caption</label>
                  <Textarea
                    value={editing.caption}
                    onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
                    placeholder="Write your caption…"
                    rows={6}
                    aria-label="Caption"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Media URL (optional)</label>
                  <Input
                    value={editing.mediaUrl ?? ""}
                    onChange={(e) => setEditing({ ...editing, mediaUrl: e.target.value })}
                    placeholder="https://…"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Schedule for</label>
                  <Input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    aria-label="Schedule datetime"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
                <InstagramPreview draft={editing} handle={handle} />
              </div>
            </div>

            <footer className="flex flex-wrap items-center justify-end gap-2 p-4 border-t border-border/60 flex-shrink-0">
              <Button variant="outline" onClick={saveDraft}>
                <Save className="h-4 w-4 mr-1" />
                Save draft
              </Button>
              <Button onClick={scheduleDraft} disabled={!scheduleAt || !editing.caption}>
                <Send className="h-4 w-4 mr-1" />
                Schedule
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
