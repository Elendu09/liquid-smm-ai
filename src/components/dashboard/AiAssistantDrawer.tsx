import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatWithAI } from "@/services/skyrank";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; text: string };

const PROMPTS = [
  "Give me 3 post ideas for this week",
  "What's my best time to post today?",
  "Suggest hashtags for a product launch",
  "Rewrite my last caption more casually",
];

/**
 * Floating AI Assistant available on every dashboard route.
 * Uses SkyRank's chat endpoint via the existing skyrank service.
 */
export function AiAssistantDrawer() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hey — I'm your AI assistant. Ask me anything about your content, schedule, or growth." },
  ]);
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = async (text: string) => {
    if (!text.trim() || pending) return;
    const next = [...messages, { role: "user" as const, text }];
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      const res = await chatWithAI(text, "gpt-4.1-mini");
      const reply = res.response ?? res.message ?? res.error ?? "Sorry, I couldn't reach the AI right now.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Something went wrong — please try again." }]);
    } finally {
      setPending(false);
    }
  };

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
                <span>AI Assistant</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </SheetTitle>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm",
                )}
              >
                {m.text}
              </div>
            ))}
            {pending && (
              <div className="bg-muted text-muted-foreground rounded-2xl rounded-bl-sm px-3 py-2 text-sm inline-flex items-center gap-2 max-w-[60%]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-[11px] px-2 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
