import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Eye,
  Inbox as InboxIcon,
  MessageCircle,
  MessageSquare,
  Pencil,
  RotateCcw,
  Search,
  Send,
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
import { useQuickAi } from "@/hooks/useQuickAi";
import { analyzeMessage, snippetFor } from "@/hooks/useInboxAnalysis";
import { ageLabel, capabilitiesFor } from "@/config/inboxChannels";
import type { InboxItem } from "@/pages/dashboard/views/InboxBoard";

type Kind = "comment" | "dm";

/**
 * Unified inbox — clean three-column console:
 *
 *   1. platform rail   → filter by channel / kind
 *   2. conversation    → searchable flat list (no cards, no tag pills)
 *   3. thread          → conversation + reply composer
 *
 * Deliberately minimal (Figma-style): no section headers, no stat tiles, no
 * sentiment/intent chips in the console. On mobile the list takes the full
 * width and the thread opens in a bottom sheet with an Edit/Preview toggle,
 * mirroring the create flow.
 */
export function InboxConsole() {
  const comments = useInboxMessages("comment");
  const dms = useInboxMessages("dm");
  const { replies: savedReplies, incrementUsage, render } = useSavedReplies();
  const { members } = useTeamMembers();

  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMode, setMobileMode] = useState<"preview" | "edit">("preview");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<Kind | "all">("all");

  const quickAi = useQuickAi();
  const replyBoxRef = useRef<HTMLTextAreaElement | null>(null);

  const all = useMemo<InboxItem[]>(
    () =>
      [...comments.items, ...dms.items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [comments.items, dms.items],
  );

  /** Channels present in the feed, with unread counts — drives the rail. */
  const channels = useMemo(() => {
    const order = new Map<string, number>();
    const counts = new Map<string, { total: number; unread: number }>();
    for (const i of all) {
      if (!counts.has(i.platform)) {
        counts.set(i.platform, { total: 0, unread: 0 });
        order.set(i.platform, order.size);
      }
      const c = counts.get(i.platform)!;
      c.total += 1;
      if (i.status === "new") c.unread += 1;
    }
    return Array.from(counts.entries())
      .sort((a, b) => order.get(a[0])! - order.get(b[0])!)
      .map(([platform, c]) => ({ platform, ...c }));
  }, [all]);

  const counts = useMemo(
    () => ({
      comment: all.filter((i) => i.kind === "comment").length,
      dm: all.filter((i) => i.kind === "dm").length,
      unread: all.filter((i) => i.status === "new").length,
    }),
    [all],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((i) => {
      if (kindFilter !== "all" && i.kind !== kindFilter) return false;
      if (platformFilter !== "all" && i.platform !== platformFilter) return false;
      if (q && !(`${i.author} ${i.handle} ${i.message}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [all, kindFilter, platformFilter, search]);

  const active = useMemo(() => all.find((i) => i.id === activeId) ?? null, [all, activeId]);

  useEffect(() => {
    if (!active) {
      setDraft("");
      return;
    }
    const { intent: it } = analyzeMessage(active.message);
    setDraft(active.aiDraft ?? snippetFor(it, active.author));
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const store = (item: InboxItem) => (item.kind === "comment" ? comments : dms);
  const patch = (item: InboxItem, p: Partial<InboxItem>) => store(item).update(item.id, p);

  const openItem = (item: InboxItem) => {
    setActiveId(item.id);
    setMobileMode("preview");
    setMobileOpen(true);
  };

  const send = () => {
    if (!active || !draft.trim()) return;
    patch(active, { status: "replied", scheduledFor: undefined });
    toast.success(`Reply sent to ${active.author}`, { description: draft.slice(0, 80) });
    setMobileOpen(false);
    setActiveId(null);
  };

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
      toast.success("Updated with free AI");
    }
  };

  const caps = active ? capabilitiesFor(active.platform) : null;
  const overLimit = !!caps && draft.length > caps.replyLimit;

  /* ----------------------------- thread pane ----------------------------- */

  const threadBubbles = active ? (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border/60 bg-muted/40 p-3">
        <p className="whitespace-pre-wrap text-sm">{active.message}</p>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          {new Date(active.createdAt).toLocaleString()}
        </p>
      </div>
      {active.status === "replied" && (
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/15 p-3">
          <p className="whitespace-pre-wrap text-sm">{active.aiDraft ?? "You replied to this conversation."}</p>
        </div>
      )}
    </div>
  ) : null;

  const threadComposer = active ? (
    <div className="space-y-2 border-t border-border/60 p-3">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            title="Mark handled"
            onClick={() => { patch(active, { status: "resolved" }); toast.success("Marked handled"); setActiveId(null); }}
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
  ) : null;

  const threadHeader = active ? (
    <div className="flex items-start gap-3 border-b border-border/60 p-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
        <User className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{active.author}</p>
          <PlatformIcon platform={active.platform} className="h-3.5 w-3.5" />
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {active.handle} · {active.kind === "dm" ? "Direct message" : "Comment"} · {ageLabel(active.createdAt)} ago
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
  ) : null;

  const thread = active ? (
    <div className="flex h-full min-h-0 flex-col">
      {threadHeader}
      {threadBubbles}
      {threadComposer}
    </div>
  ) : (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={InboxIcon}
        title="Select a conversation"
        description="Pick a message from the list to reply."
      />
    </div>
  );

  /* ------------------------------- platform rail ------------------------------- */

  const railButton = (activeBtn: boolean) =>
    cn(
      "relative grid h-10 w-10 place-items-center rounded-xl transition-colors",
      activeBtn ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    );

  const rail = (
    <div className="flex h-full flex-col items-center gap-1 border-r border-border/60 bg-muted/20 py-3">
      <button
        type="button"
        title="All channels"
        onClick={() => setPlatformFilter("all")}
        className={railButton(platformFilter === "all")}
      >
        <InboxIcon className="h-5 w-5" strokeWidth={1.75} />
        {counts.unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground tabular-nums">
            {counts.unread > 9 ? "9+" : counts.unread}
          </span>
        )}
      </button>

      <div className="my-1 h-px w-6 bg-border/60" />

      {channels.map(({ platform, total, unread }) => (
        <button
          key={platform}
          type="button"
          title={platform}
          onClick={() => setPlatformFilter(platformFilter === platform ? "all" : platform)}
          className={railButton(platformFilter === platform)}
        >
          <PlatformIcon platform={platform} className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground tabular-nums">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
          <span className="sr-only">{platform} · {total}</span>
        </button>
      ))}

      <div className="mt-auto" />

      <button
        type="button"
        title="Comments"
        onClick={() => setKindFilter(kindFilter === "comment" ? "all" : "comment")}
        className={railButton(kindFilter === "comment")}
      >
        <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
        {counts.comment > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-muted-foreground/80 px-1 text-[9px] font-bold text-background tabular-nums">
            {counts.comment > 9 ? "9+" : counts.comment}
          </span>
        )}
      </button>
      <button
        type="button"
        title="Direct messages"
        onClick={() => setKindFilter(kindFilter === "dm" ? "all" : "dm")}
        className={railButton(kindFilter === "dm")}
      >
        <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
        {counts.dm > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-muted-foreground/80 px-1 text-[9px] font-bold text-background tabular-nums">
            {counts.dm > 9 ? "9+" : counts.dm}
          </span>
        )}
      </button>
    </div>
  );

  /* ----------------------------- conversation list ----------------------------- */

  const list = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border/60 p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="h-9 pl-9"
            aria-label="Search conversations"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={InboxIcon}
              title="Inbox zero"
              description="No conversations match."
            />
          </div>
        ) : (
          filtered.map((i) => {
            const isActive = i.id === activeId;
            return (
              <button
                key={i.id}
                type="button"
                onClick={() => openItem(i)}
                className={cn(
                  "relative flex w-full gap-3 border-b border-border/40 px-3 py-3 text-left transition-colors",
                  isActive ? "bg-primary/[0.06]" : "hover:bg-muted/40",
                )}
              >
                {i.status === "new" && (
                  <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" aria-label="Unread" />
                )}
                <span className="relative mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5">
                    <PlatformIcon platform={i.platform} className="h-3 w-3" />
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-semibold">{i.author}</span>
                    <span className="ml-auto flex-shrink-0 text-[10px] tabular-nums text-muted-foreground">
                      {ageLabel(i.createdAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{i.message}</span>
                  {i.assignee && (
                    <span className="mt-1 block text-[10px] text-muted-foreground/70">@{i.assignee}</span>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  /* -------------------------------- render -------------------------------- */

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 lg:h-[calc(100dvh-var(--demo-banner-h,0px)-var(--mobile-header-h,0px)-15rem)] lg:min-h-[32rem]">
      {/* Desktop / tablet: three columns */}
      <div className="hidden grid-cols-[3.5rem_minmax(0,19rem)_minmax(0,1fr)] lg:grid lg:h-full">
        {rail}
        <div className="min-h-0 border-r border-border/60">{list}</div>
        <div className="min-h-0">{thread}</div>
      </div>

      {/* Mobile: platform rail + list, thread in a bottom sheet */}
      <div className="grid h-[calc(100dvh-var(--demo-banner-h,0px)-var(--mobile-header-h,0px)-17rem)] min-h-[26rem] grid-cols-[3.5rem_minmax(0,1fr)] lg:hidden">
        {rail}
        {list}
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="bottom" className="h-[92vh] p-0 lg:hidden">
          {active && (
            <div className="flex h-full flex-col pt-6">
              {/* Edit / Preview toggle — same pattern as the create flow on mobile */}
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
                <p className="truncate text-xs font-medium text-muted-foreground">
                  {active.author} · {active.platform}
                </p>
                <div className="flex rounded-full border border-border/60 bg-muted/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setMobileMode("preview")}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                      mobileMode === "preview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                    )}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileMode("edit")}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                      mobileMode === "edit" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                    )}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              </div>

              {mobileMode === "preview" ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  {threadHeader}
                  {threadBubbles}
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  {threadHeader}
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                    <p className="text-xs text-muted-foreground">Replying to {active.handle}:</p>
                    <div className="mt-2 max-w-[85%] rounded-2xl rounded-tl-sm border border-border/60 bg-muted/40 p-3">
                      <p className="line-clamp-3 whitespace-pre-wrap text-sm">{active.message}</p>
                    </div>
                  </div>
                  {threadComposer}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
