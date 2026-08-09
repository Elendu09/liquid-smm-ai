import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Wand2, CalendarClock, Globe2, ShieldCheck, Scissors, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAccounts } from "@/contexts/AccountContext";
import { useScheduledPosts, findConflicts } from "@/hooks/useScheduledPosts";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { PlatformPicker } from "@/components/shared/PlatformPicker";
import { CaptionField } from "@/components/publish/CaptionField";
import { MediaField } from "@/components/publish/MediaField";
import { MediaValidatorBanner } from "@/components/publish/MediaValidatorBanner";
import { MediaFitRow } from "@/components/publish/MediaFitBadge";
import { LinkPreviewCard } from "@/components/publish/LinkPreviewCard";
import { NetworkPreview } from "@/components/publish/NetworkPreview";
import { CharCounter } from "@/components/publish/CharCounter";
import { CoverFramePicker } from "@/components/publish/CoverFramePicker";
import { NativeFeaturePicker, emptyNativeFeatureSelection, emptyNativeFeatureData, type NativeFeatureData } from "@/components/publish/NativeFeaturePicker";
import type { NativeFeatureKey } from "@/lib/nativeFeatures";
import { platforms as ALL_PLATFORMS } from "@/config/platforms";
import { cn } from "@/lib/utils";
import type { MediaMeta } from "@/lib/mediaValidator";

/**
 * Rich Schedule dialog for the Publish → Queue board.
 * Enhanced to match Edit (PostSlotDialog) layout with:
 *  - Caption + first comment (tied to native feature)
 *  - Media + validators + auto-adapt
 *  - Date & timezone (duration removed)
 *  - Cover frame, hashtags, native features with ON/OFF switch
 *  - Network preview on the side
 *  - Per-platform caption overrides + AI best time + conflicts
 */

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

function suggestBestTime(tz: string) {
  const now = new Date();
  const cand = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  while (cand.getDay() === 0 || cand.getDay() === 6) cand.setDate(cand.getDate() + 1);
  cand.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${cand.getFullYear()}-${pad(cand.getMonth() + 1)}-${pad(cand.getDate())}T${pad(cand.getHours())}:${pad(cand.getMinutes())}`;
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleDialog({
  open,
  onOpenChange,
  initialCaption = "",
  initialPlatformIds,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialCaption?: string;
  initialPlatformIds?: string[];
}) {
  const { accounts } = useAccounts();
  const { posts, add } = useScheduledPosts();

  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [caption, setCaption] = useState(initialCaption);
  const [firstComment, setFirstComment] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [tz, setTz] = useState(browserTz);
  const [selected, setSelected] = useState<string[]>(
    initialPlatformIds ?? (accounts[0]?.platformId ? [accounts[0].platformId] : ["instagram"]),
  );
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  // Enhanced fields to mirror edit dialog
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [hashtags, setHashtags] = useState("");
  const [coverFrameSec, setCoverFrameSec] = useState<number | undefined>(undefined);
  const [native, setNative] = useState<Record<NativeFeatureKey, boolean>>(emptyNativeFeatureSelection());
  const [nativeData, setNativeData] = useState<Partial<NativeFeatureData>>(emptyNativeFeatureData());
  const [nativeEnabled, setNativeEnabled] = useState(true);
  const [autoAdapt, setAutoAdapt] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (initialCaption) setCaption(initialCaption);
    if (initialPlatformIds?.length) setSelected(initialPlatformIds);
    // Reset transient fields when dialog reopened without initial values
    if (!initialCaption) setCaption("");
    setFirstComment("");
    setScheduledAt("");
    setTz(browserTz);
    setOverrides({});
    setMediaUrl(undefined);
    setHashtags("");
    setCoverFrameSec(undefined);
    setNative(emptyNativeFeatureSelection());
    setNativeData(emptyNativeFeatureData());
    setNativeEnabled(true);
  }, [open, initialCaption, initialPlatformIds, browserTz]);

  const conflicts = useMemo(
    () =>
      scheduledAt
        ? findConflicts(posts, {
            scheduledAt: new Date(scheduledAt).toISOString(),
            platformIds: selected,
            caption,
          })
        : [],
    [posts, scheduledAt, selected, caption],
  );

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const applyBestTime = () => {
    setScheduledAt(suggestBestTime(tz));
    toast.success("Suggested best time added");
  };

  const mediaMeta: MediaMeta | null = useMemo(() => {
    if (!mediaUrl) return null;
    const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(mediaUrl) || mediaUrl.startsWith("blob:video/");
    const probe: MediaMeta = { kind: isVideo ? "video" : "image", url: mediaUrl };
    try {
      const u = new URL(mediaUrl, "http://x");
      const w = u.searchParams.get("w");
      const h = u.searchParams.get("h");
      if (w && h) { probe.width = Number(w); probe.height = Number(h); }
    } catch {}
    return probe;
  }, [mediaUrl]);

  const activePlatforms = selected;
  const showCoverFrame = activePlatforms.some((p) => ["instagram", "tiktok", "youtube"].includes(p)) && mediaMeta?.kind === "video" && nativeEnabled && native.coverFrame;

  const submit = () => {
    if (!caption.trim() || !scheduledAt || selected.length === 0) {
      toast.error("Caption, time, and at least one platform are required.");
      return;
    }
    const platformOverrides = Object.fromEntries(
      Object.entries(overrides)
        .filter(([id, c]) => selected.includes(id) && c.trim() && c.trim() !== caption.trim())
        .map(([id, c]) => [id, { caption: c.trim() }]),
    );
    add({
      caption: caption.trim(),
      mediaUrl: mediaUrl?.trim() || undefined,
      hashtags: hashtags.split(/\s+/).map((h) => h.trim()).filter(Boolean).length ? hashtags.split(/\s+/).map((h) => h.trim()).filter(Boolean) : undefined,
      firstComment: nativeEnabled && native.firstComment ? (firstComment.trim() || undefined) : undefined,
      scheduledAt: new Date(scheduledAt).toISOString(),
      timezone: tz,
      platformIds: selected,
      platformOverrides: Object.keys(platformOverrides).length ? platformOverrides : undefined,
      coverFrameSec: nativeEnabled && native.coverFrame ? coverFrameSec : undefined,
      nativeFeatures: nativeEnabled ? native : emptyNativeFeatureSelection(),
      nativeFeatureData: nativeEnabled ? nativeData : undefined,
    } as any);
    toast.success("Scheduled");
    onOpenChange(false);
    setCaption("");
    setFirstComment("");
    setScheduledAt("");
    setOverrides({});
    setMediaUrl(undefined);
    setHashtags("");
    setCoverFrameSec(undefined);
    setNative(emptyNativeFeatureSelection());
    setNativeData(emptyNativeFeatureData());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/60 bg-primary/10">
              <CalendarClock className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-semibold tracking-tight sm:text-xl">Schedule post</DialogTitle>
              <DialogDescription className="mt-0.5">Caption, media, platforms, timezone, native features & preview.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_340px] flex-1 min-h-0">
          <div className="space-y-4 py-4 px-6 overflow-y-auto max-h-[62vh] md:max-h-[64vh] pr-3">
            <div>
              <Label htmlFor="sd-caption" className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">Caption</Label>
              <CaptionField
                id="sd-caption"
                value={caption}
                onChange={setCaption}
                rows={4}
                platform={selected[0]}
                placeholder="What's the post about?"
              />
              {selected.length > 0 && (
                <div className="mt-1.5">
                  <CharCounter text={caption} platform={selected[0]} />
                </div>
              )}
            </div>

            {nativeEnabled && native.firstComment ? (
              <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-3 py-2">
                <Label htmlFor="sd-first" className="text-[11px] font-medium flex items-center gap-1.5 mb-1">
                  <MessageCircle className="h-3 w-3 text-primary" /> First comment <span className="text-muted-foreground font-normal">(auto-posts after publish)</span>
                </Label>
                <Textarea
                  id="sd-first"
                  rows={2}
                  value={firstComment}
                  onChange={(e) => setFirstComment(e.target.value)}
                  placeholder="e.g. link in bio ↗"
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
              selected={selected}
              onToggle={toggle}
              available={ALL_PLATFORMS.map((p) => p.id)}
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
                <Label htmlFor="sd-when" className="mb-1.5 block">Date & time</Label>
                <Input id="sd-when" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sd-tz" className="mb-1.5 flex items-center gap-1.5">
                  <Globe2 className="h-3 w-3 text-primary" /> Timezone
                </Label>
                <Select value={tz} onValueChange={setTz}>
                  <SelectTrigger id="sd-tz" className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {[browserTz, ...TIMEZONES.filter((t) => t !== browserTz)].map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">{t}{t===browserTz && " · (local)"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={applyBestTime} className="w-full">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Use AI best-time (weekday · 10:00)
            </Button>

            <MediaField value={mediaUrl} onChange={(u) => setMediaUrl(u ?? undefined)} label="Image / video" />

            {showCoverFrame && (
              <CoverFramePicker videoUrl={mediaUrl} valueSec={coverFrameSec} onChange={setCoverFrameSec} durationSec={60} />
            )}

            <div>
              <Label htmlFor="sd-tags" className="mb-1.5 block">Hashtags (space-separated)</Label>
              <Input id="sd-tags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#launch #product" />
            </div>

            {/* Native features switch + picker */}
            <div className="rounded-2xl border border-border/60 bg-card/50 overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-3 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 border border-primary/20">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight">Native features</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Per-platform enhancements</p>
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
                <div className="p-3">
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
                <div className="p-6 text-center">
                  <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground mb-2">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Native features disabled</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-[260px] mx-auto">Turn the switch on to configure product tags, collaborations, location, trending audio, alt text, polls and link cards per platform.</p>
                  <Button size="sm" variant="outline" className="mt-3 h-7 text-xs" onClick={() => setNativeEnabled(true)}>
                    Enable native features
                  </Button>
                </div>
              )}
            </div>

            {selected.length > 1 && (
              <Accordion type="single" collapsible>
                <AccordionItem value="overrides" className="border rounded-lg px-3">
                  <AccordionTrigger className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <Wand2 className="h-3.5 w-3.5" /> Per-platform caption overrides
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pb-3">
                    {selected.map((id) => (
                      <div key={id} className="space-y-1">
                        <Label className="text-[11px] flex items-center gap-1.5 capitalize">
                          <PlatformIcon platform={id} size="xs" /> {id}
                        </Label>
                        <Textarea
                          rows={2}
                          placeholder={`Optional override for ${id}`}
                          value={overrides[id] ?? ""}
                          onChange={(e) => setOverrides((o) => ({ ...o, [id]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {conflicts.length > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-700 dark:text-amber-300">
                {conflicts.length} scheduling conflict{conflicts.length > 1 ? "s" : ""} — same platform within ±10min or duplicate caption within 24h.
              </div>
            )}
          </div>

          <div className="py-4 px-4 space-y-3 border-t md:border-t-0 md:border-l border-border/40 bg-muted/5 overflow-y-auto max-h-[64vh]">
            <NetworkPreview
              caption={caption}
              mediaUrl={mediaUrl}
              hashtags={hashtags.split(/\s+/).filter(Boolean)}
              platformIds={selected}
              className="md:sticky md:top-0"
            />
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-[10px] leading-relaxed text-muted-foreground">
              <p className="inline-flex items-center gap-1 font-semibold text-foreground">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> Safe to schedule
              </p>
              <p className="mt-1">
                Double-click protection is on. If you tap Schedule twice within a few seconds we'll keep the first one and recover the duplicate.
              </p>
              {tz && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-background border border-border/60 px-2 py-0.5 text-[10px]">
                  <Globe2 className="h-3 w-3" /> {tz}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/40 bg-background shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
