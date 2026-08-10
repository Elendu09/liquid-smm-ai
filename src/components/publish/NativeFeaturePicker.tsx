import { useState } from "react";
import { CheckCircle2, MapPin, ShoppingBag, Users2, Music2, Frame, MessageCircle, Eye, BarChart3, Link2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NATIVE_FEATURES, featuresFor, type NativeFeatureKey, type PlatformId } from "@/lib/nativeFeatures";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { toast } from "sonner";

export type NativeFeatureData = {
  productTag?: string;
  collabPost?: string;
  location?: string;
  trendingAudio?: string;
  altText?: string;
  pollOptions?: string[];
  linkCard?: string;
  // coverFrame handled separately via coverFrameSec, firstComment via firstComment string
  firstCommentDelaySec?: number;
  firstCommentMode?: "immediate" | "delayed";
};

export interface NativeFeaturePickerProps {
  platforms: string[];
  selected: Record<NativeFeatureKey, boolean>;
  onToggle: (key: NativeFeatureKey, next: boolean) => void;
  data?: Partial<NativeFeatureData>;
  onDataChange?: (key: NativeFeatureKey, value: any) => void;
  className?: string;
}

const ICON_MAP: Record<NativeFeatureKey, React.ReactNode> = {
  productTag: <ShoppingBag className="h-3.5 w-3.5" />,
  collabPost: <Users2 className="h-3.5 w-3.5" />,
  location: <MapPin className="h-3.5 w-3.5" />,
  trendingAudio: <Music2 className="h-3.5 w-3.5" />,
  coverFrame: <Frame className="h-3.5 w-3.5" />,
  firstComment: <MessageCircle className="h-3.5 w-3.5" />,
  altText: <Eye className="h-3.5 w-3.5" />,
  poll: <BarChart3 className="h-3.5 w-3.5" />,
  linkCard: <Link2 className="h-3.5 w-3.5" />,
};

/**
 * Mini iOS-style switch indicator (visual only — the parent row button is
 * the real toggle, so this never nests a button inside a button). Crisp on
 * mobile where the old ON/OFF text pill clipped when shrunk.
 */
function MiniSwitch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full border transition-colors duration-200",
        on ? "border-primary bg-primary" : "border-border/70 bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute left-[3px] h-3 w-3 rounded-full bg-background shadow-sm transition-transform duration-200",
          on && "translate-x-[14px]",
        )}
      />
    </span>
  );
}

function FeatureEditor({
  featureKey,
  platforms,
  data,
  onDataChange,
}: {
  featureKey: NativeFeatureKey;
  platforms: string[];
  data?: Partial<NativeFeatureData>;
  onDataChange?: (key: NativeFeatureKey, value: any) => void;
}) {
  const update = (val: any) => onDataChange?.(featureKey, val);

  if (featureKey === "productTag") {
    return (
      <div className="mt-1.5 rounded-lg border border-border/50 bg-muted/30 p-2 space-y-1.5">
        <Label className="text-[11px] flex items-center gap-1.5">
          <ShoppingBag className="h-3 w-3 text-primary" /> Product tag — <span className="text-muted-foreground font-normal">Instagram, Facebook, TikTok</span>
        </Label>
        <Input
          placeholder="Product handle or SKU (e.g. sku:123, @shopify-handle)"
          value={data?.productTag ?? ""}
          onChange={(e) => update(e.target.value)}
          className="h-7 text-xs"
        />
        <p className="text-[9px] text-muted-foreground">We’ll attach the tag to the media on supported platforms. Unsupported platforms will ignore it.</p>
      </div>
    );
  }
  if (featureKey === "collabPost") {
    return (
      <div className="mt-1.5 rounded-lg border border-border/50 bg-muted/30 p-2 space-y-1.5">
        <Label className="text-[11px] flex items-center gap-1.5">
          <Users2 className="h-3 w-3 text-primary" /> Collaborative post — <span className="text-muted-foreground font-normal">Instagram, TikTok</span>
        </Label>
        <Input
          placeholder="Collaborator @username"
          value={data?.collabPost ?? ""}
          onChange={(e) => update(e.target.value)}
          className="h-7 text-xs"
        />
        <p className="text-[9px] text-muted-foreground">Invite a co-author so both audiences see the post.</p>
      </div>
    );
  }
  if (featureKey === "location") {
    return (
      <div className="mt-1.5 rounded-lg border border-border/50 bg-muted/30 p-2 space-y-1.5">
        <Label className="text-[11px] flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-primary" /> Location pin — <span className="text-muted-foreground font-normal">{platforms.filter((p) => ["instagram","facebook","tiktok","linkedin"].includes(p)).join(", ") || "Selected platforms"}</span>
        </Label>
        <Input
          placeholder="Search location (e.g. Soho House, Lagos)"
          value={data?.location ?? ""}
          onChange={(e) => update(e.target.value)}
          className="h-7 text-xs"
        />
        <p className="text-[9px] text-muted-foreground">Tag a place so the post surfaces in local discovery.</p>
      </div>
    );
  }
  if (featureKey === "trendingAudio") {
    return (
      <div className="mt-1.5 rounded-lg border border-border/50 bg-muted/30 p-2 space-y-1.5">
        <Label className="text-[11px] flex items-center gap-1.5">
          <Music2 className="h-3 w-3 text-primary" /> Trending audio — <span className="text-muted-foreground font-normal">TikTok, Instagram, YouTube</span>
        </Label>
        <Input
          placeholder="Audio name or trending sound ID"
          value={data?.trendingAudio ?? ""}
          onChange={(e) => update(e.target.value)}
          className="h-7 text-xs"
        />
        <p className="text-[9px] text-muted-foreground">We’ll match the platform’s trending tab and attach the sound.</p>
      </div>
    );
  }
  if (featureKey === "coverFrame") {
    return (
      <div className="mt-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2">
        <p className="text-[11px] font-medium flex items-center gap-1.5">
          <Frame className="h-3 w-3 text-amber-600" /> Custom cover frame
        </p>
        <p className="text-[9px] text-muted-foreground mt-1">Cover frame will be picked below via the video timeline — we’ve enabled it for your Reels / Shorts on supported platforms.</p>
      </div>
    );
  }
  if (featureKey === "firstComment") {
    const mode = (data as any)?.firstCommentMode ?? "immediate";
    const delay = (data as any)?.firstCommentDelaySec ?? 0;
    const setMode = (m: "immediate" | "delayed") => {
      const d = m === "immediate" ? 0 : (delay || 30);
      // Update both fields atomically via two calls — parent merges
      onDataChange?.("firstCommentMode" as any, m as any);
      onDataChange?.("firstCommentDelaySec" as any, d as any);
    };
    const setDelay = (v: number) => {
      onDataChange?.("firstCommentDelaySec" as any, v as any);
      if (v === 0) onDataChange?.("firstCommentMode" as any, "immediate" as any);
      else onDataChange?.("firstCommentMode" as any, "delayed" as any);
    };
    return (
      <div className="mt-1.5 rounded-lg border border-border/50 bg-muted/30 p-2 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium flex items-center gap-1.5">
            <MessageCircle className="h-3 w-3 text-primary" /> First comment — scheduler
          </p>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{mode==="immediate" ? "Immediate" : `${delay}s delay`}</span>
        </div>
        <p className="text-[9px] text-muted-foreground">Drops content (text, link) automatically right after a post goes live — choose immediate or timed.</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={()=> setMode("immediate")} className={`rounded-lg border p-2 text-left ${mode==="immediate" ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/40"}`}>
            <p className="text-[11px] font-semibold">Post immediately</p>
            <p className="text-[9px] text-muted-foreground">Right after publish (0s)</p>
          </button>
          <button type="button" onClick={()=> setMode("delayed")} className={`rounded-lg border p-2 text-left ${mode==="delayed" ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/40"}`}>
            <p className="text-[11px] font-semibold">Schedule delay</p>
            <p className="text-[9px] text-muted-foreground">After delay (seconds/min)</p>
          </button>
        </div>
        {mode==="delayed" && (
          <div className="flex items-center gap-2">
            <Label className="text-[11px]">Delay</Label>
            <select value={String(delay)} onChange={(e)=> setDelay(Number(e.target.value))} className="h-7 rounded-md border border-input bg-background px-2 text-xs flex-1">
              <option value="0">0s (immediate)</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
              <option value="900">15 minutes</option>
              <option value="3600">1 hour</option>
            </select>
            <span className="text-[10px] text-muted-foreground">Drops link/text after delay</span>
          </div>
        )}
        <div className="rounded-md bg-card border border-border/40 p-2 text-[10px] text-muted-foreground">
          {mode==="immediate" ? "✓ Will post first comment immediately after publish." : `⏱ Will post after ${delay}s — ensures post is live before comment.`}
        </div>
      </div>
    );
  }
  if (featureKey === "altText") {
    return (
      <div className="mt-1.5 rounded-lg border border-border/50 bg-muted/30 p-2 space-y-1.5">
        <Label className="text-[11px] flex items-center gap-1.5">
          <Eye className="h-3 w-3 text-primary" /> Alt text — accessibility
        </Label>
        <Textarea
          rows={2}
          placeholder="Describe the image for screen readers…"
          value={data?.altText ?? ""}
          onChange={(e) => update(e.target.value)}
          className="text-xs min-h-[56px]"
        />
        <p className="text-[9px] text-muted-foreground">Required by some networks. We’ll attach it where supported.</p>
      </div>
    );
  }
  if (featureKey === "poll") {
    const options = (data?.pollOptions as string[] | undefined) ?? ["", ""];
    const setOptions = (next: string[]) => update(next);
    return (
      <div className="mt-1.5 rounded-lg border border-border/50 bg-muted/30 p-2 space-y-2">
        <Label className="text-[11px] flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3 text-primary" /> Poll — X, LinkedIn, Threads
        </Label>
        <div className="space-y-1.5">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-[10px] tabular-nums text-muted-foreground w-4">{i + 1}.</span>
              <Input
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => {
                  const nxt = [...options];
                  nxt[i] = e.target.value;
                  setOptions(nxt);
                }}
                className="h-7 text-xs flex-1"
              />
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {options.length < 4 && (
          <Button type="button" variant="outline" size="sm" className="h-6 text-[11px] w-full" onClick={() => setOptions([...options, ""])}>
            <Plus className="h-3 w-3 mr-1" /> Add option
          </Button>
        )}
        <p className="text-[9px] text-muted-foreground">2–4 options — we’ll publish natively where polling is supported.</p>
      </div>
    );
  }
  if (featureKey === "linkCard") {
    return (
      <div className="mt-1.5 rounded-lg border border-border/50 bg-muted/30 p-2 space-y-1.5">
        <Label className="text-[11px] flex items-center gap-1.5">
          <Link2 className="h-3 w-3 text-primary" /> Link card
        </Label>
        <Input
          placeholder="https://example.com/promo"
          value={data?.linkCard ?? ""}
          onChange={(e) => update(e.target.value)}
          className="h-7 text-xs"
        />
        <p className="text-[9px] text-muted-foreground">We’ll generate a rich preview card on LinkedIn, Facebook, X, Threads, Pinterest.</p>
      </div>
    );
  }
  return null;
}

export function NativeFeaturePicker({ platforms, selected, onToggle, data, onDataChange, className }: NativeFeaturePickerProps) {
  if (platforms.length === 0) {
    return (
      <div className={cn("rounded-lg border border-dashed border-border/60 p-2 text-[10px] text-muted-foreground", className)}>
        Pick at least one destination to see which native features are available.
      </div>
    );
  }

  // Union: every feature supported by at least one selected platform. Toggleable and shows platform badges.
  const supported = NATIVE_FEATURES.filter((f) => platforms.some((p) => f.platforms.includes(p as PlatformId)));
  // Common: supported by ALL
  const commonKeys = new Set(
    NATIVE_FEATURES.filter((f) => platforms.every((p) => f.platforms.includes(p as PlatformId))).map((f) => f.key)
  );

  if (supported.length === 0) {
    return (
      <div className={cn("rounded-lg border border-dashed border-border/60 p-2 text-[10px] text-muted-foreground", className)}>
        No native features available for the selected platforms.
      </div>
    );
  }

  // Compact list — the wrapping dialog already provides the container chrome
  // (title + ON/OFF switch), so the picker itself stays lean.
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[9px] text-muted-foreground leading-tight">
        {supported.length} available · {Object.values(selected).filter(Boolean).length} enabled — applied only where a network supports them.
      </p>
      <div className="grid gap-1.5">
        {supported.map((f) => {
          const on = !!selected[f.key];
          const supporting = platforms.filter((p) => f.platforms.includes(p as PlatformId));
          const isCommon = commonKeys.has(f.key);
          return (
            <div key={f.key} className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  const next = !on;
                  onToggle(f.key, next);
                  if (next) {
                    toast.success(`${f.label} enabled`, {
                      description: `Will apply to ${supporting.join(", ")}${!isCommon ? " · unsupported platforms will skip it" : ""}`,
                    });
                  } else {
                    toast.info(`${f.label} disabled`);
                  }
                }}
                aria-pressed={on}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg border p-1.5 text-left transition-colors",
                  on ? "border-primary/40 bg-primary/[0.07]" : "border-border/60 hover:bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                    on ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border/60",
                  )}
                >
                  {on ? <CheckCircle2 className="h-3 w-3" /> : ICON_MAP[f.key]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <span className="block text-[11px] font-semibold leading-tight">{f.label}</span>
                    {isCommon ? (
                      <Badge variant="secondary" className="h-3.5 px-1 text-[8px] uppercase tracking-wide">All</Badge>
                    ) : (
                      <Badge variant="outline" className="h-3.5 px-1 text-[8px]">Selected only</Badge>
                    )}
                  </span>
                  <span className="mt-px block line-clamp-1 text-[10px] leading-tight text-muted-foreground">{f.description}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-0.5">
                    {supporting.map((pid) => (
                      <span key={pid} className={cn("inline-flex items-center gap-0.5 rounded-full border px-1 py-px text-[8px] leading-tight", on ? "border-primary/20 bg-primary/10 text-primary" : "border-border/60 bg-muted/40 text-muted-foreground")}>
                        <PlatformIcon platform={pid} size="xs" className="h-2.5 w-2.5" />
                        <span className="capitalize">{pid}</span>
                      </span>
                    ))}
                    {supporting.length === 0 && <span className="text-[8px] text-muted-foreground">No selected platform supports this</span>}
                  </span>
                </span>
                <MiniSwitch on={on} />
              </button>
              {on && (
                <FeatureEditor featureKey={f.key} platforms={supporting} data={data} onDataChange={onDataChange} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Empty selection helper — firstComment ON by default because most schedules use it. */
export const emptyNativeFeatureSelection = (): Record<NativeFeatureKey, boolean> => ({
  productTag: false,
  collabPost: false,
  location: false,
  trendingAudio: false,
  coverFrame: false,
  firstComment: true, // default ON per spec (because of first comment)
  altText: false,
  poll: false,
  linkCard: false,
});

/** Default data helper */
export const emptyNativeFeatureData = (): NativeFeatureData => ({
  productTag: "",
  collabPost: "",
  location: "",
  trendingAudio: "",
  altText: "",
  pollOptions: ["", ""],
  linkCard: "",
  firstCommentDelaySec: 0,
  firstCommentMode: "immediate",
});
