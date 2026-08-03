import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Clock,
  Inbox as InboxIcon,
  Keyboard,
  MessageCircle,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  ThumbsUp,
  User,
  UserPlus,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { useInboxMessages } from "@/hooks/useInboxMessages";
import { useSavedReplies } from "@/hooks/useSavedReplies";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAccounts } from "@/contexts/AccountContext";
import { useQuickAi } from "@/hooks/useQuickAi";
import {
  analyzeMessage,
  snippetFor,
  SENTIMENT_STYLE,
  INTENT_LABEL,
  type Intent,
  type Sentiment,
} from "@/hooks/useInboxAnalysis";
import { ageLabel, capabilitiesFor, slaTier } from "@/config/inboxChannels";
import type { InboxItem } from "@/pages/dashboard/views/InboxBoard";

type Kind = "comment" | "dm";
type Bucket = "needs" | "waiting" | "done";

const BUCKET_OF: Record<InboxItem["status"], Bucket> = {
  new: "needs",
  snoozed: "waiting",
  replied: "done",
  resolved: "done",
};

const BUCKET_LABEL: Record<Bucket, string> = {
  needs: "Needs reply",
  waiting: "Waiting",
  done: "Done",
};

const SLA_STYLE = {
  ok: "text-muted-foreground",
  warn: "text-amber-500",
  breach: "text-rose-500",
} as const;

interface Props {
  sentiment?: Sentiment | "all";
  intent?: Intent | "all";
}

/**
 * Three-pane inbox console: channel rail → conversation list → thread.
 * Replaces the generic kanban as the default triage surface and stays
 * capability-aware so each network only offers actions it supports.
 */
export function InboxConsole({ sentiment = "all", intent = "all" }: Props) {
  const comments = useInboxMessages("comment");
  const dms = useInboxMessages("dm");
  const { accounts } = useAccounts();
  const { replies: savedReplies, incrementUsage, render } = useSavedReplies();
  const { members } = useTeamMembers();

  const [channel, setChannel] = useState<string>("all"); // "all" | platform id
  const [kindFilter, setKindFilter] = useState<Kind | "all">("all");
  const [bucket, setBucket] = useState<Bucket | "all">("all");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const quickAi = useQuickAi();
  const replyBoxRef = useRef<HTMLTextAreaElement | null>(null);

  const all = useMemo<InboxItem[]>(
    () =>
      [...comments.items, ...dms.items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [comments.items, dms.items],
  );

  const platformCounts = useMemo(() => {
    const map = new Map<string, number>();
    all.forEach((i) => {
      if (i.status !== "new") return;
      map.set(i.platform, (map.get(i.platform) ?? 0) + 1);
    });
    return map;
  }, [all]);

  const channels = useMemo(() => {
    const ids = new Set<string>(accounts.map((a) => a.platformId));
    all.forEach((i) => ids.add(i.platform));
    return Array.from(ids);
  }, [accounts, all]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((i) => {
      if (channel !== "all" && i.platform !== channel) return false;
      if (kindFilter !== "all" && i.kind !== kindFilter) return false;
      if (bucket !== "all" && BUCKET_OF[i.status] !== bucket) return false;
      if (q && !(`${i.author} ${i.handle} ${i.message}`.toLowerCase().includes(q))) return false;
      if (sentiment !== "all" || intent !== "all") {
        const a = analyzeMessage(i.message);
        if (sentiment !== "all" && a.sentiment !== sentiment) return false;
        if (intent !== "all" && a.intent !== intent) return false;
      }
      return true;
    });
  }, [all, channel, kindFilter, bucket, search, sentiment, intent]);

  const grouped = useMemo(() => {
    const out: Record<Bucket, InboxItem[]> = { needs: [], waiting: [], done: [] };
    filtered.forEach((i) => out[BUCKET_OF[i.status]].push(i));
    return out;
  }, [filtered]);

  const active = useMemo(() => all.find((i) => i.id === activeId) ?? null, [all, activeId]);
  const activeIndex = useMemo(() => filtered.findIndex((i) => i.id === activeId), [filtered, activeId]);

  // Keep a valid selection as filters change (desktop only).
  useEffect(() => {
    if (activeId && filtered.some((i) => i.id === activeId)) return;
    setActiveId(filtered[0]?.id ?? null);
  }, [filtered, activeId]);

  /** Advance to the next "needs reply" item, or just the next row, after an action. */
  const advance = (fromId: string) => {
    const idx = filtered.findIndex((i) => i.id === fromId);
    if (idx === -1) return;
    const rest = filtered.filter((i) => i.id !== fromId);
    const nextNeedsReply = rest.find((i) => BUCKET_OF[i.status] === "needs");
    const fallback = rest[Math.min(idx, rest.length - 1)];
    setActiveId((nextNeedsReply ?? fallback)?.id ?? null);
  };

  const moveSelection = (dir: 1 | -1) => {
    if (filtered.length === 0) return;
    const idx = activeIndex === -1 ? 0 : activeIndex;
    const next = filtered[(idx + dir + filtered.length) % filtered.length];
    if (next) setActiveId(next.id);
  };

  const snooze = (item: InboxItem, minutes: number) => {
    const when = new Date(Date.now() + minutes * 60_000).toISOString();
    patch(item, { status: "snoozed", scheduledFor: when });
    toast(`Snoozed for ${minutes < 60 ? `${minutes}m` : minutes < 1440 ? `${Math.round(minutes / 60)}h` : "tomorrow"}`);
    advance(item.id);
  };

  useEffect(() => {
    if (!active) { setDraft(""); return; }
    const { intent: it } = analyzeMessage(active.message);
    setDraft(active.aiDraft ?? snippetFor(it, active.author));
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const store = (item: InboxItem) => (item.kind === "comment" ? comments : dms);

  const patch = (item: InboxItem, p: Partial<InboxItem>) => store(item).update(item.id, p);

  const openItem = (item: InboxItem) => {
    setActiveId(item.id);
    setMobileOpen(true);
  };

  const send = () => {
    if (!active || !draft.trim()) return;
    patch(active, { status: "replied", scheduledFor: undefined });
    toast.success(`Reply sent to ${active.author}`, { description: draft.slice(0, 80) });
    setMobileOpen(false);
    advance(active.id);
  };

  // Keyboard triage: j/k move selection, r focuses the reply box, e marks
  // handled and advances, a opens the assign menu. Ignored while typing.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement | null)?.isContentEditable;
      if (typing) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "j":
          e.preventDefault();
          moveSelection(1);
          break;
        case "k":
          e.preventDefault();
          moveSelection(-1);
          break;
        case "r":
          if (active) { e.preventDefault(); setMobileOpen(true); replyBoxRef.current?.focus(); }
          break;
        case "e":
          if (active) { e.preventDefault(); patch(active, { status: "resolved" }); toast.success("Marked handled"); advance(active.id); }
          break;
        case "a":
          if (active && members.length) { e.preventDefault(); patch(active, { assignee: members[0].name }); toast.success(`Assigned to ${members[0].name}`); }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, filtered, members]); // eslint-disable-line react-hooks/exhaustive-deps

  const runQuickAi = async (task: "rephrase" | "shorten" | "friendly" | "translate") => {
    const base = draft.trim() || active?.message || "";
    if (!base) return;
    const out = await quickAi.run(
      task,
      base,
      task === "translate" ? "Translate into the same language the customer used." : undefined,
    );
    if (out) {
      setDraft(out);
      toast.success("Updated with free AI", { description: "Zero-login mode — no credits used." });
    } else {
      toast.error("Free AI is unreachable right now. Your text is unchanged.");
    }
  };

  const caps = active ? capabilitiesFor(active.platform) : null;
  const overLimit = !!caps && draft.length > caps.replyLimit;

  /* ----------------------------- thread pane ----------------------------- */

  const thread = active ? (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold">{active.author}</p>
              <PlatformIcon platform={active.platform} className="h-3.5 w-3.5" />
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {active.handle} · {active.kind === "dm" ? "Direct message" : "Comment"} ·{" "}
              {ageLabel(active.createdAt)} ago
            </p>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Assign">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Assign to</DropdownMenuLabel>
                {members.length === 0 && (
                  <DropdownMenuItem disabled className="text-xs">No teammates yet</DropdownMenuItem>
                )}
                {members.map((m) => (
                  <DropdownMenuItem
                    key={m.id}
                    className="text-xs"
                    onClick={() => { patch(active, { assignee: m.name }); toast.success(`Assigned to ${m.name}`); }}
                  >
                    {m.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border/60 bg-muted/40 p-3">
          <p className="whitespace-pre-wrap text-sm">{active.message}</p>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {new Date(active.createdAt).toLocaleString()}
          </p>
        </div>
        {active.status === "replied" && (
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/15 p-3">
            <p className="text-xs text-muted-foreground">You replied to this conversation.</p>
          </div>
        )}
      </div>

      <div className="border-t border-border/60 p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["rephrase", "shorten", "friendly", "translate"] as const).map((t) => (
            <Button
              key={t}
              variant="outline"
              size="sm"
              className="h-7 rounded-full px-2.5 text-[11px] capitalize"
              disabled={quickAi.loading}
              onClick={() => void runQuickAi(t)}
            >
              <Wand2 className="mr-1 h-3 w-3" />
              {t}
            </Button>
          ))}
          {savedReplies.slice(0, 3).map((r) => (
            <button
              key={r.id}
              type="button"
              title={r.body}
              onClick={() => {
                incrementUsage(r.id);
                setDraft(render(r.body, { name: active.author, handle: active.handle, platform: active.platform }));
              }}
              className="rounded-full border border-border/60 bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {r.name}
            </button>
          ))}
        </div>

        <Textarea
          ref={replyBoxRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder={caps?.reply === false ? "Public replies aren't supported here — send a DM instead." : "Write a reply…"}
          className="resize-none text-sm"
        />

        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-[11px] tabular-nums", overLimit ? "text-rose-500" : "text-muted-foreground")}>
            {draft.length}/{caps?.replyLimit}
            {quickAi.loading && " · thinking…"}
          </span>
          <div className="flex items-center gap-1">
            {caps?.like && (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="Like" onClick={() => toast.success("Liked")}>
                <ThumbsUp className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="Snooze">
                  <Clock className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">Snooze for</DropdownMenuLabel>
                {[
                  { label: "15 minutes", minutes: 15 },
                  { label: "1 hour", minutes: 60 },
                  { label: "4 hours", minutes: 240 },
                  { label: "Tomorrow", minutes: 1440 },
                ].map((p) => (
                  <DropdownMenuItem key={p.minutes} className="text-xs" onClick={() => snooze(active, p.minutes)}>
                    {p.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              title="Mark handled (e)"
              onClick={() => { patch(active, { status: "resolved" }); toast.success("Marked handled"); advance(active.id); }}
            >
              <Check className="h-4 w-4" />
            </Button>
            {active.status !== "new" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                title="Reopen"
                onClick={() => { patch(active, { status: "new", scheduledFor: undefined }); toast("Reopened"); }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" className="h-8 rounded-full px-3" disabled={!draft.trim() || overLimit} onClick={send}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={InboxIcon}
        title="Nothing selected"
        description="Pick a conversation on the left to see the full thread."
      />
    </div>
  );

  /* -------------------------------- render -------------------------------- */

  return (
    <div className="px-4 pb-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 backdrop-blur">
        <div className="grid grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-[210px_340px_minmax(0,1fr)]">
          {/* Channel rail */}
          <aside className="border-b border-border/60 lg:border-b-0 lg:border-r">
            <div className="flex gap-1.5 overflow-x-auto p-2 lg:flex-col lg:overflow-visible lg:p-3">
              <RailButton
                label="All channels"
                count={all.filter((i) => i.status === "new").length}
                active={channel === "all"}
                onClick={() => setChannel("all")}
              />
              {channels.map((p) => (
                <RailButton
                  key={p}
                  label={p.replace(/-/g, " ")}
                  icon={<PlatformIcon platform={p} className="h-3.5 w-3.5" />}
                  count={platformCounts.get(p) ?? 0}
                  active={channel === p}
                  onClick={() => setChannel(p)}
                />
              ))}
              <div className="hidden pt-2 lg:block">
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Type
                </p>
              </div>
              <RailButton label="Comments" icon={<MessageSquare className="h-3.5 w-3.5" />} active={kindFilter === "comment"} onClick={() => setKindFilter(kindFilter === "comment" ? "all" : "comment")} />
              <RailButton label="DMs" icon={<MessageCircle className="h-3.5 w-3.5" />} active={kindFilter === "dm"} onClick={() => setKindFilter(kindFilter === "dm" ? "all" : "dm")} />
              <RailButton label="Reviews" icon={<Star className="h-3.5 w-3.5" />} active={false} onClick={() => toast("Reviews arrive once a review-capable channel is connected.")} />
              <div className="hidden items-center gap-1.5 px-2 pt-3 text-[10px] text-muted-foreground lg:flex" title="j/k move · r reply · e handled · a assign">
                <Keyboard className="h-3 w-3" />
                <span>j/k · r · e · a</span>
              </div>
            </div>
          </aside>

          {/* Conversation list */}
          <section className="border-b border-border/60 lg:border-b-0 xl:border-r">
            <div className="space-y-2 border-b border-border/60 p-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="h-9"
                aria-label="Search conversations"
              />
              <div className="flex gap-1">
                {(["all", "needs", "waiting", "done"] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBucket(b)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      bucket === b
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {b === "all" ? "All" : BUCKET_LABEL[b]}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[62vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={InboxIcon}
                    title="Inbox zero"
                    description="No conversations match these filters."
                  />
                </div>
              ) : (
                (["needs", "waiting", "done"] as const).map((b) =>
                  grouped[b].length === 0 ? null : (
                    <div key={b}>
                      <p className="sticky top-0 z-10 bg-background/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur">
                        {BUCKET_LABEL[b]} · {grouped[b].length}
                      </p>
                      {grouped[b].map((i) => (
                        <ConversationRow
                          key={i.id}
                          item={i}
                          active={i.id === activeId}
                          onClick={() => openItem(i)}
                        />
                      ))}
                    </div>
                  ),
                )
              )}
            </div>
          </section>

          {/* Thread (desktop) */}
          <section className="hidden min-h-[62vh] xl:block">{thread}</section>
        </div>
      </div>

      {/* Thread (mobile / tablet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="bottom" className="h-[92vh] p-0 xl:hidden">
          <div className="h-full pt-6">{thread}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ------------------------------ sub-components ----------------------------- */

function RailButton({
  label,
  count,
  active,
  icon,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium capitalize transition-colors lg:w-full",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
      {!!count && (
        <span className="ml-auto rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
          {count}
        </span>
      )}
    </button>
  );
}

function ConversationRow({
  item,
  active,
  onClick,
}: {
  item: InboxItem;
  active: boolean;
  onClick: () => void;
}) {
  const { sentiment, intent } = analyzeMessage(item.message);
  const tier = slaTier(item.createdAt);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full gap-2.5 border-b border-border/40 p-3 text-left transition-colors",
        active ? "bg-primary/5" : "hover:bg-muted/40",
      )}
    >
      <span className="relative mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5">
          <PlatformIcon platform={item.platform} className="h-3 w-3" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{item.author}</span>
          <span className={cn("ml-auto text-[10px] tabular-nums", SLA_STYLE[tier])}>
            {ageLabel(item.createdAt)}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{item.message}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize", SENTIMENT_STYLE[sentiment])}>
            {sentiment}
          </span>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {INTENT_LABEL[intent]}
          </span>
          {item.assignee && (
            <span className="rounded-full border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              @{item.assignee}
            </span>
          )}
          {item.aiDraft && <Sparkles className="h-3 w-3 text-primary" />}
        </span>
      </span>
    </button>
  );
}
