import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link2, History, Sparkles, ShieldCheck, Scissors, Repeat2, Globe2, MessageCircle } from "lucide-react";
import { ScheduleComposerScaffold, schedulePlatformChoices } from "@/components/publish/ScheduleComposerScaffold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { PlatformPicker } from "@/components/shared/PlatformPicker";
import { NetworkPreview } from "@/components/publish/NetworkPreview";
import { MediaField } from "@/components/publish/MediaField";
import { CaptionField } from "@/components/publish/CaptionField";
import { MediaValidatorBanner } from "@/components/publish/MediaValidatorBanner";
import { MediaFitRow } from "@/components/publish/MediaFitBadge";
import { LinkPreviewCard } from "@/components/publish/LinkPreviewCard";
import { NativeFeaturePicker, emptyNativeFeatureSelection, emptyNativeFeatureData, type NativeFeatureData } from "@/components/publish/NativeFeaturePicker";
import type { NativeFeatureKey } from "@/lib/nativeFeatures";
import { CoverFramePicker } from "@/components/publish/CoverFramePicker";
import { CharCounter } from "@/components/publish/CharCounter";
import { useAccounts } from "@/contexts/AccountContext";
import { guardWrite } from "@/hooks/useGuest";
import { usePublishOutcome } from "@/hooks/usePublishOutcome";
import type { ScheduledPost } from "@/hooks/useScheduledPosts";
import { cn } from "@/lib/utils";
import type { MediaMeta } from "@/lib/mediaValidator";

const TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "America/Chicago",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Paris",
  "Africa/Lagos",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export interface SlotDialogValue {
  id?: string;
  caption: string;
  mediaUrl?: string;
  scheduledAt: string;
  platformIds: string[];
  hashtags?: string[];
  firstComment?: string;
  /** Deprecated: kept for backwards compat with calendar resize */
  durationMin?: number;
  timezone?: string;
  /** New Phase 4 fields. */
  coverFrameSec?: number;
  nativeFeatures?: Record<NativeFeatureKey, boolean>;
  nativeFeatureData?: Partial<NativeFeatureData>;
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
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { accounts } = useAccounts();
  // Normal 5 channels by default — plus any extra connected channels.
  const availablePlatforms = useMemo(
    () => schedulePlatformChoices(accounts.map((a) => a.platformId)),
    [accounts],
  );
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [when, setWhen] = useState(toLocalInput(new Date().toISOString()));
  const [timezone, setTimezone] = useState(browserTz);
  const [platformIds, setPlatformIds] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState("");
  const [firstComment, setFirstComment] = useState("");
  // Phase 4 additions:
  const [coverFrameSec, setCoverFrameSec] = useState<number | undefined>(undefined);
  const [native, setNative] = useState<Record<NativeFeatureKey, boolean>>(emptyNativeFeatureSelection());
  const [nativeData, setNativeData] = useState<Partial<NativeFeatureData>>(emptyNativeFeatureData());
  const [nativeEnabled, setNativeEnabled] = useState(true);
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
      setTimezone((post as ScheduledPost & { timezone?: string }).timezone ?? browserTz);
      setPlatformIds(post.platformIds);
      setHashtags((post.hashtags ?? []).join(" "));
      setFirstComment(post.firstComment ?? "");
      setCoverFrameSec((post as ScheduledPost & { coverFrameSec?: number }).coverFrameSec);
      const storedNative = (post as ScheduledPost & { nativeFeatures?: Record<NativeFeatureKey, boolean> }).nativeFeatures;
      if (storedNative) {
        setNative({ ...emptyNativeFeatureSelection(), ...storedNative });
        const anyOn = Object.values(storedNative).some(Boolean);
        // default ON unless explicitly all-off after user disabled
        setNativeEnabled(anyOn || Object.keys(storedNative).length === 0 ? true : anyOn);
      } else {
        setNative(emptyNativeFeatureSelection());
        setNativeEnabled(true);
      }
      const storedData = (post as ScheduledPost & { nativeFeatureData?: Partial<NativeFeatureData> }).nativeFeatureData;
      setNativeData(storedData ?? emptyNativeFeatureData());
    } else {
      const base = initialSlot ? new Date(initialSlot.date) : new Date();
      if (initialSlot) base.setHours(initialSlot.hour, 0, 0, 0);
      setCaption("");
      setMediaUrl("");
      setWhen(toLocalInput(base.toISOString()));
      setTimezone(browserTz);
      setPlatformIds([]);
      setHashtags("");
      setFirstComment("");
      setCoverFrameSec(undefined);
      setNative(emptyNativeFeatureSelection());
      setNativeData(emptyNativeFeatureData());
      setNativeEnabled(true);
    }
  }, [open, post, initialSlot, getDurationMin, browserTz]);

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
    if (submitting) return;
    setSubmitting(true);
    try {
      const iso = new Date(when).toISOString();
      const draftId = post?.id ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `d_${Date.now()}`);
      const result = await publish({
        draftId,
        platform: platformIds[0] ?? "instagram",
        body: async () => ({ postId: draftId }),
      });
      if (result.duplicate) {
        toast.info("Already scheduled — we skipped the duplicate.");
        onOpenChange(false);
        return;
      }
      const durationToPersist = getDurationMin?.(post as ScheduledPost) ?? 30;
      onSubmit({
        id: post?.id,
        caption: caption.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
        scheduledAt: iso,
        platformIds,
        hashtags: hashtags.split(/\s+/).map((h) => h.trim()).filter(Boolean),
        firstComment: nativeEnabled && native.firstComment ? (firstComment.trim() || undefined) : undefined,
        durationMin: durationToPersist,
        timezone,
        coverFrameSec: nativeEnabled && native.coverFrame ? coverFrameSec : undefined,
        nativeFeatures: nativeEnabled ? native : emptyNativeFeatureSelection(),
        nativeFeatureData: nativeEnabled ? nativeData : undefined,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const showCoverFrame = activePlatforms.some((p) => ["instagram", "tiktok", "youtube"].includes(p)) && mediaMeta?.kind === "video" && nativeEnabled && native.coverFrame;

  return (
    <ScheduleComposerScaffold
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit scheduled post" : "New scheduled post"}
      description={
        isEdit
          ? "Update caption, platforms, timing, native features, or cover frame."
          : "Fill in details for this slot. We pre-validate media and character counts per destination."
      }
      onInsertTemplate={(t) => {
        setCaption(t.caption);
        if (t.platformIds.length) setPlatformIds(t.platformIds);
        toast.success(`Template “${t.name}” inserted`);
      }}
      preview={
        <div className="space-y-3">
          <NetworkPreview
            caption={caption}
            mediaUrl={mediaUrl || undefined}
            hashtags={hashtags.split(/\s+/).filter(Boolean)}
            platformIds={platformIds}
          />
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground">
            <p className="inline-flex items-center gap-1 font-semibold text-foreground">
              <ShieldCheck className="h-3 w-3 text-emerald-500" /> Safe to schedule
            </p>
            <p className="mt-1">
              Double-click protection is on. If you tap Schedule twice within a few seconds we'll
              keep the first one and recover the duplicate.
            </p>
            {timezone && (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-background border border-border/60 px-2 py-0.5 text-[10px]">
                <Globe2 className="h-3 w-3" /> {timezone}
              </p>
            )}
          </div>
        </div>
      }
      footer={
        <>
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
        </>
      }
    >
          <div className="space-y-4">

            <div>
              <Label htmlFor="pd-caption" className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Caption</Label>
              <CaptionField
                id="pd-caption"
                value={caption}
                onChange={setCaption}
                rows={4}
                platform={platformIds[0]}
                placeholder="Write something great…"
              />
              {platformIds.length > 0 && (
                <div className="mt-1.5">
                  <CharCounter text={caption} platform={platformIds[0]} />
                </div>
              )}
            </div>

            {nativeEnabled && native.firstComment ? (
              <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-3 py-2">
                <Label htmlFor="pd-first" className="text-[11px] font-medium flex items-center gap-1.5 mb-1">
                  <MessageCircle className="h-3 w-3 text-primary" /> First comment <span className="text-muted-foreground font-normal">(auto-posts after publish)</span>
                </Label>
                <Textarea
                  id="pd-first"
                  rows={2}
                  value={firstComment}
                  onChange={(e) => setFirstComment(e.target.value)}
                  placeholder="Drop hashtags or a link so they don't clutter the caption…"
                  className="min-h-[56px] resize-none border border-border/50 bg-background focus-visible:ring-1"
                />
              </div>
            ) : nativeEnabled && !native.firstComment ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2.5 text-center">
                <p className="text-[11px] text-muted-foreground">First comment disabled — toggle it on in Native features to add one</p>
              </div>
            ) : null}

            <LinkPreviewCard caption={caption} />

            <PlatformPicker
              selected={platformIds}
              onToggle={toggle}
              available={availablePlatforms}
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
                <Label htmlFor="pd-when" className="mb-1.5 block">Date & time</Label>
                <Input id="pd-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pd-tz" className="mb-1.5 flex items-center gap-1.5">
                  <Globe2 className="h-3 w-3 text-primary" /> Timezone
                </Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="pd-tz" className="h-9">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {[browserTz, ...TIMEZONES.filter((t) => t !== browserTz)].map((tz) => (
                      <SelectItem key={tz} value={tz} className="text-xs">
                        {tz}
                        {tz === browserTz && " · (local)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <MediaField
              value={mediaUrl || undefined}
              onChange={(u) => setMediaUrl(u ?? "")}
              label="Image / video"
            />

            {showCoverFrame && (
              <CoverFramePicker
                videoUrl={mediaUrl}
                valueSec={coverFrameSec}
                onChange={setCoverFrameSec}
                durationSec={Math.max(15, (getDurationMin?.(post as ScheduledPost) ?? 30) * 60)}
              />
            )}

            <div>
              <Label htmlFor="pd-tags" className="mb-1.5 block">Hashtags (space-separated)</Label>
              <Input id="pd-tags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#launch #product" />
            </div>

            {/* Native features switch + picker */}
            <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-2.5 py-2 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 border border-primary/20">
                    <Sparkles className="h-3 w-3 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight">Native features</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">Per-platform enhancements</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("text-[11px] font-medium", nativeEnabled ? "text-primary" : "text-muted-foreground")}>
                    {nativeEnabled ? "ON" : "OFF"}
                  </span>
                  <Switch
                    checked={nativeEnabled}
                    onCheckedChange={(v) => {
                      setNativeEnabled(!!v);
                      if (v) toast.success("Native features enabled");
                      else toast.info("Native features hidden");
                    }}
                    aria-label="Toggle native features"
                  />
                </div>
              </div>

              {nativeEnabled ? (
                <div className="p-2">
                  {activePlatforms.length > 0 ? (
                    <NativeFeaturePicker
                      platforms={activePlatforms}
                      selected={native}
                      onToggle={(k, v) => setNative((s) => ({ ...s, [k]: v }))}
                      data={nativeData}
                      onDataChange={(k, val) => setNativeData((d) => ({ ...d, [k]: val }))}
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/60 p-4 text-center">
                      <p className="text-xs text-muted-foreground">Pick at least one platform to configure native features.</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">Product tag, collab, location, poll, link card and more.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground mb-1.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Native features disabled</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-[260px] mx-auto">Turn the switch on to configure product tags, collaborations, location, trending audio, alt text, polls and link cards per platform.</p>
                  <Button size="sm" variant="outline" className="mt-3 h-7 text-xs" onClick={() => setNativeEnabled(true)}>
                    Enable native features
                  </Button>
                </div>
              )}
            </div>
          </div>
    </ScheduleComposerScaffold>
  );
}
