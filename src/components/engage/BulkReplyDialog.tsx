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

function draftFor(tone: Tone, user: string) {
  switch (tone) {
    case "friendly":
      return `Hey ${user}! 🙌 Thanks so much for the comment — really appreciate you engaging with us!`;
    case "professional":
      return `Hi ${user}, thanks for your comment. We appreciate the engagement and will follow up if needed.`;
    case "witty":
      return `${user} you legend 😄 — thanks for dropping by, comments like yours make our day.`;
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
  comments: Comment[];
  onSend: (perComment: { id: number; text: string }[]) => void;
}

export function BulkReplyDialog({ open, onOpenChange, comments, onSend }: Props) {
  const [tone, setTone] = useState<Tone>("friendly");
  const [template, setTemplate] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTone("friendly");
    setTemplate("");
    setBusy(false);
  }, [open]);

  const generate = (t: Tone) => {
    setTone(t);
    setBusy(true);
    setTimeout(() => {
      setTemplate(draftFor(t, "{{user}}"));
      setBusy(false);
    }, 400);
  };

  const send = () => {
    const payload = comments.map((c) => ({
      id: c.id,
      text: template.replaceAll("{{user}}", c.user),
    }));
    onSend(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk reply to {comments.length} comment{comments.length === 1 ? "" : "s"}</DialogTitle>
          <DialogDescription>
            Pick an AI tone or write a template. Use <code className="text-xs">{"{{user}}"}</code> to insert each handle.
          </DialogDescription>
        </DialogHeader>

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
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="Write a reply template, or pick a tone above…"
            className="min-h-[110px]"
          />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        {template && comments[0] && (
          <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Preview for {comments[0].user}</p>
            {template.replaceAll("{{user}}", comments[0].user)}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!template.trim() || busy || comments.length === 0} onClick={send}>
            <Send className="h-3.5 w-3.5 mr-1" /> Send {comments.length} repl{comments.length === 1 ? "y" : "ies"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
