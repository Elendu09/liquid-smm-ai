import { useEffect, useState } from "react";
import { StickyNote, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MentionAutocomplete } from "@/hooks/useMentions";
import { cn } from "@/lib/utils";
import type { InboxItem } from "@/pages/dashboard/views/InboxBoard";
import { useInboxMessages } from "@/hooks/useInboxMessages";

/**
 * InboxNotesDrawer
 *
 * Fix 4.4 — clunky internal notes. A small slide-over panel for leaving
 * private notes on an inbox item. Type "@" to mention a teammate; the
 * mention shows up in the audit log alongside the note.
 *
 * Notes are stored on the inbox item itself in the `notes` field (JSON
 * array). We do not mutate `data` (the remote JSON column) outside of
 * what already exists, so this works for both signed-in and guest mode.
 */
export interface InboxNote {
  id: string;
  author: string;
  text: string;
  at: string;
}

export function InboxNotesDrawer({
  item,
  open,
  onClose,
}: {
  item: InboxItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const kind = item?.kind ?? "comment";
  const { update } = useInboxMessages(kind);
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<InboxNote[]>([]);
  const [author] = useState(() => {
    try {
      const raw = localStorage.getItem("smmpilot:current-user-name");
      return raw ?? "You";
    } catch { return "You"; }
  });

  useEffect(() => {
    if (!open || !item) return;
    // Hydrate from item.notes (typed below)
    const stored = (item as InboxItem & { notes?: InboxNote[] }).notes ?? [];
    setNotes(stored);
    setText("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);

  const save = () => {
    if (!item || !text.trim()) return;
    const note: InboxNote = {
      id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `n_${Date.now()}`,
      author,
      text: text.trim(),
      at: new Date().toISOString(),
    };
    const next = [...notes, note];
    setNotes(next);
    update(item.id, { notes: next } as Partial<InboxItem>);
    setText("");
  };

  if (!item) return null;

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-[min(96vw,22rem)] border-l border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl transition-transform",
        open ? "translate-x-0" : "translate-x-full",
      )}
      role="dialog"
      aria-label={`Notes for ${item.author}`}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <StickyNote className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Internal notes</p>
            <p className="text-[10px] text-muted-foreground">{item.author} · visible to your team only</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close notes drawer">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex h-[calc(100%-8rem)] flex-col gap-2 overflow-y-auto p-3">
        {notes.length === 0 && (
          <p className="rounded-xl border border-dashed border-border/60 p-6 text-center text-[11px] text-muted-foreground">
            No notes yet. Use <span className="font-mono">@</span> to mention a teammate — they get a notification.
          </p>
        )}
        {notes.map((n) => (
          <div key={n.id} className="rounded-xl border border-border/60 bg-background/50 p-2.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">{n.author}</span>
              <span>{new Date(n.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed">{n.text}</p>
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-border/60 bg-card/95 p-3 space-y-2">
        <MentionAutocomplete
          value={text}
          onChange={setText}
          placeholder="Add a note… use @ to mention"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Notes are private to your workspace.</span>
          <Button size="sm" onClick={save} disabled={!text.trim()}>
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}
