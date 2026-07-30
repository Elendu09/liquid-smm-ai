import { useState } from "react";
import { Plus, Trash2, MessageSquareQuote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSavedReplies } from "@/hooks/useSavedReplies";
import { toast } from "sonner";

/**
 * Manage the canned replies used by inbox triage. Placeholders supported:
 * {{name}}, {{handle}}, {{platform}}.
 */
export function SavedRepliesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { replies, save, remove } = useSavedReplies();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  const add = () => {
    if (!body.trim()) return;
    save({ name, body });
    setName("");
    setBody("");
    toast.success("Saved reply added");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-primary" />
            Saved replies
          </DialogTitle>
          <DialogDescription>
            Reusable snippets for fast triage. Use {"{{name}}"}, {"{{handle}}"} or {"{{platform}}"} as placeholders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {replies.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">No saved replies yet.</p>
          )}
          {replies.map((r) => (
            <div key={r.id} className="rounded-lg border border-border/60 bg-card/40 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{r.body}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{r.usageCount} uses</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    aria-label={`Delete ${r.name}`}
                    onClick={() => remove(r.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-border/60 pt-3">
          <Input
            placeholder="Reply name (e.g. Pricing question)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-xs"
          />
          <Textarea
            placeholder="Hi {{name}}, thanks for reaching out — here's the info…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="text-xs"
          />
          <Button size="sm" className="h-8 gap-1.5" onClick={add} disabled={!body.trim()}>
            <Plus className="h-3.5 w-3.5" />
            Add saved reply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
