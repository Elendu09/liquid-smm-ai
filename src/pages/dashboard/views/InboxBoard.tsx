import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Reply, Clock, Check, RotateCcw, User, Sparkles, RefreshCw, Send, UserPlus, Inbox as InboxIcon, Archive, Megaphone, CornerDownRight, MessagesSquare, StickyNote } from "lucide-react";
import {
  ToolbarBar,
  ViewToggle,
  useViewMode,
  KanbanBoard,
  ListView,
  type KanbanColumnDef,
} from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { useInboxMessages } from "@/hooks/useInboxMessages";
import { isGuestSession } from "@/hooks/useGuest";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";
import { ReplyDialog } from "@/components/engage/ReplyDialog";
import { analyzeMessage, snippetFor, SENTIMENT_STYLE, INTENT_LABEL, type Intent, type Sentiment } from "@/hooks/useInboxAnalysis";
import { useSavedReplies } from "@/hooks/useSavedReplies";
import { EmptyState } from "@/components/shared/EmptyState";
import { RefinedInboxEmptyState } from "@/components/engage/RefinedInboxEmptyState";
import { useAccounts } from "@/contexts/AccountContext";
import { Checkbox } from "@/components/ui/checkbox";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionBar } from "@/components/shared/BulkActionBar";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InboxMediaChips } from "@/components/engage/InboxMediaChips";
import { InboxLockIndicator } from "@/components/engage/InboxLockIndicator";
import { InboxNotesDrawer, type InboxNote } from "@/components/engage/InboxNotesDrawer";
import { useInboxLock } from "@/hooks/useInboxLock";
import { useAuthUser } from "@/hooks/useAuthUser";
import { InboxSyncFooter } from "@/components/accounts/ConnectionHealthPill";
import { buildThreaded, threadIndent, ThreadHeader, type ThreadedInboxItem } from "@/components/engage/ThreadedInbox";

type InboxStatus = "new" | "replied" | "snoozed" | "resolved";

function getSlo(item: InboxItem): { overdue: boolean; label: string; tone: string } | null {
  if (item.status !== "new") return null;
  const ageMin = (Date.now() - new Date(item.createdAt).getTime()) / 60000;
  const isUrgent = item.priority === "urgent" || item.priority === "high";
  const threshold = isUrgent ? 60 : 120; // 1h for urgent/high, 2h for normal
  if (ageMin > threshold) return { overdue: true, label: `SLA ${threshold/60}h overdue`, tone: "bg-rose-500/15 text-rose-600 border-rose-500/30" };
  if (ageMin > threshold * 0.75) return { overdue: false, label: `SLA due in ${Math.max(1, Math.round(threshold - ageMin))}m`, tone: "bg-amber-500/15 text-amber-600 border-amber-500/30" };
  return null;
}

export interface InboxMedia {
  kind: "image" | "video" | "voice" | "sticker" | "carousel";
  url?: string;
  /** Human label for media that we can't render (voice, sticker, expired). */
  label?: string;
}

export interface InboxItem {
  id: string;
  author: string;
  handle: string;
  platform: string;
  message: string;
  createdAt: string;
  status: InboxStatus;
  kind: "comment" | "dm";
  scheduledFor?: string;
  /** Teammate display name this conversation is assigned to. */
  assignee?: string;
  /** AI-generated draft reply queued by an inbox automation rule. */
  aiDraft?: string;
  /** Id of the automation rule that last routed this message. */
  autoRuleId?: string;
  /** Conversation priority (set by automation rules). */
  priority?: "low" | "normal" | "high" | "urgent";
  /** Label/tag applied by an automation rule. */
  label?: string;
  /** Hidden by an automation rule (e.g. spam). */
  hidden?: boolean;
  /** True when the source is a paid / dark post (fix 1.3). */
  isAd?: boolean;
  /** Parent comment id for nested replies (fix 1.4). */
  parentId?: string;
  /** Media attached to the message (fix 1.5). */
  media?: InboxMedia[];
  /** Soft-lock for collision detection (fix 4.1). */
  lockedBy?: string | null;
  lockedUntil?: string | null;
  /** Internal notes (fix 4.4). */
  notes?: InboxNote[];
}


const columns: KanbanColumnDef<InboxStatus>[] = [
  { id: "new", label: "New", emptyLabel: "Inbox zero ✨" },
  { id: "replied", label: "Replied", emptyLabel: "Nothing replied yet" },
  { id: "snoozed", label: "Snoozed", emptyLabel: "No snoozed items" },
  { id: "resolved", label: "Resolved", emptyLabel: "Nothing resolved yet" },
];

const seed = (kind: "comment" | "dm"): InboxItem[] => {
  const now = Date.now();
  if (kind === "comment") {
    return [
      {
        id: "comment-0",
        author: "Jordan Lee", handle: "@jordan.creates", platform: "instagram",
        message: "This reel is 🔥 how did you edit it?",
        createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
        status: "new", kind,
        isAd: false,
      },
      {
        id: "comment-1",
        author: "Sam Rivera", handle: "@samr", platform: "tiktok",
        message: "Where's the sound from?",
        createdAt: new Date(now - 1000 * 60 * 25).toISOString(),
        status: "new", kind,
        isAd: true, // paid/promoted post comment
        label: "ad-comment",
        media: [{ kind: "video", label: "TikTok sound clip" }],
      },
      {
        id: "comment-2",
        author: "Priya Kapoor", handle: "@priyak", platform: "youtube",
        message: "Do a follow-up please!",
        createdAt: new Date(now - 1000 * 60 * 40).toISOString(),
        status: "new", kind,
        parentId: "comment-1", // nested reply to Sam's ad comment
        media: [{ kind: "sticker", label: "Heart sticker" }],
      },
      {
        id: "comment-3",
        author: "Alex Chen", handle: "@alexc", platform: "instagram",
        message: "Great tips 🙌",
        createdAt: new Date(now - 1000 * 60 * 55).toISOString(),
        status: "new", kind,
      },
      {
        id: "comment-4",
        author: "Riya Patel", handle: "@riyap", platform: "tiktok",
        message: "Can you make a tutorial on this transition?",
        createdAt: new Date(now - 1000 * 60 * 70).toISOString(),
        status: "new", kind,
        isAd: true,
        media: [
          { kind: "image", url: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400" },
        ],
      },
    ];
  }
  return [
    {
      id: "dm-0",
      author: "Marta Silva", handle: "@marta.design", platform: "instagram",
      message: "Hi! Are you open to collabs?",
      createdAt: new Date(now - 1000 * 60 * 8).toISOString(),
      status: "new", kind,
      media: [{ kind: "voice", label: "Voice note · 0:18" }],
    },
    {
      id: "dm-1",
      author: "Ken Fujita", handle: "@kenf", platform: "twitter",
      message: "Loved your post — quick question about pricing…",
      createdAt: new Date(now - 1000 * 60 * 18).toISOString(),
      status: "new", kind,
    },
    {
      id: "dm-2",
      author: "Rosa Bianchi", handle: "@rosab", platform: "linkedin",
      message: "Can I share this internally?",
      createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
      status: "new", kind,
      media: [{ kind: "carousel", label: "2 attachments" }],
    },
  ];
};

function InboxCard({
  item,
  variant,
  selected,
  depth = 0,
  threadSize = 1,
  onToggleSelect,
  onReply,
  onSchedule,
  onRetry,
  onApprove,
  onReopen,
  onQuickReply,
  onSavedReply,
  onOpenNotes,
  savedReplies,
}: {
  item: InboxItem;
  variant: number;
  selected?: boolean;
  depth?: number;
  threadSize?: number;
  onToggleSelect?: () => void;
  onReply: () => void;
  onSchedule: () => void;
  onRetry: () => void;
  onApprove: (text: string) => void;
  onReopen: () => void;
  onQuickReply: (text: string) => void;
  onSavedReply: (id: string, body: string) => void;
  onOpenNotes: () => void;
  savedReplies: { id: string; name: string; body: string }[];
}) {
  const { sentiment, intent } = useMemo(() => analyzeMessage(item.message), [item.message]);
  const snippet = useMemo(() => snippetFor(intent, item.author, variant), [intent, item.author, variant]);
  const { user } = useAuthUser();
  return (
    <div className={cn("p-3 space-y-2", threadIndent(depth))}>
      {depth > 0 && (
        <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          <CornerDownRight className="h-2.5 w-2.5" /> nested reply
        </div>
      )}
      {depth === 0 && threadSize > 1 && <ThreadHeader size={threadSize} />}
      <div className="flex items-start gap-2">
        {onToggleSelect && (
          <Checkbox
            checked={!!selected}
            onCheckedChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select message from ${item.author}`}
            className="mt-1"
          />
        )}
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold truncate">{item.author}</span>
            <PlatformIcon platform={item.platform} className="h-3 w-3 flex-shrink-0" />
            {item.isAd && (
              <span
                className="inline-flex items-center gap-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300"
                title="This comment is on a paid / promoted post"
              >
                <Megaphone className="h-2.5 w-2.5" /> Ad
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{item.handle}</p>
        </div>
        <InboxLockIndicator
          lockedBy={item.lockedBy}
          lockedUntil={item.lockedUntil}
          meId={user?.id ?? null}
        />
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <span className={cn("px-1.5 py-0.5 rounded-full border text-[10px] font-medium capitalize", SENTIMENT_STYLE[sentiment])}>
          {sentiment}
        </span>
        <span className="px-1.5 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] font-medium">
          {INTENT_LABEL[intent]}
        </span>
        {item.assignee && (
          <span className="px-1.5 py-0.5 rounded-full border border-border/60 bg-muted/60 text-muted-foreground text-[10px] font-medium">
            @{item.assignee}
          </span>
        )}
        {item.scheduledFor && (
          <span className="px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-medium">
            Scheduled {new Date(item.scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        {item.priority && item.priority !== "normal" && (
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider",
              item.priority === "urgent" && "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300",
              item.priority === "high" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
              item.priority === "low" && "border-slate-500/30 bg-slate-500/10 text-slate-500",
            )}
          >
            {item.priority}
          </span>
        )}
        {item.label && (
          <span className="px-1.5 py-0.5 rounded-full border border-border/60 bg-card text-muted-foreground text-[10px]">
            #{item.label}
          </span>
        )}
      </div>
      <p className="text-sm text-foreground line-clamp-3">{item.message}</p>
      <InboxMediaChips media={item.media} platform={item.platform} />
      {snippet && item.status !== "replied" && (
        <div className="rounded-md border border-dashed border-primary/30 bg-primary/5 px-2 py-1.5">
          <div className="flex items-center gap-1 text-[10px] text-primary font-medium mb-0.5">
            <Sparkles className="h-3 w-3" />
            AI suggested reply
          </div>
          <button
            type="button"
            onClick={() => onQuickReply(snippet)}
            className="text-left w-full"
            aria-label="Use AI reply"
          >
            <p className="text-[11px] text-muted-foreground line-clamp-2 hover:text-foreground transition-colors">
              {snippet}
            </p>
          </button>
        </div>
      )}
      {savedReplies.length > 0 && item.status !== "replied" && (
        <div className="flex items-center gap-1 flex-wrap">
          {savedReplies.slice(0, 3).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSavedReply(r.id, r.body)}
              className="px-1.5 py-0.5 rounded-full border border-border/60 bg-muted/50 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              title={r.body}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {(() => { const slo = getSlo(item); return slo ? <span className={`px-1.5 py-0.5 rounded-full border text-[9px] font-medium ${slo.tone}`}>{slo.label}</span> : null; })()}
        </span>
        <div className="flex items-center gap-0.5">
          {item.status !== "replied" ? (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Reply" aria-label="Reply" onClick={onReply}>
                <Reply className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Schedule reply" aria-label="Schedule" onClick={onSchedule}>
                <Clock className="h-3.5 w-3.5" />
              </Button>
              {snippet && (
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Retry AI reply" aria-label="Retry AI" onClick={onRetry}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              )}
              {snippet ? (
                <Button size="icon" className="h-7 w-7" title="Approve & send AI reply" aria-label="Approve and send" onClick={() => onApprove(snippet)}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="icon" className="h-7 w-7" title="Mark handled" aria-label="Mark handled" onClick={() => onApprove("")}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          ) : (
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Reopen" aria-label="Reopen" onClick={onReopen}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Notes" aria-label="Open notes" onClick={onOpenNotes}>
            <StickyNote className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface InboxBoardProps {
  kind: "comment" | "dm";
  title: string;
  description?: string;
  /** Triage filters driven by <InboxTriageBar/> in the unified inbox. */
  sentiment?: Sentiment | "all";
  intent?: Intent | "all";
}

export function InboxBoard({ kind, title, description, sentiment = "all", intent = "all" }: InboxBoardProps) {
  const [view, setView] = useViewMode(`engage-${kind}`, "kanban");
  const [threaded, setThreaded] = useState<"flat" | "threaded">("flat");
  const [onlyAds, setOnlyAds] = useState(false);
  const { items, setItems, update } = useInboxMessages(kind);
  const { replies: savedReplies, incrementUsage, render } = useSavedReplies();
  const { accounts } = useAccounts();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InboxStatus | "all">("all");
  const [variants, setVariants] = useState<Record<string, number>>({});
  const [replyTarget, setReplyTarget] = useState<InboxItem | null>(null);
  const [notesFor, setNotesFor] = useState<InboxItem | null>(null);
  const { members } = useTeamMembers();
  const { user } = useAuthUser();
  const lock = useInboxLock();
  const adCount = useMemo(() => items.filter((i) => i.isAd).length, [items]);
  const lastSync = useMemo(() => {
    const newest = items.reduce<string | undefined>((acc, i) => (!acc || i.createdAt > acc ? i.createdAt : acc), undefined);
    return newest;
  }, [items]);

  useEffect(() => {
    if (items.length === 0 && isGuestSession()) setItems(seed(kind));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const filtered = useMemo(() => {
    let out = items;
    if (filter !== "all") out = out.filter((i) => i.status === filter);
    if (onlyAds) out = out.filter((i) => i.isAd);
    if (search) {
      const q = search.toLowerCase();
      out = out.filter((i) => i.message.toLowerCase().includes(q) || i.author.toLowerCase().includes(q));
    }
    if (sentiment !== "all" || intent !== "all") {
      out = out.filter((i) => {
        const a = analyzeMessage(i.message);
        return (sentiment === "all" || a.sentiment === sentiment) && (intent === "all" || a.intent === intent);
      });
    }
    return out;
  }, [items, filter, search, sentiment, intent, onlyAds]);

  const threadedItems = useMemo<ThreadedInboxItem[]>(() => buildThreaded(filtered), [filtered]);

  const sel = useBulkSelection(filtered.map((i) => i.id));

  const bulkSet = (patch: Partial<InboxItem>, label: string) => {
    const ids = sel.ids;
    ids.forEach((id) => update(id, patch));
    sel.clear();
    toast.success(`${ids.length} ${ids.length === 1 ? "message" : "messages"} ${label}`);
  };

  const scheduleReply = (item: InboxItem) => {
    const mins = window.prompt(`Send reply to ${item.author} in how many minutes?`, "15");
    if (!mins) return;
    const n = Math.max(1, parseInt(mins, 10) || 15);
    const when = new Date(Date.now() + n * 60_000).toISOString();
    update(item.id, { scheduledFor: when, status: "snoozed" });
    toast.success(`Reply scheduled in ${n} min`, {
      description: new Date(when).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  };

  const claimAndReply = (item: InboxItem) => {
    lock.claim(item.id);
    setReplyTarget(item);
  };

  const openNotes = (item: InboxItem) => setNotesFor(item);

  const actions = (item: InboxItem) => ({
    onReply: () => claimAndReply(item),
    onSchedule: () => scheduleReply(item),
    onOpenNotes: () => openNotes(item),
    onRetry: () => {
      setVariants((v) => ({ ...v, [item.id]: (v[item.id] ?? 0) + 1 }));
      toast("Generated a new variation");
    },
    onApprove: (text: string) => {
      update(item.id, { status: "replied", scheduledFor: undefined, lockedBy: null, lockedUntil: null });
      toast.success(text ? `Approved & sent to ${item.author}` : `Marked handled`, {
        description: text ? text.slice(0, 80) + (text.length > 80 ? "…" : "") : undefined,
      });
    },
    onReopen: () => {
      update(item.id, { status: "new", scheduledFor: undefined });
      toast("Reopened");
    },
    onSavedReply: (id: string, body: string) => {
      const text = render(body, { name: item.author, handle: item.handle, platform: item.platform });
      incrementUsage(id);
      update(item.id, { status: "replied", scheduledFor: undefined, lockedBy: null, lockedUntil: null });
      toast.success(`Saved reply sent to ${item.author}`, { description: text.slice(0, 80) + (text.length > 80 ? "…" : "") });
    },
    onQuickReply: (text: string) => {
      update(item.id, { status: "replied", scheduledFor: undefined, lockedBy: null, lockedUntil: null });
      toast.success(`AI reply sent to ${item.author}`, { description: text.slice(0, 80) + (text.length > 80 ? "…" : "") });
    },
  });

  const filterChips: [InboxStatus | "all", string][] = [
    ["all", "All"],
    ["new", "New"],
    ["replied", "Replied"],
    ["snoozed", "Snoozed"],
    ["resolved", "Resolved"],
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        <InboxSyncFooter lastSync={lastSync ?? new Date().toISOString()} />
      </div>
      <ToolbarBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${title.toLowerCase()}…`}
        viewToggle={
          <div className="flex items-center gap-1.5">
            <div className="hidden items-center gap-0.5 rounded-lg border border-border/60 bg-card p-0.5 sm:flex">
              <button
                type="button"
                onClick={() => setThreaded("flat")}
                aria-pressed={threaded === "flat"}
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-md text-muted-foreground",
                  threaded === "flat" && "bg-muted text-foreground",
                )}
                title="Flat view"
              >
                <InboxIcon className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setThreaded("threaded")}
                aria-pressed={threaded === "threaded"}
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-md text-muted-foreground",
                  threaded === "threaded" && "bg-muted text-foreground",
                )}
                title="Threaded view"
              >
                <MessagesSquare className="h-3 w-3" />
              </button>
            </div>
            <ViewToggle value={view} onChange={setView} />
          </div>
        }
        filters={
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filters">
            {kind === "comment" && (
              <button
                onClick={() => setOnlyAds((v) => !v)}
                aria-pressed={onlyAds}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors min-h-8",
                  onlyAds
                    ? "bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30"
                    : "bg-muted/60 text-muted-foreground border border-transparent hover:text-foreground",
                )}
                title="Only show comments on paid / promoted posts"
              >
                <Megaphone className="h-3 w-3" /> Ad comments{adCount > 0 && <span className="ml-1 rounded-full bg-background/40 px-1 text-[9px]">{adCount}</span>}
              </button>
            )}
            {filterChips.map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                aria-pressed={filter === val}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-8 border",
                  filter === val
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/60 text-muted-foreground border-transparent hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {items.length === 0 && !isGuestSession() ? (
        <RefinedInboxEmptyState />

      ) : view === "kanban" ? (
        <KanbanBoard
          columns={columns}
          items={threaded === "threaded" ? threadedItems : filtered}
          getKey={(i) => i.id}
          getStatus={(i) => i.status}
          onMove={(item, _from, to) => {
            update(item.id, { status: to });
            toast.success(`Moved to ${to}`);
          }}
          renderItem={(i) => {
            const ti = i as ThreadedInboxItem;
            return (
              <InboxCard
                item={i}
                variant={variants[i.id] ?? 0}
                depth={threaded === "threaded" ? ti.depth : 0}
                threadSize={threaded === "threaded" ? ti.threadSize : 1}
                savedReplies={savedReplies}
                selected={sel.isSelected(i.id)}
                onToggleSelect={() => sel.toggle(i.id)}
                {...actions(i)}
              />
            );
          }}
        />
      ) : (
        <ListView
          items={threaded === "threaded" ? threadedItems : filtered}
          getKey={(i) => i.id}
          emptyLabel="No conversations match your filters."
          renderItem={(i) => {
            const ti = i as ThreadedInboxItem;
            return (
              <div className="p-4">
                <InboxCard
                  item={i}
                  variant={variants[i.id] ?? 0}
                  depth={threaded === "threaded" ? ti.depth : 0}
                  threadSize={threaded === "threaded" ? ti.threadSize : 1}
                  savedReplies={savedReplies}
                  selected={sel.isSelected(i.id)}
                  onToggleSelect={() => sel.toggle(i.id)}
                  {...actions(i)}
                />
              </div>
            );
          }}
        />
      )}

      <BulkActionBar
        count={sel.count}
        onClear={sel.clear}
        label={sel.count === 1 ? "message" : "messages"}
        actions={[
          { id: "handled", label: "Mark handled", icon: Check, variant: "default", onClick: () => bulkSet({ status: "resolved", scheduledFor: undefined }, "marked handled") },
          { id: "replied", label: "Move to replied", icon: Reply, onClick: () => bulkSet({ status: "replied", scheduledFor: undefined }, "moved to Replied") },
          { id: "snoozed", label: "Snooze", icon: Clock, onClick: () => bulkSet({ status: "snoozed" }, "snoozed") },
          { id: "reopen", label: "Reopen", icon: InboxIcon, onClick: () => bulkSet({ status: "new", scheduledFor: undefined }, "reopened") },
        ]}
      />

      {sel.count > 0 && (
        <div className="pointer-events-auto fixed inset-x-0 bottom-40 z-40 mx-auto flex w-fit md:bottom-24">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="secondary" className="h-8 rounded-full px-3 text-xs shadow-xl">
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Assign {sel.count}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-52">
              <DropdownMenuLabel className="text-xs">Assign to teammate</DropdownMenuLabel>
              {members.length === 0 && (
                <DropdownMenuItem disabled className="text-xs">No teammates yet</DropdownMenuItem>
              )}
              {members.map((m) => (
                <DropdownMenuItem key={m.id} className="text-xs" onClick={() => bulkSet({ assignee: m.name }, `assigned to ${m.name}`)}>
                  {m.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem className="text-xs" onClick={() => bulkSet({ assignee: undefined }, "unassigned")}>
                <Archive className="mr-1.5 h-3.5 w-3.5" /> Clear assignment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <ReplyDialog
        open={!!replyTarget}
        onOpenChange={(o) => {
          if (!o && replyTarget) lock.release(replyTarget.id);
          if (!o) setReplyTarget(null);
        }}
        comment={replyTarget ? { id: replyTarget.id, user: replyTarget.author, content: replyTarget.message, platform: replyTarget.platform } : null}
        onSend={(text) => {
          if (!replyTarget) return;
          update(replyTarget.id, { status: "replied", scheduledFor: undefined, lockedBy: null, lockedUntil: null });
          lock.release(replyTarget.id);
          toast.success(`Reply sent to ${replyTarget.author}`, {
            description: text.slice(0, 80) + (text.length > 80 ? "…" : ""),
          });
        }}
      />

      <InboxNotesDrawer
        item={notesFor}
        open={!!notesFor}
        onClose={() => setNotesFor(null)}
      />
    </div>
  );
}
