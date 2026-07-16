import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Sparkles,
  Send,
  History,
  Check,
  X,
  FileText,
  CalendarClock,
  Hash,
  ArrowUpRight,
  Trash2,
  Square,
  Settings2,
  RotateCcw,
  Copy,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAiCommandSettings } from "@/hooks/useAiCommandSettings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import {
  useAiCommandHistory,
  logAiCommand,
  updateAiCommand,
  updateToolCall,
  type AiCommandEntry,
  type AiCommandToolCall,
} from "@/hooks/useAiCommandHistory";
import { enqueueInbox } from "@/hooks/useMcpInbox";
import { logMcpCall } from "@/hooks/useMcpActivity";
import { useAccounts } from "@/contexts/AccountContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";
import { InlineMarkdown } from "./InlineMarkdown";
import { CaptionDraftIntent } from "./ai-intents/CaptionDraftIntent";
import { ScheduledPostIntent } from "./ai-intents/ScheduledPostIntent";
import {
  SlashCommandMenu,
  SLASH_COMMANDS,
  matchActiveCommand,
  nextPlaceholder,
  fillPlaceholder,
  type SlashCommand,
  type SlashParam,
} from "./SlashCommandMenu";
import { SlashParamHints } from "./SlashParamHints";

const DRAFT_KEY = "smmpilot:ai-command-draft";
const HISTORY_TURNS = 6;


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
  // Restore any in-progress draft (feature memory item from the plan).
  const [prompt, setPrompt] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(DRAFT_KEY) ?? "";
  });
  const [busy, setBusy] = useState(false);
  const [latest, setLatest] = useState<AiCommandEntry | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { accounts, activeAccount } = useAccounts();
  const { state: onboarding } = useOnboarding();
  const { items: history, clear } = useAiCommandHistory();
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const promptAnchorRef = useRef<HTMLDivElement | null>(null);


  const { settings, update: updateSettings } = useAiCommandSettings();

  // Persist prompt drafts so a reload doesn't lose in-progress work.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (prompt) window.sessionStorage.setItem(DRAFT_KEY, prompt);
    else window.sessionStorage.removeItem(DRAFT_KEY);
  }, [prompt]);

  // Track the last-submitted prompt so a Retry button can re-send after errors.
  const lastPromptRef = useRef<string>("");

  // Slash command menu state — opens when input starts with "/" and no space typed yet.
  const slashOpen = prompt.startsWith("/") && !prompt.includes(" ") && !prompt.includes("\n");
  const slashQuery = slashOpen ? prompt.slice(1) : "";

  // Active command (after picking) — drives inline param hints.
  const activeCmd = useMemo(() => matchActiveCommand(prompt), [prompt]);
  const activeParam = useMemo(() => nextPlaceholder(prompt, activeCmd), [prompt, activeCmd]);

  // Ghost autocomplete: if the current /query uniquely matches one command, show the rest as ghost text.
  const ghostSuffix = useMemo(() => {
    if (!slashOpen || !settings.ghostAutocomplete) return "";
    const q = slashQuery.toLowerCase();
    if (!q) return "";
    const matches = SLASH_COMMANDS.filter(
      (c) => c.label.slice(1).toLowerCase().startsWith(q),
    );
    if (matches.length !== 1) return "";
    return matches[0].label.slice(1 + q.length);
  }, [slashOpen, slashQuery, settings.ghostAutocomplete]);

  // Map "<name>" -> "label: hint" for tooltips on highlighted tokens.
  const paramTooltip = useMemo(() => {
    const map = new Map<string, string>();
    activeCmd?.params?.forEach((p) => map.set(p.name, `${p.label}: ${p.hint}`));
    return map;
  }, [activeCmd]);

  const selectPlaceholder = (name: string) => {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      const token = `<${name}>`;
      const idx = el.value.indexOf(token);
      if (idx >= 0) {
        el.focus();
        el.setSelectionRange(idx, idx + token.length);
      }
    });
  };

  // Typewriter placeholder cycling through SUGGESTIONS while input is empty & idle
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (prompt || busy) return;
    let sIdx = 0;
    let cIdx = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = SUGGESTIONS[sIdx];
      if (!deleting) {
        cIdx++;
        setTyped(full.slice(0, cIdx));
        if (cIdx === full.length) {
          deleting = true;
          timer = setTimeout(tick, 1600);
          return;
        }
      } else {
        cIdx--;
        setTyped(full.slice(0, cIdx));
        if (cIdx === 0) {
          deleting = false;
          sIdx = (sIdx + 1) % SUGGESTIONS.length;
        }
      }
      timer = setTimeout(tick, deleting ? 22 : 42);
    };
    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [prompt, busy]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Recent conversation memory sent server-side to resolve back-references.
  const conversationMemory = useMemo(
    () =>
      history.slice(0, HISTORY_TURNS).reverse().map((h) => ({
        prompt: h.prompt,
        text: h.text,
        toolNames: h.toolCalls.map((c) => c.name),
      })),
    [history],
  );

  const onSlashPick = (cmd: SlashCommand) => {
    if (cmd.action === "clear-history") {
      clear();
      setPrompt("");
      setLatest(null);
      toast.success("Conversation memory cleared");
      return;
    }
    if (cmd.submit) {
      setPrompt("");
      submit(cmd.insert);
      return;
    }
    setPrompt(cmd.insert);
    // Select the first placeholder token (e.g. <topic>) so the user can just start typing over it.
    if (cmd.params?.length) {
      selectPlaceholder(cmd.params[0].name);
    } else {
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(cmd.insert.length, cmd.insert.length);
        }
      });
    }
  };

  const onParamPick = (param: SlashParam, value: string) => {
    setPrompt((p) => {
      const next = fillPlaceholder(p, param.name, value);
      // After state commits, jump to the next placeholder if one exists.
      requestAnimationFrame(() => {
        const cmd = matchActiveCommand(next);
        const nextP = nextPlaceholder(next, cmd);
        if (nextP) selectPlaceholder(nextP.name);
        else textareaRef.current?.focus();
      });
      return next;
    });
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  };

  const submit = async (value?: string) => {
    // Warn if there are still unfilled <placeholder> tokens from a slash template.
    const raw = (value ?? prompt).trim();
    if (/<[a-z_-]+>/i.test(raw)) {
      toast.error("Fill in the highlighted placeholder before sending.");
      const m = raw.match(/<([a-z_-]+)>/i);
      if (m) selectPlaceholder(m[1]);
      return;
    }
    const text = raw;
    if (!text || busy) return;
    lastPromptRef.current = text;
    setBusy(true);
    setPrompt("");
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // Optimistic in-memory entry; commit to persistent history when the stream finishes.
    let workingEntry: AiCommandEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      prompt: text,
      text: "",
      toolCalls: [],
      status: "success",
    };
    setLatest(workingEntry);

    const patch = (mutate: (e: AiCommandEntry) => AiCommandEntry) => {
      workingEntry = mutate(workingEntry);
      setLatest({ ...workingEntry });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-command`;
      const res = await fetch(url, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
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
            currentRoute: location.pathname,
          },
          history: conversationMemory,
        }),
      });

      if (!res.ok || !res.body) {
        const errBody = await res.text().catch(() => "");
        const msg =
          res.status === 429
            ? "Rate limit hit — try again in a moment."
            : res.status === 402
              ? "AI credits exhausted. Add credits in Settings → Plans & credits."
              : `AI command failed (${res.status}). ${errBody.slice(0, 140)}`;
        toast.error(msg);
        const entry = logAiCommand({ prompt: text, text: "", toolCalls: [], status: "error", error: msg });
        setLatest(entry);
        return;
      }

      // SSE parsing loop
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamError: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const raw of chunks) {
          const line = raw.replace(/^data:\s*/, "").trim();
          if (!line) continue;
          let evt: Record<string, unknown>;
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }
          switch (evt.type) {
            case "text-delta":
              patch((e) => ({ ...e, text: e.text + (evt.text as string) }));
              break;
            case "tool-call":
              patch((e) => ({
                ...e,
                toolCalls: e.toolCalls.some((c) => c.id === evt.id)
                  ? e.toolCalls
                  : [
                      ...e.toolCalls,
                      { id: String(evt.id), name: String(evt.name), args: evt.args ?? null, result: null },
                    ],
              }));
              break;
            case "tool-result":
              patch((e) => ({
                ...e,
                toolCalls: e.toolCalls.map((c) =>
                  c.id === evt.id ? { ...c, result: evt.result ?? null } : c,
                ),
              }));
              // Auto-execute read-only navigate intents as soon as the tool result arrives.
              {
                const intent = evt.result as ToolIntent | null;
                if (intent?.kind === "navigate" && intent.payload?.route) {
                  navigate(String(intent.payload.route));
                  patch((e) => ({
                    ...e,
                    toolCalls: e.toolCalls.map((c) =>
                      c.id === evt.id ? { ...c, approved: true } : c,
                    ),
                  }));
                }
              }
              break;
            case "error":
              streamError = String(evt.error ?? "stream error");
              break;
            case "done":
              // handled after loop
              break;
          }
        }
      }

      // Commit final entry to persistent history and swap `latest` to the stored one so
      // approvals/rejections mutate storage instead of the ephemeral working copy.
      const committed = logAiCommand({
        prompt: workingEntry.prompt,
        text: workingEntry.text,
        toolCalls: workingEntry.toolCalls,
        status: streamError ? "error" : "success",
        error: streamError ?? undefined,
      });
      setLatest(committed);
      if (streamError) toast.error(streamError);
    } catch (e) {
      if (ctrl.signal.aborted) {
        // Preserve whatever we streamed so far.
        const committed = logAiCommand({
          prompt: workingEntry.prompt,
          text: workingEntry.text,
          toolCalls: workingEntry.toolCalls,
          status: "success",
        });
        setLatest(committed);
        toast("Stopped", { description: "Response was cancelled." });
        return;
      }
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`AI command failed: ${msg}`);
      const entry = logAiCommand({ prompt: text, text: "", toolCalls: [], status: "error", error: msg });
      setLatest(entry);
    } finally {
      setBusy(false);
      abortRef.current = null;
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
    updateToolCall(entry.id, call.id, { approved: true });
    if (latest?.id === entry.id) {
      setLatest({
        ...entry,
        toolCalls: entry.toolCalls.map((c) => (c.id === call.id ? { ...c, approved: true } : c)),
      });
    }
  };

  const reject = (entry: AiCommandEntry, call: AiCommandToolCall) => {
    updateToolCall(entry.id, call.id, { rejected: true });
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

    // Rich inline caption editor with quick tweaks + Save to Library.
    if (intent.kind === "caption-draft") {
      return (
        <CaptionDraftIntent
          key={call.id}
          payload={intent.payload as never}
          approved={call.approved}
          rejected={call.rejected}
          onApprove={() => {
            updateToolCall(entry.id, call.id, { approved: true });
            if (latest?.id === entry.id) {
              setLatest({
                ...entry,
                toolCalls: entry.toolCalls.map((c) =>
                  c.id === call.id ? { ...c, approved: true } : c,
                ),
              });
            }
          }}
          onReject={() => reject(entry, call)}
        />
      );
    }

    // Inline schedule widget — writes straight to useScheduledPosts.
    if (intent.kind === "scheduled-post") {
      return (
        <ScheduledPostIntent
          key={call.id}
          payload={intent.payload as never}
          approved={call.approved}
          rejected={call.rejected}
          onApprove={() => {
            updateToolCall(entry.id, call.id, { approved: true });
            if (latest?.id === entry.id) {
              setLatest({
                ...entry,
                toolCalls: entry.toolCalls.map((c) =>
                  c.id === call.id ? { ...c, approved: true } : c,
                ),
              });
            }
          }}
          onReject={() => reject(entry, call)}
        />
      );
    }

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

      <Card className="relative rounded-[22px] border border-border/70 dark:border-white/[0.08] bg-gradient-to-b from-card/95 to-card/70 dark:from-white/[0.04] dark:to-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_-12px_hsl(var(--primary)/0.18)] dark:shadow-[0_8px_32px_-12px_hsl(220_60%_5%/0.6)]">
        {/* subtle inner highlight */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent" />

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-1">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-primary/40 blur-md" />
            <div className="relative w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.5)] ring-1 ring-inset ring-primary-foreground/20">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[13px] font-semibold tracking-tight leading-none text-foreground">AI Command</h3>
              <Badge variant="outline" className="h-4 text-[9px] px-1.5 border-primary/25 bg-primary/[0.08] text-primary font-medium">
                Gemini 3
              </Badge>
            </div>
            <p className="text-[10.5px] text-muted-foreground mt-1 leading-none">You approve every write.</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Command bar settings"
                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10"
              >
                <Settings2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-3 space-y-3">
              <div>
                <p className="text-xs font-semibold mb-1.5">Enter key behavior</p>
                <RadioGroup
                  value={settings.enterBehavior}
                  onValueChange={(v) => updateSettings({ enterBehavior: v as "send" | "newline" })}
                  className="gap-1.5"
                >
                  <label className="flex items-start gap-2 rounded-md p-1.5 hover:bg-muted/40 cursor-pointer">
                    <RadioGroupItem value="send" id="enter-send" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="enter-send" className="text-xs font-medium cursor-pointer">Enter sends</Label>
                      <p className="text-[10.5px] text-muted-foreground leading-tight">Shift+Enter for new line</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 rounded-md p-1.5 hover:bg-muted/40 cursor-pointer">
                    <RadioGroupItem value="newline" id="enter-newline" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="enter-newline" className="text-xs font-medium cursor-pointer">Enter is new line</Label>
                      <p className="text-[10.5px] text-muted-foreground leading-tight">Cmd/Ctrl+Enter to send</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
                <div>
                  <Label htmlFor="ghost-ac" className="text-xs font-medium">Ghost autocomplete</Label>
                  <p className="text-[10.5px] text-muted-foreground leading-tight">Preview slash-command suffix</p>
                </div>
                <Switch
                  id="ghost-ac"
                  checked={settings.ghostAutocomplete}
                  onCheckedChange={(v) => updateSettings({ ghostAutocomplete: v })}
                />
              </div>
            </PopoverContent>
          </Popover>
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10">
                <History className="h-3.5 w-3.5" strokeWidth={1.75} />
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
          <div
            ref={promptAnchorRef}
            className="relative rounded-xl bg-background/60 dark:bg-white/[0.03] border border-border/70 dark:border-white/[0.06] focus-within:border-primary/50 focus-within:bg-background/80 dark:focus-within:bg-white/[0.05] focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all cursor-text"
            onMouseDown={(e) => {
              // Clicking padding/toolbar gap focuses the textarea so paste/typing lands there.
              if (e.target === e.currentTarget) {
                e.preventDefault();
                textareaRef.current?.focus();
              }
            }}
            onPaste={(e) => {
              // Always route paste into the textarea at the current cursor, replacing any
              // active selection. This guarantees the pasted text lands where the user
              // expects even if focus drifted (e.g. slash menu portal, toolbar click) and
              // keeps the selection semantics identical to a native textarea paste so the
              // user can still edit before sending.
              const text = e.clipboardData.getData("text");
              if (!text) return;
              e.preventDefault();
              const el = textareaRef.current;
              const focused = document.activeElement === el;
              const start = focused ? el?.selectionStart ?? prompt.length : prompt.length;
              const end = focused ? el?.selectionEnd ?? prompt.length : prompt.length;
              const next = prompt.slice(0, start) + text + prompt.slice(end);
              setPrompt(next);
              const caret = start + text.length;
              requestAnimationFrame(() => {
                el?.focus();
                el?.setSelectionRange(caret, caret);
              });
            }}
          >
            <SlashCommandMenu
              open={slashOpen}
              query={slashQuery}
              onPick={onSlashPick}
              onClose={() => setPrompt("")}
              anchorRef={promptAnchorRef}
            />

            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={typed ? `${typed}▏` : "Ask anything… type / for commands"}
                rows={3}
                className="resize-none text-[13px] leading-snug min-h-[72px] sm:min-h-[84px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none pl-3 pr-24 pt-2.5 pb-11 sm:pb-12 placeholder:text-muted-foreground/60 relative z-[1]"
                onKeyDown={(e) => {
                  // SlashCommandMenu owns Enter / arrows while it's visible.
                  if (slashOpen && (e.key === "Enter" || e.key === "Tab" || e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Escape")) {
                    return;
                  }
                  // Tab or → to accept ghost-text autocomplete on the slash label.
                  if (ghostSuffix && (e.key === "Tab" || e.key === "ArrowRight")) {
                    const el = textareaRef.current;
                    if (el && el.selectionStart === prompt.length) {
                      e.preventDefault();
                      setPrompt(prompt + ghostSuffix);
                      return;
                    }
                  }
                  // Tab jumps to next placeholder inside the prompt template.
                  if (e.key === "Tab" && activeParam) {
                    e.preventDefault();
                    selectPlaceholder(activeParam.name);
                    return;
                  }
                  // Enter behavior is user-configurable via the settings popover.
                  //   "send"    → Enter sends, Shift+Enter = newline (default).
                  //   "newline" → Enter = newline, Cmd/Ctrl+Enter sends.
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    const mod = e.metaKey || e.ctrlKey;
                    const shouldSend =
                      settings.enterBehavior === "send"
                        ? !e.shiftKey || mod
                        : mod;
                    if (shouldSend) {
                      e.preventDefault();
                      submit();
                    }
                  }
                }}
                disabled={busy}
              />
              {/* Placeholder highlight overlay — colors <name> tokens behind the textarea text
                  so users can see exactly which slots (<topic>, <when>, <platforms>, …) still
                  need to be filled. Overlay sits behind the textarea (z-0); textarea text sits
                  on top (z-1) with matching typography so glyphs align pixel-for-pixel. */}
              {/<[a-z_-]+>/i.test(prompt) && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 pl-3 pr-24 pt-2.5 pb-11 sm:pb-12 text-[13px] leading-snug font-normal whitespace-pre-wrap break-words z-0"
                >
                  {prompt.split(/(<[a-z_-]+>)/i).map((part, i) => {
                    const m = /^<([a-z_-]+)>$/i.exec(part);
                    if (m) {
                      const tip = paramTooltip.get(m[1]) ?? m[1];
                      const isNext = activeParam?.name === m[1];
                      return (
                        <span
                          key={i}
                          title={tip}
                          className={cn(
                            "rounded-[3px] ring-1",
                            isNext
                              ? "bg-primary/25 ring-primary/60"
                              : "bg-primary/15 ring-primary/35",
                          )}
                        >
                          <span className="invisible">{part}</span>
                        </span>
                      );
                    }
                    return <span key={i} className="invisible">{part}</span>;
                  })}
                </div>
              )}
              {/* Ghost autocomplete overlay for slash command labels */}
              {ghostSuffix && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 pl-3 pr-24 pt-2.5 pb-11 sm:pb-12 text-[13px] leading-snug font-normal whitespace-pre-wrap break-words"
                >
                  <span className="invisible">{prompt}</span>
                  <span className="text-muted-foreground/50">{ghostSuffix}</span>
                  <span className="ml-2 text-[9.5px] uppercase tracking-wider text-muted-foreground/60 align-middle border border-border/60 rounded px-1 py-px">
                    Tab
                  </span>
                </div>
              )}
            </div>

            {/* Inline parameter hints for the active slash command */}
            {activeCmd?.params && activeCmd.params.length > 0 && (
              <SlashParamHints
                cmd={activeCmd}
                prompt={prompt}
                onPick={onParamPick}
                onFocusPlaceholder={(p) => selectPlaceholder(p.name)}
              />
            )}

            {/* Floating toolbar */}
            <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-2">
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground pl-1.5">
                <kbd className="px-1.5 py-0.5 rounded-md bg-muted/70 dark:bg-white/[0.06] border border-border/60 dark:border-white/[0.08] font-mono text-[9.5px] leading-none">/</kbd>
                <span className="ml-0.5 mr-2">commands</span>
                {settings.enterBehavior === "send" ? (
                  <>
                    <kbd className="px-1.5 py-0.5 rounded-md bg-muted/70 dark:bg-white/[0.06] border border-border/60 dark:border-white/[0.08] font-mono text-[9.5px] leading-none">↵</kbd>
                    <span className="ml-0.5 mr-2">send</span>
                    <kbd className="px-1.5 py-0.5 rounded-md bg-muted/70 dark:bg-white/[0.06] border border-border/60 dark:border-white/[0.08] font-mono text-[9.5px] leading-none">⇧↵</kbd>
                    <span className="ml-0.5">new line</span>
                  </>
                ) : (
                  <>
                    <kbd className="px-1.5 py-0.5 rounded-md bg-muted/70 dark:bg-white/[0.06] border border-border/60 dark:border-white/[0.08] font-mono text-[9.5px] leading-none">⌘↵</kbd>
                    <span className="ml-0.5 mr-2">send</span>
                    <kbd className="px-1.5 py-0.5 rounded-md bg-muted/70 dark:bg-white/[0.06] border border-border/60 dark:border-white/[0.08] font-mono text-[9.5px] leading-none">↵</kbd>
                    <span className="ml-0.5">new line</span>
                  </>
                )}
              </div>
              {busy ? (
                <Button
                  onClick={stop}
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 ml-auto rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Square className="h-3 w-3 fill-current" strokeWidth={2} />
                  <span className="ml-1 text-[11px] font-semibold">Stop</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    submit();
                    requestAnimationFrame(() => textareaRef.current?.focus());
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={!prompt.trim()}
                  size="sm"
                  className="h-7 px-3 ml-auto rounded-lg bg-primary text-primary-foreground shadow-[0_4px_14px_-2px_hsl(var(--primary)/0.45)] ring-1 ring-inset ring-primary-foreground/15 hover:bg-primary/90 hover:shadow-[0_6px_18px_-2px_hsl(var(--primary)/0.6)] active:scale-[0.97] disabled:opacity-40 disabled:shadow-none disabled:ring-0 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  <span className="text-[11px] font-semibold pointer-events-none">Send</span>
                  <Send className="h-3 w-3 ml-1 pointer-events-none" strokeWidth={2} />
                </Button>
              )}
            </div>
          </div>
        </div>



        {/* Suggestion chips — hidden on mobile (autotyped in placeholder), shown ≥sm */}
        <div className="hidden sm:flex px-4 py-2.5 flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              disabled={busy}
              className="group/chip text-[10.5px] pl-1.5 pr-2 py-0.5 rounded-full border border-border/60 dark:border-white/[0.06] bg-background/60 dark:bg-white/[0.03] hover:border-primary/50 hover:bg-primary/[0.06] hover:text-foreground transition-all text-muted-foreground disabled:opacity-40 inline-flex items-center gap-1"
            >
              <Sparkles className="h-2.5 w-2.5 text-primary/70 group-hover/chip:text-primary transition-colors" strokeWidth={1.75} />
              {s}
            </button>
          ))}
        </div>
        {/* Mobile spacing filler */}
        <div className="sm:hidden h-2.5" />



        {/* Latest response */}
        {latest && (
          <div className="mx-4 sm:mx-5 mb-4 rounded-2xl border border-border/60 bg-gradient-to-br from-muted/40 to-transparent p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  latest.status === "error" ? "bg-destructive" : "bg-brand-green animate-pulse",
                )} />
                {latest.status === "error" ? "Error" : "Response"}
              </div>
              <div className="flex items-center gap-1">
                {latest.text && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10.5px] cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(latest.text).then(
                        () => toast.success("Copied response"),
                        () => toast.error("Copy failed"),
                      );
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                )}
                {(latest.status === "error" || (lastPromptRef.current && latest.prompt === lastPromptRef.current)) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy || !latest.prompt}
                    className="h-6 px-2 text-[10.5px] cursor-pointer"
                    onClick={() => submit(latest.prompt)}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Retry
                  </Button>
                )}
              </div>
            </div>
            {latest.text && (
              <InlineMarkdown text={latest.text} className="text-sm text-foreground/90 space-y-1" />
            )}
            {latest.error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {latest.error}
              </div>
            )}
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
