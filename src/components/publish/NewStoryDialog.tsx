import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** One slide inside a multi-slide story. Kept flat/serializable for localStorage. */
export interface StorySlide {
  id: string;
  type: "image" | "poll" | "quiz" | "cta" | "text";
  caption?: string;
  mediaUrl?: string;
  /** For poll/quiz — pipe-separated options. */
  options?: string;
  /** For cta — link URL. */
  link?: string;
}

/** Full story record. Extends the lightweight seed shape used in StoryBoard. */
export interface StoryItemFull {
  id: string;
  title: string;
  slides: StorySlide[];
  scheduledAt?: string;
  status: "idea" | "ready" | "scheduled" | "live";
  createdAt: string;
}

export function NewStoryDialog({
  open,
  onOpenChange,
  onSave,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (story: StoryItemFull) => void;
  /** When set, edit mode — otherwise create mode. */
  initial?: StoryItemFull | null;
}) {
  const [title, setTitle] = useState("");
  const [slides, setSlides] = useState<StorySlide[]>([]);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setSlides(initial?.slides ?? [{ id: crypto.randomUUID(), type: "image", caption: "" }]);
    }
  }, [open, initial]);

  const addSlide = () =>
    setSlides((s) => [...s, { id: crypto.randomUUID(), type: "image", caption: "" }]);

  const updateSlide = (id: string, patch: Partial<StorySlide>) =>
    setSlides((s) => s.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl)));

  const removeSlide = (id: string) =>
    setSlides((s) => (s.length > 1 ? s.filter((sl) => sl.id !== id) : s));

  const save = () => {
    if (!title.trim() || slides.length === 0) {
      toast.error("Title and at least one slide are required.");
      return;
    }
    const record: StoryItemFull = {
      id: initial?.id ?? crypto.randomUUID(),
      title: title.trim(),
      slides,
      scheduledAt: initial?.scheduledAt,
      status: initial?.status ?? "ready",
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    onSave(record);
    toast.success(initial ? "Story updated" : `Story created with ${slides.length} slide${slides.length === 1 ? "" : "s"}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit story" : "New story"}</DialogTitle>
          <DialogDescription>
            Build a multi-slide story. Each slide can be an image, poll, quiz, CTA, or text card.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Launch day teaser" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Slides ({slides.length})</Label>
              <Button type="button" size="sm" variant="outline" onClick={addSlide}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add slide
              </Button>
            </div>

            {slides.map((s, idx) => (
              <div key={s.id} className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Slide {idx + 1}
                  </span>
                  <Select value={s.type} onValueChange={(v) => updateSlide(s.id, { type: v as StorySlide["type"] })}>
                    <SelectTrigger className="h-7 w-28 text-xs ml-auto"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="poll">Poll</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="cta">CTA</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeSlide(s.id)}
                    disabled={slides.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {(s.type === "image" || s.type === "cta") && (
                  <Input
                    placeholder={s.type === "cta" ? "https://link.example" : "Image URL"}
                    value={s.type === "cta" ? s.link ?? "" : s.mediaUrl ?? ""}
                    onChange={(e) =>
                      updateSlide(s.id, s.type === "cta" ? { link: e.target.value } : { mediaUrl: e.target.value })
                    }
                  />
                )}
                {(s.type === "poll" || s.type === "quiz") && (
                  <Input
                    placeholder="Option 1 | Option 2 | Option 3"
                    value={s.options ?? ""}
                    onChange={(e) => updateSlide(s.id, { options: e.target.value })}
                  />
                )}
                <Textarea
                  rows={2}
                  placeholder="Caption / sticker text"
                  value={s.caption ?? ""}
                  onChange={(e) => updateSlide(s.id, { caption: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{initial ? "Save changes" : "Create story"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
