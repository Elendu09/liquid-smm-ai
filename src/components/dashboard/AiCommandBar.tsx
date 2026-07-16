import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Sparkles,
  Send,
  Loader2,
  History,
  Check,
  X,
  FileText,
  CalendarClock,
  Hash,
  ArrowUpRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAiCommandHistory, type AiCommandEntry, type AiCommandToolCall } from "@/hooks/useAiCommandHistory";
import { enqueueInbox } from "@/hooks/useMcpInbox";
import { logMcpCall } from "@/hooks/useMcpActivity";
import { useAccounts } from "@/contexts/AccountContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Draft 3 caption ideas about a new product launch",
  "Schedule my last caption for tomorrow 9am on Instagram",
  "Give me 15 hashtags for a fitness reel",
  "Open the scheduled queue",
];

interface ToolIntent {
  kind: string;
  needsApproval: boolean;
  payload: Record<string, unknown>;
  targetRoute?: string;
}

function iconFor(kind: string) {
  if (kind === "caption-draft") return FileText;
  if (kind === "scheduled-post") return CalendarClock;
  if (kind === "hashtag-list") return Hash;
  if (kind === "navigate") return ArrowUpRight;
  return Sparkles;
}

function labelFor(kind: string) {
  if (kind === "caption-draft") return "Caption draft";
  if (kind === "scheduled-post") return "Scheduled post";
  if (kind === "hashtag-list") return "Hashtags";
  if (kind === "navigate") return "Open page";
  return kind;
}

function shortSummary(intent: ToolIntent) {
  const p = intent.payload;
  if (intent.kind === "caption-draft") return (p.title as string) ?? (p.body as string)?.slice(0, 60);
  if (intent.kind === "scheduled-post") {
    const when = typeof p.scheduledAt === "string" ? new Date(p.scheduledAt).toLocaleString() : "";
    const platforms = Array.isArray(p.platformIds) ? (p.platformIds as string[]).join(", ") : "";
    return `${platforms}${when ? ` · ${when}` : ""}`;
  }
  if (intent.kind === "hashtag-list") return `#${(p.tags as string[])?.slice(0, 4).join(" #") ?? ""}`;
  if (intent.kind === "navigate") return (p.route as string) ?? "";
  return "";
}

export function AiCommandBar() {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [latest, setLatest] = useState<AiCommandEntry | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const navigate = useNavigate();
  const { accounts, activeAccount } = useAccounts();
  const { state: onboarding } = useOnboarding();
  const { items: history, log, update, updateTool, clear } = useAiCommandHistory();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = async (value?: string) => {
    const text = (value ?? prompt).trim();
    if (!text || busy) return;
    setBusy(true);
    setPrompt("");
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-command`;
      const res = await fetch(url, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: text,
          nowIso: new Date().toISOString(),
          context: {
            connectedPlatformIds: [...new Set(accounts.map((a) => a.platformId))],
            activeAccountHandle: activeAccount?.username ?? null,
            tone: onboarding.profile.tone || undefined,
            niches: onboarding.profile.niches,
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        const msg =
          res.status === 429
            ? "Rate limit hit — try again in a moment."
            : res.status === 402
              ? "AI credits exhausted. Add credits in Settings → Plans & credits."
              : `AI command failed (${res.status}). ${errBody.slice(0, 140)}`;
        toast.error(msg);
        const entry = log({ prompt: text, text: "", toolCalls: [], status: "error", error: msg });
        setLatest(entry);
        return;
      }

      const data = (await res.json()) as { text: string; toolCalls: AiCommandToolCall[] };
      const entry = log({
        prompt: text,
        text: data.text ?? "",
        toolCalls: data.toolCalls ?? [],
        status: "success",
      });
      setLatest(entry);

      // Auto-execute read-only tools (navigate, hashtag list) immediately.
      for (const call of entry.toolCalls) {
        const intent = call.result as ToolIntent | null;
        if (!intent) continue;
        if (intent.kind === "navigate" && intent.payload?.route) {
          navigate(String(intent.payload.route));
          updateTool(entry.id, call.id, { approved: true });
        }
      }
    } catch (e) {
      if (ctrl.signal.aborted) return;
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`AI command failed: ${msg}`);
      const entry = log({ prompt: text, text: "", toolCalls: [], status: "error", error: msg });
      setLatest(entry);
    } finally {
      setBusy(false);
    }
  };

  const approve = (entry: AiCommandEntry, call: AiCommandToolCall) => {
    const intent = call.result as ToolIntent | null;
    if (!intent) return;
    if (intent.kind === "caption-draft" || intent.kind === "scheduled-post") {
      enqueueInbox({
        kind: intent.kind,
        source: `ai-command:${call.name}`,
        payload: intent.payload as never,
        needsApproval: false, // user just approved in-line
      });
      logMcpCall({
        tool: call.name,
        status: "success",
        summary: `Approved via AI command: ${shortSummary(intent)}`,
        resources: [
          {
            kind: intent.kind === "caption-draft" ? "caption" : "scheduled-post",
            id: (intent.payload.id as string) ?? crypto.randomUUID(),
            label: shortSummary(intent),
          },
        ],
        payload: intent.payload,
      });
      toast.success(`${labelFor(intent.kind)} applied — will show on next open.`);
    }
    updateTool(entry.id, call.id, { approved: true });
    if (latest?.id === entry.id) {
      setLatest({
        ...entry,
        toolCalls: entry.toolCalls.map((c) => (c.id === call.id ? { ...c, approved: true } : c)),
      });
    }
  };

  const reject = (entry: AiCommandEntry, call: AiCommandToolCall) => {
    updateTool(entry.id, call.id, { rejected: true });
    if (latest?.id === entry.id) {
      setLatest({
        ...entry,
        toolCalls: entry.toolCalls.map((c) => (c.id === call.id ? { ...c, rejected: true } : c)),
      });
    }
    toast("Rejected");
  };

  const renderCall = (entry: AiCommandEntry, call: AiCommandToolCall) => {
    const intent = call.result as ToolIntent | null;
    if (!intent) return null;
    const Icon = iconFor(intent.kind);
    const needsAction = intent.needsApproval && !call.approved && !call.rejected;
    return (
      <div
        key={call.id}
        className={cn(
          "flex items-start gap-3 rounded-lg border p-3",
          call.approved && "border-brand-green/40 bg-brand-green/5",
          call.rejected && "border-destructive/30 bg-destructive/5 opacity-70",
          !call.approved && !call.rejected && "border-border bg-card",
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{labelFor(intent.kind)}</span>
            {intent.needsApproval && !call.approved && !call.rejected && (
              <Badge variant="outline" className="text-[10px] h-5">Needs approval</Badge>
            )}
            {call.approved && <Badge className="text-[10px] h-5 bg-brand-green/20 text-brand-green border-brand-green/30">Approved</Badge>}
            {call.rejected && <Badge variant="destructive" className="text-[10px] h-5">Rejected</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{shortSummary(intent) || call.name}</p>
          {intent.kind === "caption-draft" && (
            <p className="text-xs mt-1.5 line-clamp-3 whitespace-pre-wrap">{String(intent.payload.body ?? "")}</p>
          )}
          {intent.kind === "hashtag-list" && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {((intent.payload.tags as string[]) ?? []).map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px] h-5">#{t}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          {needsAction && (
            <>
              <Button size="sm" variant="default" className="h-7 px-2" onClick={() => approve(entry, call)}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => reject(entry, call)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {intent.targetRoute && (call.approved || !intent.needsApproval) && (
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => navigate(intent.targetRoute!)}>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative group">
      {/* Ambient gradient glow — softer, Horizon-style */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[2px] rounded-[24px] bg-[conic-gradient(from_140deg_at_50%_50%,hsl(var(--brand-blue)/0.25),hsl(var(--brand-purple)/0.18),hsl(var(--brand-cyan)/0.22),hsl(var(--brand-blue)/0.25))] opacity-40 blur-[10px] transition-opacity duration-500 group-focus-within:opacity-80"
      />

      <Card className="relative rounded-[22px] border border-border/70 dark:border-white/[0.08] bg-gradient-to-b from-card/95 to-card/70 dark:from-white/[0.04] dark:to-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_-12px_hsl(var(--primary)/0.18)] dark:shadow-[0_8px_32px_-12px_hsl(220_60%_5%/0.6)] overflow-hidden">
        {/* subtle inner highlight */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent" />

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-1">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-primary/40 blur-md" />
            <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-brand-purple flex items-center justify-center shadow-md">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[13px] font-semibold tracking-tight leading-none">AI Command</h3>
              <Badge variant="outline" className="h-4 text-[9px] px-1.5 border-primary/25 bg-primary/[0.06] text-primary font-medium">
                Gemini 3
              </Badge>
            </div>
            <p className="text-[10.5px] text-muted-foreground mt-1 leading-none">You approve every write.</p>
          </div>
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg hover:bg-primary/10">
                <History className="h-3.5 w-3.5" />
                <span className="ml-1 text-[11px] font-medium">{history.length}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>AI command history</span>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clear} className="text-xs">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                {history.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No commands yet.</p>
                )}
                {history.map((e) => (
                  <div key={e.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2">{e.prompt}</p>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {e.text && <p className="text-xs text-muted-foreground line-clamp-3">{e.text}</p>}
                    {e.error && <p className="text-xs text-destructive">{e.error}</p>}
                    {e.toolCalls.length > 0 && (
                      <div className="space-y-1.5">
                        {e.toolCalls.map((c) => renderCall(e, c))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Prompt input area — compact Horizon glass */}
        <div className="px-4 pt-2">
          <div className="relative rounded-xl bg-background/60 dark:bg-white/[0.03] border border-border/70 dark:border-white/[0.06] focus-within:border-primary/50 focus-within:bg-background/80 dark:focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything… draft a caption, schedule a post, find hashtags"
              rows={2}
              className="resize-none text-[13px] leading-snug min-h-[58px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-3 pt-2.5 pb-10 placeholder:text-muted-foreground/60"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submit();
                }
              }}
              disabled={busy}
            />

            {/* Floating toolbar */}
            <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-2">
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground pl-1.5">
                <kbd className="px-1.5 py-0.5 rounded-md bg-muted/70 dark:bg-white/[0.06] border border-border/60 dark:border-white/[0.08] font-mono text-[9.5px] leading-none">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded-md bg-muted/70 dark:bg-white/[0.06] border border-border/60 dark:border-white/[0.08] font-mono text-[9.5px] leading-none">↵</kbd>
                <span className="ml-0.5">send</span>
              </div>
              <Button
                onClick={() => submit()}
                disabled={busy || !prompt.trim()}
                size="sm"
                className="h-7 px-3 ml-auto rounded-lg bg-gradient-to-br from-primary to-brand-purple text-primary-foreground shadow-md shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 disabled:opacity-40 disabled:shadow-none transition-all"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="ml-1 text-[11px] font-medium">Thinking</span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-semibold">Send</span>
                    <Send className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              disabled={busy}
              className="group/chip text-[10.5px] pl-1.5 pr-2 py-0.5 rounded-full border border-border/60 dark:border-white/[0.06] bg-background/60 dark:bg-white/[0.03] hover:border-primary/50 hover:bg-primary/[0.06] hover:text-foreground transition-all text-muted-foreground disabled:opacity-40 inline-flex items-center gap-1"
            >
              <Sparkles className="h-2.5 w-2.5 text-primary/70 group-hover/chip:text-primary transition-colors" />
              {s}
            </button>
          ))}
        </div>


        {/* Latest response */}
        {latest && (
          <div className="mx-4 sm:mx-5 mb-4 rounded-2xl border border-border/60 bg-gradient-to-br from-muted/40 to-transparent p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              Response
            </div>
            {latest.text && (
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{latest.text}</p>
            )}
            {latest.error && <p className="text-sm text-destructive">{latest.error}</p>}
            {latest.toolCalls.length > 0 && (
              <div className="space-y-2 pt-1">
                {latest.toolCalls.map((c) => renderCall(latest, c))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// Ensure supabase client is referenced so tree-shakers keep the import for future use.
void supabase;
