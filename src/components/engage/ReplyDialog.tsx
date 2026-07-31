import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Sparkles, Bookmark, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { aiCreate } from "@/hooks/useAiCreate";
import { useSavedReplies } from "@/hooks/useSavedReplies";

type Tone = "friendly" | "professional" | "witty";

const TONE_LABEL: Record<Tone, string> = {
  friendly: "Friendly",
  professional: "Professional",
  witty: "Witty",
};

/** Local fallback used when the AI gateway is unavailable. */
function draftFor(tone: Tone, content: string, user: string) {
  const q = content.toLowerCase();
  const asksPrice = /(price|pricing|cost|plan)/.test(q);
  const asksLink = /(link|url|where)/.test(q);
  const asksHelp = /(help|how|start)/.test(q);
  const topic = asksPrice ? "pricing" : asksLink ? "the link" : asksHelp ? "getting started" : "your question";

  switch (tone) {
    case "friendly":
      return `Hey ${user}! 🙌 Thanks so much for reaching out about ${topic}. Happy to help — DM us and we'll walk you through it!`;
    case "professional":
      return `Hi ${user}, thanks for your interest regarding ${topic}. You can find full details on our site, or reply here and we'll follow up shortly.`;
    case "witty":
      return `${user} you legend 😄 — ${topic} is exactly the kind of thing we love talking about. Slide into the DMs and we've got you.`;
  }
}

interface Comment {
  id: number | string;
  user: string;
  content: string;
  platform?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  comment: Comment | null;
  onSend: (text: string) => void;
}

/**
 * Reply composer with AI-generated suggestions (real gateway call), manual
 * editing, and one-click "save as reusable reply" into saved replies.
 */
export function ReplyDialog({ open, onOpenChange, comment, onSend }: Props) {
  const { replies: savedReplies, save, incrementUsage, render } = useSavedReplies();
  const [tone, setTone] = useState<Tone>("friendly");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [savingName, setSavingName] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    setTone("friendly");
    setText("");
    setBusy(false);
    setSuggestions([]);
    setSavingName(null);
    setName("");
  }, [open]);

  const generate = async (t: Tone) => {
    if (!comment) return;
    setTone(t);
    setBusy(true);
    const res = await aiCreate.reply({
      message: comment.content,
      author: comment.user,
      platform: comment.platform,
      tone: t,
      count: 3,
    });
    const list = (res?.suggestions ?? []).filter(Boolean);
    const final = list.length ? list : [draftFor(t, comment.content, comment.user)];
    setSuggestions(final);
    setText((cur) => (cur.trim() ? cur : final[0]));
    setBusy(false);
  };

  const saveAsReusable = () => {
    if (!text.trim()) return;
    save({ name: name.trim() || `Reply · ${new Date().toLocaleDateString()}`, body: text.trim() });
    toast.success("Saved as reusable reply");
    setSavingName(null);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reply to {comment?.user}</DialogTitle>
          <DialogDescription>Generate AI suggestions, edit freely, or reuse a saved reply.</DialogDescription>
        </DialogHeader>
        {comment && (
          <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
            {comment.content}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {(Object.keys(TONE_LABEL) as Tone[]).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={tone === t ? "default" : "outline"}
              onClick={() => void generate(t)}
              disabled={busy}
              className={cn("h-8")}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              {TONE_LABEL[t]}
            </Button>
          ))}
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setText(s)}
                className={cn(
                  "w-full text-left rounded-lg border px-2.5 py-2 text-xs transition-colors",
                  s === text
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground hover:border-primary/40",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {savedReplies.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Saved</span>
            {savedReplies.slice(0, 5).map((r) => (
              <button
                key={r.id}
                type="button"
                title={r.body}
                onClick={() => {
                  setText(render(r.body, { name: comment?.user, platform: comment?.platform }));
                  incrementUsage(r.id);
                }}
                className="px-2 py-0.5 rounded-full border border-border/60 bg-muted/50 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                {r.name}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a reply, or generate one above…"
            className="min-h-[110px]"
          />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        {savingName !== null ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name this reply (e.g. Pricing question)"
              className="h-8 text-xs"
            />
            <Button size="sm" className="h-8" onClick={saveAsReusable}>
              <Check className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 self-start text-xs"
            disabled={!text.trim()}
            onClick={() => setSavingName("")}
          >
            <Bookmark className="h-3.5 w-3.5 mr-1" /> Save as reusable reply
          </Button>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!text.trim() || busy}
            onClick={() => { onSend(text.trim()); onOpenChange(false); }}
          >
            <Send className="h-3.5 w-3.5 mr-1" /> Send reply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
