import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { NetworkPreview } from "@/components/publish/NetworkPreview";
import { MediaField } from "@/components/publish/MediaField";
import { platforms as PLATFORMS } from "@/config/platforms";
import { guardWrite } from "@/hooks/useGuest";
import type { ScheduledPost } from "@/hooks/useScheduledPosts";
import { cn } from "@/lib/utils";

export interface SlotDialogValue {
  id?: string;
  caption: string;
  mediaUrl?: string;
  scheduledAt: string;
  platformIds: string[];
  hashtags?: string[];
  firstComment?: string;
  durationMin: number;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** When editing an existing post. */
  post?: ScheduledPost | null;
  /** Pre-fill timestamp for a new post created from a slot click. */
  initialSlot?: { date: Date; hour: number } | null;
  onSubmit: (v: SlotDialogValue) => void;
  onDelete?: (id: string) => void;
  getDurationMin?: (p: ScheduledPost) => number;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostSlotDialog({ open, onOpenChange, post, initialSlot, onSubmit, onDelete, getDurationMin }: Props) {
  const isEdit = !!post;
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [when, setWhen] = useState(toLocalInput(new Date().toISOString()));
  const [platformIds, setPlatformIds] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState("");
  const [firstComment, setFirstComment] = useState("");
  const [durationMin, setDurationMin] = useState(30);

  useEffect(() => {
    if (!open) return;
    if (post) {
      setCaption(post.caption);
      setMediaUrl(post.mediaUrl ?? "");
      setWhen(toLocalInput(post.scheduledAt));
      setPlatformIds(post.platformIds);
      setHashtags((post.hashtags ?? []).join(" "));
      setFirstComment(post.firstComment ?? "");
      setDurationMin(getDurationMin?.(post) ?? 30);
    } else {
      const base = initialSlot ? new Date(initialSlot.date) : new Date();
      if (initialSlot) base.setHours(initialSlot.hour, 0, 0, 0);
      setCaption("");
      setMediaUrl("");
      setWhen(toLocalInput(base.toISOString()));
      setPlatformIds([]);
      setHashtags("");
      setFirstComment("");
      setDurationMin(30);
    }
  }, [open, post, initialSlot, getDurationMin]);

  const toggle = (id: string) =>
    setPlatformIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = () => {
    if (!guardWrite(isEdit ? "edit scheduled posts" : "schedule posts")) return;
    if (!caption.trim()) return toast.error("Caption is required");
    if (platformIds.length === 0) return toast.error("Pick at least one platform");
    const iso = new Date(when).toISOString();
    onSubmit({
      id: post?.id,
      caption: caption.trim(),
      mediaUrl: mediaUrl.trim() || undefined,
      scheduledAt: iso,
      platformIds,
      hashtags: hashtags.split(/\s+/).map((h) => h.trim()).filter(Boolean),
      firstComment: firstComment.trim() || undefined,
      durationMin,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit scheduled post" : "New scheduled post"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update caption, platforms, timing, or duration." : "Fill in details for this slot."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_300px] max-h-[62vh] overflow-y-auto pr-1">
        <div className="space-y-4 py-2">

          <div>
            <Label htmlFor="pd-caption">Caption</Label>
            <Textarea id="pd-caption" rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write something great…" />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide">Platforms</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                    platformIds.includes(p.id)
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40",
                  )}
                >
                  <PlatformIcon platform={p.id} size="xs" />
                  <span className="capitalize">{p.name ?? p.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pd-when">Date & time</Label>
              <Input id="pd-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pd-dur">Duration (min)</Label>
              <Input
                id="pd-dur"
                type="number"
                min={15}
                step={15}
                value={durationMin}
                onChange={(e) => setDurationMin(Math.max(15, Number(e.target.value) || 30))}
              />
            </div>
          </div>

          <MediaField
            value={mediaUrl || undefined}
            onChange={(u) => setMediaUrl(u ?? "")}
            label="Image / video"
          />

          <div>
            <Label htmlFor="pd-tags">Hashtags (space-separated)</Label>
            <Input id="pd-tags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#launch #product" />
          </div>

          <div>
            <Label htmlFor="pd-first">First comment (optional)</Label>
            <Textarea id="pd-first" rows={2} value={firstComment} onChange={(e) => setFirstComment(e.target.value)} />
          </div>
        </div>

          <div className="py-2">
            <NetworkPreview
              caption={caption}
              mediaUrl={mediaUrl || undefined}
              hashtags={hashtags.split(/\s+/).filter(Boolean)}
              platformIds={platformIds}
              className="md:sticky md:top-0"
            />
          </div>
        </div>


        <DialogFooter className="gap-2 sm:gap-2">
          {isEdit && onDelete && post && (
            <Button
              variant="outline"
              className="mr-auto text-destructive hover:text-destructive"
              onClick={() => {
                if (!guardWrite("delete posts")) return;
                onDelete(post.id);
                onOpenChange(false);
              }}
            >
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{isEdit ? "Save changes" : "Schedule"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
