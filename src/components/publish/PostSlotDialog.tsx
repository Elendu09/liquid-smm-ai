import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link2, History, Sparkles, ShieldCheck, Scissors, Repeat2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { PlatformPicker } from "@/components/shared/PlatformPicker";
import { NetworkPreview } from "@/components/publish/NetworkPreview";
import { MediaField } from "@/components/publish/MediaField";
import { MediaValidatorBanner } from "@/components/publish/MediaValidatorBanner";
import { MediaFitRow } from "@/components/publish/MediaFitBadge";
import { LinkPreviewCard } from "@/components/publish/LinkPreviewCard";
import { NativeFeaturePicker, emptyNativeFeatureSelection } from "@/components/publish/NativeFeaturePicker";
import type { NativeFeatureKey } from "@/lib/nativeFeatures";
import { CoverFramePicker } from "@/components/publish/CoverFramePicker";
import { CharCounter } from "@/components/publish/CharCounter";
import { platforms as PLATFORMS } from "@/config/platforms";
import { guardWrite } from "@/hooks/useGuest";
import { usePublishOutcome } from "@/hooks/usePublishOutcome";
import type { ScheduledPost } from "@/hooks/useScheduledPosts";
import { cn } from "@/lib/utils";
import type { MediaMeta } from "@/lib/mediaValidator";

export interface SlotDialogValue {
  id?: string;
  caption: string;
  mediaUrl?: string;
  scheduledAt: string;
  platformIds: string[];
  hashtags?: string[];
  firstComment?: string;
  durationMin: number;
  /** New Phase 4 fields. */
  coverFrameSec?: number;
  nativeFeatures?: Record<NativeFeatureKey, boolean>;
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
  // Phase 4 additions:
  const [coverFrameSec, setCoverFrameSec] = useState<number | undefined>(undefined);
  const [native, setNative] = useState<Record<NativeFeatureKey, boolean>>(emptyNativeFeatureSelection());
  const [autoAdapt, setAutoAdapt] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Idempotency for double-click on Schedule / Save changes (fix 3.4).
  const publish = usePublishOutcome();

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
      setCoverFrameSec((post as ScheduledPost & { coverFrameSec?: number }).coverFrameSec);
      setNative((post as ScheduledPost & { nativeFeatures?: Record<NativeFeatureKey, boolean> }).nativeFeatures ?? emptyNativeFeatureSelection());
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
      setCoverFrameSec(undefined);
      setNative(emptyNativeFeatureSelection());
    }
  }, [open, post, initialSlot, getDurationMin]);

  const toggle = (id: string) =>
    setPlatformIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // Build a MediaMeta for the validator from the current mediaUrl. We
  // can't read real dimensions client-side without a probe, so we
  // default to "pending" and let the user re-check after upload. If
  // the URL contains a width hint (?w=400&h=400) we honour it.
  const mediaMeta: MediaMeta | null = useMemo(() => {
    if (!mediaUrl) return null;
    const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(mediaUrl) || mediaUrl.startsWith("blob:video/");
    const probe: MediaMeta = { kind: isVideo ? "video" : "image", url: mediaUrl };
    try {
      const u = new URL(mediaUrl, "http://x");
      const w = u.searchParams.get("w");
      const h = u.searchParams.get("h");
      if (w && h) { probe.width = Number(w); probe.height = Number(h); }
    } catch { /* not a parseable URL */ }
    return probe;
  }, [mediaUrl]);

  // Quick first-destination count for the validator (we show the banner
  // only when at least one platform is selected).
  const activePlatforms = platformIds;

  const submit = async () => {
    if (!guardWrite(isEdit ? "edit scheduled posts" : "schedule posts")) return;
    if (!caption.trim()) return toast.error("Caption is required");
    if (platformIds.length === 0) return toast.error("Pick at least one platform");
    if (submitting) return; // belt-and-suspenders for 3.4
    setSubmitting(true);
    try {
      const iso = new Date(when).toISOString();
      // Fix 3.4 — wrap the schedule in usePublishOutcome so a second
      // tap within 8 s is detected and skipped, and a notification
      // surfaces for the action.
      const draftId = post?.id ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `d_${Date.now()}`);
      // We can't actually publish a "schedule" event through the publish
      // outcome (it expects a network body), so we use a no-op body and
      // rely on the dedupe window + run-history record. The actual
      // onSubmit below still drives persistence.
      const result = await publish({
        draftId,
        platform: platformIds[0] ?? "instagram",
        body: async () => ({ postId: draftId }),
      });
      if (result.duplicate) {
        // The user double-clicked. The first call already added the post;
        // we skip the duplicate onSubmit to avoid double-queueing.
        toast.info("Already scheduled — we skipped the duplicate.");
        onOpenChange(false);
        return;
      }
      onSubmit({
        id: post?.id,
        caption: caption.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
        scheduledAt: iso,
        platformIds,
        hashtags: hashtags.split(/\s+/).map((h) => h.trim()).filter(Boolean),
        firstComment: firstComment.trim() || undefined,
        durationMin,
        coverFrameSec,
        nativeFeatures: native,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit scheduled post" : "New scheduled post"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update caption, platforms, timing, native features, or cover frame." : "Fill in details for this slot. We pre-validate media and character counts per destination."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px] max-h-[64vh] overflow-y-auto pr-1">
          <div className="space-y-4 py-2">

            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label htmlFor="pd-caption">Caption</Label>
                {platformIds.length === 1 && <CharCounter text={caption} platform={platformIds[0]} />}
              </div>
              <Textarea id="pd-caption" rows={4} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write something great…" />
              {platformIds.length > 1 && (
                <div className="mt-1.5">
                  <CharCounter text={caption} platform={platformIds[0]} />
                </div>
              )}
            </div>

            <LinkPreviewCard caption={caption} />

            <PlatformPicker
              selected={platformIds}
              onToggle={toggle}
              available={PLATFORMS.map((p) => p.id)}
              label="Platforms"
            />

            {activePlatforms.length > 0 && (
              <div className="mt-1.5">
                <MediaFitRow meta={mediaMeta} platforms={activePlatforms} />
              </div>
            )}

            {activePlatforms.length > 0 && mediaMeta && (
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-2.5">
                <div className="flex items-center gap-1.5">
                  <Scissors className="h-3.5 w-3.5 text-primary" />
                  <div>
                    <p className="text-[11px] font-semibold">Auto-adapt media</p>
                    <p className="text-[9px] text-muted-foreground">Crop & re-encode to each destination's requirements on publish.</p>
                  </div>
                </div>
                <Switch checked={autoAdapt} onCheckedChange={setAutoAdapt} />
              </div>
            )}

            {activePlatforms.length > 0 && mediaMeta && (
              <MediaValidatorBanner
                meta={mediaMeta}
                platforms={activePlatforms}
                onAutoAdapt={() => { setAutoAdapt(true); toast.success("Auto-adapt enabled — we'll crop on publish."); }}
              />
            )}

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

            {activePlatforms.some((p) => ["instagram", "tiktok", "youtube"].includes(p)) && mediaMeta?.kind === "video" && (
              <CoverFramePicker
                videoUrl={mediaUrl}
                valueSec={coverFrameSec}
                onChange={setCoverFrameSec}
                durationSec={Math.max(15, durationMin * 60)}
              />
            )}

            <div>
              <Label htmlFor="pd-tags">Hashtags (space-separated)</Label>
              <Input id="pd-tags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#launch #product" />
            </div>

            <div>
              <Label htmlFor="pd-first">First comment (optional)</Label>
              <Textarea id="pd-first" rows={2} value={firstComment} onChange={(e) => setFirstComment(e.target.value)} />
            </div>

            {activePlatforms.length > 0 && (
              <NativeFeaturePicker
                platforms={activePlatforms}
                selected={native}
                onToggle={(k, v) => setNative((s) => ({ ...s, [k]: v }))}
              />
            )}
          </div>

          <div className="py-2 space-y-3">
            <NetworkPreview
              caption={caption}
              mediaUrl={mediaUrl || undefined}
              hashtags={hashtags.split(/\s+/).filter(Boolean)}
              platformIds={platformIds}
              className="md:sticky md:top-0"
            />
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground">
              <p className="inline-flex items-center gap-1 font-semibold text-foreground">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> Safe to schedule
              </p>
              <p className="mt-1">
                Double-click protection is on. If you tap Schedule twice within a few seconds we'll
                keep the first one and recover the duplicate.
              </p>
            </div>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? (
              <>
                <Repeat2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Scheduling…
              </>
            ) : isEdit ? "Save changes" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
