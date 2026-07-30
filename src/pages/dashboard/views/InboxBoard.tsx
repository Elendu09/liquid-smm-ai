import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Reply, Clock, Check, RotateCcw, User, Sparkles, RefreshCw, Send } from "lucide-react";
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
import { useAccounts } from "@/contexts/AccountContext";

type InboxStatus = "new" | "replied" | "snoozed" | "resolved";

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
}

const columns: KanbanColumnDef<InboxStatus>[] = [
  { id: "new", label: "New", emptyLabel: "Inbox zero ✨" },
  { id: "replied", label: "Replied", emptyLabel: "Nothing replied yet" },
  { id: "snoozed", label: "Snoozed", emptyLabel: "No snoozed items" },
  { id: "resolved", label: "Resolved", emptyLabel: "Nothing resolved yet" },
];

const seed = (kind: "comment" | "dm"): InboxItem[] => {
  const now = Date.now();
  const base = kind === "comment"
    ? [
        { author: "Jordan Lee", handle: "@jordan.creates", platform: "instagram", message: "This reel is 🔥 how did you edit it?" },
        { author: "Sam Rivera", handle: "@samr", platform: "tiktok", message: "Where's the sound from?" },
        { author: "Priya Kapoor", handle: "@priyak", platform: "youtube", message: "Do a follow-up please!" },
        { author: "Alex Chen", handle: "@alexc", platform: "instagram", message: "Great tips 🙌" },
      ]
    : [
        { author: "Marta Silva", handle: "@marta.design", platform: "instagram", message: "Hi! Are you open to collabs?" },
        { author: "Ken Fujita", handle: "@kenf", platform: "twitter", message: "Loved your post — quick question…" },
        { author: "Rosa Bianchi", handle: "@rosab", platform: "linkedin", message: "Can I share this internally?" },
      ];
  return base.map((b, i) => ({
    id: `${kind}-${i}`,
    ...b,
    createdAt: new Date(now - i * 3600_000).toISOString(),
    status: "new" as InboxStatus,
    kind,
  }));
};

function InboxCard({
  item,
  variant,
  onReply,
  onSchedule,
  onRetry,
  onApprove,
  onReopen,
  onQuickReply,
  onSavedReply,
  savedReplies,
}: {
  item: InboxItem;
  variant: number;
  onReply: () => void;
  onSchedule: () => void;
  onRetry: () => void;
  onApprove: (text: string) => void;
  onReopen: () => void;
  onQuickReply: (text: string) => void;
  onSavedReply: (id: string, body: string) => void;
  savedReplies: { id: string; name: string; body: string }[];
}) {
  const { sentiment, intent } = useMemo(() => analyzeMessage(item.message), [item.message]);
  const snippet = useMemo(() => snippetFor(intent, item.author, variant), [intent, item.author, variant]);
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold truncate">{item.author}</span>
            <PlatformIcon platform={item.platform} className="h-3 w-3 flex-shrink-0" />
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{item.handle}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <span className={cn("px-1.5 py-0.5 rounded-full border text-[10px] font-medium capitalize", SENTIMENT_STYLE[sentiment])}>
          {sentiment}
        </span>
        <span className="px-1.5 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] font-medium">
          {INTENT_LABEL[intent]}
        </span>
        {item.scheduledFor && (
          <span className="px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-medium">
            Scheduled {new Date(item.scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
      <p className="text-sm text-foreground line-clamp-3">{item.message}</p>
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
        <span className="text-[10px] text-muted-foreground">
          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
  const { items, setItems, update } = useInboxMessages(kind);
  const { replies: savedReplies, incrementUsage, render } = useSavedReplies();
  const { accounts } = useAccounts();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InboxStatus | "all">("all");
  const [variants, setVariants] = useState<Record<string, number>>({});
  const [replyTarget, setReplyTarget] = useState<InboxItem | null>(null);

  useEffect(() => {
    if (items.length === 0 && isGuestSession()) setItems(seed(kind));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const filtered = useMemo(() => {
    let out = items;
    if (filter !== "all") out = out.filter((i) => i.status === filter);
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
  }, [items, filter, search, sentiment, intent]);

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

  const actions = (item: InboxItem) => ({
    onReply: () => setReplyTarget(item),
    onSchedule: () => scheduleReply(item),
    onRetry: () => {
      setVariants((v) => ({ ...v, [item.id]: (v[item.id] ?? 0) + 1 }));
      toast("Generated a new variation");
    },
    onApprove: (text: string) => {
      update(item.id, { status: "replied", scheduledFor: undefined });
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
      update(item.id, { status: "replied", scheduledFor: undefined });
      toast.success(`Saved reply sent to ${item.author}`, { description: text.slice(0, 80) + (text.length > 80 ? "…" : "") });
    },
    onQuickReply: (text: string) => {
      update(item.id, { status: "replied", scheduledFor: undefined });
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
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <ToolbarBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${title.toLowerCase()}…`}
        viewToggle={<ViewToggle value={view} onChange={setView} />}
        filters={
          <div className="flex gap-1 overflow-x-auto" role="group" aria-label="Filter by status">
            {filterChips.map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                aria-pressed={filter === val}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-8",
                  filter === val
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {items.length === 0 && !isGuestSession() ? (
        accounts.length === 0 ? (
          <EmptyState variant="connect-account" description={`Connect an account to receive ${kind === "comment" ? "comments" : "direct messages"} in your inbox.`} />
        ) : (
          <EmptyState
            variant="create-first"
            title={kind === "comment" ? "No comments yet" : "No messages yet"}
            description={kind === "comment"
              ? "New comments across your connected channels will appear here in real time."
              : "New DMs across your connected channels will appear here in real time."}
            ctaLabel="Refresh"
            onCta={() => toast("Waiting for new activity…")}
          />
        )
      ) : view === "kanban" ? (
        <KanbanBoard
          columns={columns}
          items={filtered}
          getKey={(i) => i.id}
          getStatus={(i) => i.status}
          onMove={(item, _from, to) => {
            update(item.id, { status: to });
            toast.success(`Moved to ${to}`);
          }}
          renderItem={(i) => <InboxCard item={i} variant={variants[i.id] ?? 0} savedReplies={savedReplies} {...actions(i)} />}
        />
      ) : (
        <ListView
          items={filtered}
          getKey={(i) => i.id}
          emptyLabel="No conversations match your filters."
          renderItem={(i) => (
            <div className="p-4">
              <InboxCard item={i} variant={variants[i.id] ?? 0} savedReplies={savedReplies} {...actions(i)} />
            </div>
          )}
        />
      )}

      <ReplyDialog
        open={!!replyTarget}
        onOpenChange={(o) => !o && setReplyTarget(null)}
        comment={replyTarget ? { id: 0, user: replyTarget.author, content: replyTarget.message } : null}
        onSend={(text) => {
          if (!replyTarget) return;
          update(replyTarget.id, { status: "replied", scheduledFor: undefined });
          toast.success(`Reply sent to ${replyTarget.author}`, {
            description: text.slice(0, 80) + (text.length > 80 ? "…" : ""),
          });
        }}
      />
    </div>
  );
}
