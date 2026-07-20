import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bot, Send, Sparkles, X, Loader2, RotateCcw, Copy, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatWithAI } from "@/services/skyrank";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; text: string; ts: number };

const STORAGE_KEY = "smmpilot:ai-assistant:history";

/** Route-aware quick prompts — surfaces the most useful actions for the current page. */
function promptsFor(pathname: string): string[] {
  if (pathname.includes("/publish")) {
    return [
      "What should I schedule next?",
      "Best time to post today?",
      "Draft a caption for a product launch",
      "Suggest 5 recycle-ready evergreen ideas",
    ];
  }
  if (pathname.includes("/analytics")) {
    return [
      "Summarize this week's performance",
      "Which posts overperformed?",
      "Recommend 3 hashtags to test",
      "Compare me to competitors",
    ];
  }
  if (pathname.includes("/engage")) {
    return [
      "Draft a friendly reply for a complaint",
      "Summarize my unread DMs",
      "Suggest quick-reply templates",
      "Which comments need attention?",
    ];
  }
  if (pathname.includes("/create")) {
    return [
      "Rewrite my last caption more casually",
      "Generate 5 hook ideas for a Reel",
      "Suggest a brand-voice profile",
      "Turn this into an A/B variant",
    ];
  }
  return [
    "Give me 3 post ideas for this week",
    "What's my best time to post today?",
    "Summarize today's activity",
    "Suggest hashtags for a product launch",
  ];
}

function contextFor(pathname: string): string {
  const seg = pathname.replace(/^\/dashboard\/?/, "").split("/")[0] || "home";
  return `You are the user's in-app AI copilot for a social media platform. They are currently on the "${seg}" area (${pathname}). Keep answers concise, actionable, and formatted with short bullet points when helpful.`;
}

function loadHistory(): Msg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Msg[];
    return Array.isArray(arr) ? arr.slice(-40) : [];
  } catch {
    return [];
  }
}

/**
 * Floating AI Assistant available on every dashboard route.
 * Route-aware prompts + persistent history + copy/reset controls.
 */
export function AiAssistantDrawer() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>(() => loadHistory());
  const [pending, setPending] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const prompts = useMemo(() => promptsFor(pathname), [pathname]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, open]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || pending) return;
    const userMsg: Msg = { role: "user", text, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPending(true);
    try {
      const contextual = `${contextFor(pathname)}\n\nUser: ${text}`;
      const res = await chatWithAI(contextual, "gpt-4.1-mini");
      const reply = res.response ?? res.message ?? res.error ?? "Sorry, I couldn't reach the AI right now.";
      setMessages((m) => [...m, { role: "assistant", text: reply, ts: Date.now() }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Something went wrong — please try again.", ts: Date.now() },
      ]);
    } finally {
      setPending(false);
    }
  };

  const reset = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const copyMsg = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx((c) => (c === i ? null : c)), 1500);
    } catch {
      /* ignore */
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Floating trigger — bottom-left so it doesn't collide with HelpWidget (bottom-right) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI Assistant"
        className="fixed z-40 bottom-24 lg:bottom-6 left-4 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-95 transition-all inline-flex items-center justify-center"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md flex flex-col p-0 [&>button.absolute]:hidden"
        >
          <SheetHeader className="p-4 border-b border-border/60">
            <SheetTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 inline-flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <span className="flex flex-col items-start">
                  <span className="text-sm font-semibold">AI Assistant</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    Context: {pathname.replace("/dashboard/", "") || "home"}
                  </span>
                </span>
              </span>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={reset}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Clear conversation"
                    title="Clear conversation"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {isEmpty && (
              <div className="text-center py-6 space-y-2">
                <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 inline-flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium">Hey — how can I help?</p>
                <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
                  I know what page you're on and can act on it. Try one of the suggestions below.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("group", m.role === "user" ? "flex justify-end" : "flex justify-start")}>
                <div
                  className={cn(
                    "relative max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm",
                  )}
                >
                  {m.text}
                  {m.role === "assistant" && (
                    <button
                      onClick={() => copyMsg(m.text, i)}
                      className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-background border border-border/60 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label="Copy"
                    >
                      {copiedIdx === i ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {pending && (
              <div className="bg-muted text-muted-foreground rounded-2xl rounded-bl-sm px-3 py-2 text-sm inline-flex items-center gap-2 max-w-[60%]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </div>
            )}
          </div>

          {(isEmpty || messages.length <= 2) && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  disabled={pending}
                  className="text-[11px] px-2 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-3 border-t border-border/60 flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about content, timing, hashtags…"
              className="h-10"
              disabled={pending}
            />
            <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={pending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
