import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Trash2, Plus, Copy, CalendarPlus, Target } from "lucide-react";
import {
  ToolbarBar,
  ViewToggle,
  useViewMode,
  KanbanBoard,
  ListView,
  type KanbanColumnDef,
} from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
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
import { MediaThumb } from "@/components/shared/MediaThumb";
import { useAccounts } from "@/contexts/AccountContext";
import { PostPreviewCard } from "@/components/create/PostPreviewCard";
import {
  NewDraftDialog,
  type NewDraftScheduleExtras,
  type StudioDraft,
} from "@/components/create/NewDraftDialog";
import { AiRepurposeDialog } from "@/components/create/AiRepurposeDialog";
import { Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { isGuestSession } from "@/hooks/useGuest";


type DraftStatus = StudioDraft["status"];
type Draft = StudioDraft;

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
    // Test image so card image previews are visible immediately in demo mode.
    mediaUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&q=80",
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

  // "Send to Studio" prefill dropped by AI intents via sessionStorage.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("smmpilot:create-studio:prefill");
      if (!raw) return;
      window.sessionStorage.removeItem("smmpilot:create-studio:prefill");
      const pl = JSON.parse(raw) as {
        title?: string;
        body?: string;
        hashtags?: string[];
        platformIds?: string[];
      };
      const body =
        (pl.hashtags?.length ?? 0) > 0
          ? `${pl.body ?? ""}\n\n${(pl.hashtags ?? []).map((h) => `#${h}`).join(" ")}`
          : (pl.body ?? "");
      const draft: Draft = {
        id: crypto.randomUUID(),
        title: pl.title || "AI draft",
        status: "draft",
        caption: body,
        platform: pl.platformIds?.[0] ?? "instagram",
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [draft, ...prev]);
      toast.success("Loaded AI draft into Studio");
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Draft | null>(null);
  const [repurposeOpen, setRepurposeOpen] = useState(false);
  const [previewing, setPreviewing] = useState<Draft | null>(null);

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
    if (drafts.length === 0 && isGuestSession()) setItems(seed);
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
    // Fresh working copy — only persisted when the user hits "Create draft".
    setEditing({
      id: crypto.randomUUID(),
      title: "",
      status: "draft",
      caption: "",
      platform: accounts[0]?.platformId ?? "instagram",
      createdAt: new Date().toISOString(),
    });
  };

  const isEditingExisting = !!editing && drafts.some((d) => d.id === editing.id);

  const saveDraft = () => {
    if (!editing) return;
    const finalDraft = { ...editing, title: editing.title.trim() || "Untitled draft" };
    if (drafts.some((d) => d.id === finalDraft.id)) {
      update(finalDraft.id, finalDraft);
      toast.success("Draft saved");
    } else {
      add(finalDraft);
      toast.success("Draft added to studio");
      setEditing(null);
    }
  };

  const scheduleDraft = (extras: NewDraftScheduleExtras) => {
    if (!editing || !extras.scheduleAt) return;
    const when = new Date(extras.scheduleAt).toISOString();
    addScheduled(
      {
        caption: editing.caption,
        mediaUrl: editing.mediaUrl,
        scheduledAt: when,
        platformIds: extras.platformIds.length ? extras.platformIds : [editing.platform],
        firstComment: extras.firstComment,
        categoryId: extras.categoryId,
      },
      { recurrence: extras.recurrence },
    );
    const finalDraft: Draft = {
      ...editing,
      title: editing.title.trim() || "Untitled draft",
      status: "scheduled",
      scheduledAt: when,
      platform: extras.platformIds[0] ?? editing.platform,
    };
    if (drafts.some((d) => d.id === finalDraft.id)) update(finalDraft.id, finalDraft);
    else add(finalDraft);
    toast.success(
      extras.recurrence
        ? `Queued ${extras.recurrence.count} recurring posts`
        : "Scheduled — check the Publish queue",
    );
    setEditing(null);
  };

  const patchEditing = (patch: Partial<Draft>) =>
    setEditing((prev) => (prev ? { ...prev, ...patch } : prev));


  const card = (d: Draft, dense = false) => (
    <div
      className={cn(dense ? "p-3" : "p-3", "cursor-pointer group")}
      onClick={() => setPreviewing(d)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") setPreviewing(d); }}
    >
      <div className="flex items-start gap-2">
        <PlatformIcon platform={d.platform} size="xs" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{d.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {d.caption || "No caption yet"}
          </p>
        </div>
      </div>
      {d.mediaUrl && (
        <MediaThumb
          url={d.mediaUrl}
          alt="Draft media preview"
          onPlay={(url) => window.open(url, "_blank", "noopener")}
          className="mt-2 h-28 w-full rounded-lg border border-border/40 transition-transform duration-300 group-hover:scale-[1.02]"
        />
      )}
      {d.scheduledAt && (
        <p className="text-[11px] text-muted-foreground mt-2">
          {new Date(d.scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
      <div className="flex justify-end gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing({ ...d })}>
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
            <Button size="sm" variant="outline" onClick={() => setRepurposeOpen(true)}>
              <Shuffle className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Repurpose 5×</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/dashboard/campaigns?builder=1")}
            >
              <Target className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Plan a campaign</span>
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

      <NewDraftDialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
        draft={editing}
        isEdit={isEditingExisting}
        onChange={patchEditing}
        onCreate={saveDraft}
        onSchedule={scheduleDraft}
      />

      <AiRepurposeDialog open={repurposeOpen} onOpenChange={setRepurposeOpen} initialCaption={editing?.caption ?? ""} />

      {previewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewing(null)}
        >
          <div
            className="w-full max-w-md flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Preview · {previewing.platform}</span>
              <div className="flex gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => { setEditing({ ...previewing }); setPreviewing(null); }}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPreviewing(null)}>Close</Button>
              </div>
            </div>
            <PostPreviewCard
              caption={previewing.caption}
              mediaUrl={previewing.mediaUrl}
              handle={accounts.find((a) => a.platformId === previewing.platform)?.username ?? "yourbrand"}
            />
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{confirmDelete?.title}&rdquo; will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) {
                  remove(confirmDelete.id);
                  toast.success("Draft deleted");
                }
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  );
}
