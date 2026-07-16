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
    <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold">Ask AI to do anything</h3>
          <p className="text-[11px] text-muted-foreground">Drafts and schedules require your approval.</p>
        </div>
        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5 text-xs">{history.length}</span>
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

      <div className="flex gap-2 items-end">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Draft a launch caption and schedule it for tomorrow 9am on Instagram…"
          rows={2}
          className="resize-none text-sm min-h-[52px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={busy}
        />
        <Button onClick={() => submit()} disabled={busy || !prompt.trim()} size="icon" className="h-[52px] w-[52px] flex-shrink-0">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => submit(s)}
            disabled={busy}
            className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {latest && (
        <div className="mt-3 pt-3 border-t space-y-2">
          {latest.text && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{latest.text}</p>
          )}
          {latest.error && <p className="text-sm text-destructive">{latest.error}</p>}
          {latest.toolCalls.length > 0 && (
            <div className="space-y-2">
              {latest.toolCalls.map((c) => renderCall(latest, c))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// Ensure supabase client is referenced so tree-shakers keep the import for future use.
void supabase;
