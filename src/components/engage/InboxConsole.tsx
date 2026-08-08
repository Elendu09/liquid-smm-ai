import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Clock,
  Inbox as InboxIcon,
  MessageCircle,
  MessageSquare,
  RotateCcw,
  Search,
  Send,
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
import { ageLabel, capabilitiesFor } from "@/config/inboxChannels";
import type { InboxItem } from "@/pages/dashboard/views/InboxBoard";

type Kind = "comment" | "dm";

interface Props {
  sentiment?: Sentiment | "all";
  intent?: Intent | "all";
}

/**
 * Simplified Buffer-style combined inbox: single scrollable feed with
 * inline reply composer. No channel rail, no bucket tabs — just search,
 * sort, and act.
 */
export function InboxConsole({ sentiment = "all", intent = "all" }: Props) {
  const comments = useInboxMessages("comment");
  const dms = useInboxMessages("dm");
  const { accounts } = useAccounts();
  const { replies: savedReplies, incrementUsage, render } = useSavedReplies();
  const { members } = useTeamMembers();

  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((i) => {
      if (kindFilter !== "all" && i.kind !== kindFilter) return false;
      if (q && !(`${i.author} ${i.handle} ${i.message}`.toLowerCase().includes(q))) return false;
      if (sentiment !== "all" || intent !== "all") {
        const a = analyzeMessage(i.message);
        if (sentiment !== "all" && a.sentiment !== sentiment) return false;
        if (intent !== "all" && a.intent !== intent) return false;
      }
      return true;
    });
  }, [all, kindFilter, search, sentiment, intent]);

  const active = useMemo(() => all.find((i) => i.id === activeId) ?? null, [all, activeId]);

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
    </div>
  ) : (
    <div className="flex h-full items-center justify-center p-6">
      <EmptyState
        icon={InboxIcon}
        title="Select a conversation"
        description="Pick a message from the feed to reply."
      />
    </div>
  );

  /* -------------------------------- render -------------------------------- */

  return (
    <div className="px-4 pb-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 backdrop-blur">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Combined feed */}
          <section className="border-b border-border/60 xl:border-b-0 xl:border-r">
            {/* Search + filter bar */}
            <div className="space-y-2 border-b border-border/60 p-3">
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
              <div className="flex gap-1">
                {(["all", "comment", "dm"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKindFilter(k)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      kindFilter === k
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {k === "all" && "All"}
                    {k === "comment" && <><MessageSquare className="h-3 w-3" /> Comments</>}
                    {k === "dm" && <><MessageCircle className="h-3 w-3" /> DMs</>}
                  </button>
                ))}
                <span className="ml-auto text-[10px] text-muted-foreground self-center tabular-nums">
                  {filtered.length} conversation{filtered.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {/* Scrollable feed */}
            <div className="max-h-[70vh] overflow-y-auto">
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
                  const { sentiment: s, intent: it } = analyzeMessage(i.message);
                  const isActive = i.id === activeId;
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => openItem(i)}
                      className={cn(
                        "flex w-full gap-3 border-b border-border/40 p-3 text-left transition-colors",
                        isActive ? "bg-primary/5" : "hover:bg-muted/40",
                      )}
                    >
                      <span className="relative mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5">
                          <PlatformIcon platform={i.platform} className="h-3 w-3" />
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold">{i.author}</span>
                          <span className="text-[10px] tabular-nums text-muted-foreground ml-auto flex-shrink-0">
                            {ageLabel(i.createdAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{i.message}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1">
                          <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize", SENTIMENT_STYLE[s])}>
                            {s}
                          </span>
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            {INTENT_LABEL[it]}
                          </span>
                          {i.assignee && (
                            <span className="rounded-full border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              @{i.assignee}
                            </span>
                          )}
                          {i.status === "replied" && (
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500">
                              Replied
                            </span>
                          )}
                          {i.status === "resolved" && (
                            <span className="rounded-full border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              Done
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Thread (desktop) */}
          <section className="hidden min-h-[70vh] xl:block">{thread}</section>
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
