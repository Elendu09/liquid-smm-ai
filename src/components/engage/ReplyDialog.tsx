import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "friendly" | "professional" | "witty";

const TONE_LABEL: Record<Tone, string> = {
  friendly: "Friendly",
  professional: "Professional",
  witty: "Witty",
};

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
  id: number;
  user: string;
  content: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  comment: Comment | null;
  onSend: (text: string) => void;
}

export function ReplyDialog({ open, onOpenChange, comment, onSend }: Props) {
  const [tone, setTone] = useState<Tone>("friendly");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTone("friendly");
    setText("");
    setBusy(false);
  }, [open]);

  const generate = (t: Tone) => {
    if (!comment) return;
    setTone(t);
    setBusy(true);
    setTimeout(() => {
      setText(draftFor(t, comment.content, comment.user));
      setBusy(false);
    }, 450);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reply to {comment?.user}</DialogTitle>
          <DialogDescription>Pick an AI tone or write your own reply.</DialogDescription>
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
              onClick={() => generate(t)}
              disabled={busy}
              className={cn("h-8")}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              {TONE_LABEL[t]}
            </Button>
          ))}
        </div>
        <div className="relative">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a reply, or pick a tone above…"
            className="min-h-[110px]"
          />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>
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
