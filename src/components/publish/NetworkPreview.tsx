import { useMemo, useState } from "react";
import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal, ImageIcon, ThumbsUp, Share2, Globe } from "lucide-react";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { CharCounter } from "@/components/publish/CharCounter";
import { countForPlatform } from "@/lib/charCount";
import { cn } from "@/lib/utils";

interface Props {
  caption: string;
  mediaUrl?: string;
  hashtags?: string[];
  platformIds: string[];
  authorName?: string;
  authorHandle?: string;
  className?: string;
}

/** Per-network character limits used for the truncation preview. */
const LIMITS: Record<string, number> = {
  x: 280,
  threads: 500,
  bluesky: 300,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  tiktok: 2200,
  youtube: 5000,
  pinterest: 500,
};

function limitFor(id: string) {
  return LIMITS[id] ?? 2200;
}

export function NetworkPreview({
  caption,
  mediaUrl,
  hashtags = [],
  platformIds,
  authorName = "Your brand",
  authorHandle = "@yourbrand",
  className,
}: Props) {
  const ids = platformIds.length ? platformIds : ["instagram"];
  const [active, setActive] = useState(ids[0]);
  const current = ids.includes(active) ? active : ids[0];

  const full = useMemo(
    () => [caption, hashtags.length ? hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ") : ""].filter(Boolean).join("\n\n"),
    [caption, hashtags],
  );

  // Fix 2.4 — use the platform-aware counter so the truncation matches what
  // each network will actually do.
  const breakdown = useMemo(() => countForPlatform(full, current), [full, current]);
  const limit = limitFor(current);
  const over = breakdown.weighted > limit;
  const shown = over ? `${full.slice(0, limit)}…` : full;

  const isFeedCard = current === "instagram" || current === "pinterest" || current === "tiktok";
  const isFacebook = current === "facebook";

  return (
    <div className={cn("rounded-xl border border-border/60 bg-muted/20 p-3 space-y-3", className)}>
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">Preview</span>
        <div className="flex items-center gap-1">
          {ids.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              aria-pressed={current === id}
              className={cn(
                "p-1.5 rounded-lg border transition-colors",
                current === id ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted",
              )}
              title={id}
            >
              <PlatformIcon platform={id} size="xs" />
            </button>
          ))}
        </div>
        <CharCounter text={full} platform={current} className="ml-auto" />
      </div>

      <div className="rounded-xl border border-border/60 bg-background overflow-hidden">
        {isFacebook ? (
          /* Facebook-style card — caption above media, compact native
             Like / Comment / Share action bar */
          <>
            <div className="flex items-center gap-2 p-2.5">
              <div className="h-7 w-7 rounded-full bg-[#1877F2]/15 grid place-items-center text-[10px] font-bold text-[#1877F2]">
                {authorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight truncate">{authorName}</p>
                <p className="text-[9px] text-muted-foreground leading-tight truncate inline-flex items-center gap-0.5">
                  Sponsored · <Globe className="h-2.5 w-2.5" />
                </p>
              </div>
              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
            </div>

            <div className="px-2.5 pb-2">
              <p className="text-xs whitespace-pre-wrap break-words leading-relaxed">
                {shown || <span className="text-muted-foreground italic">Your caption will appear here…</span>}
              </p>
            </div>

            <div className="bg-muted/50 grid place-items-center overflow-hidden max-h-44">
              {mediaUrl ? (
                <img src={mediaUrl} alt="Post media preview" className="h-full w-full max-h-44 object-cover" loading="lazy" />
              ) : (
                <ImageIcon className="my-8 h-7 w-7 text-muted-foreground/40" />
              )}
            </div>

            {/* Reactions summary — kept tiny so the card stays compact */}
            <div className="flex items-center justify-between px-2.5 pt-1.5 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#1877F2]">
                  <ThumbsUp className="h-2 w-2 text-white" />
                </span>
                1.2K
              </span>
              <span>48 comments · 12 shares</span>
            </div>

            {/* Native action bar — compact Facebook style */}
            <div className="mt-1 grid grid-cols-3 border-t border-border/60">
              {[
                { icon: ThumbsUp, label: "Like" },
                { icon: MessageCircle, label: "Comment" },
                { icon: Share2, label: "Share" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  tabIndex={-1}
                  className="flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/60"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 p-3">
              <div className="h-8 w-8 rounded-full bg-primary/15 grid place-items-center text-[11px] font-bold text-primary">
                {authorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight truncate">{authorName}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {authorHandle} · <span className="capitalize">{current}</span>
                </p>
              </div>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground ml-auto" />
            </div>

            {isFeedCard && (
              <div className="aspect-square bg-muted/50 grid place-items-center overflow-hidden">
                {mediaUrl ? (
                  <img src={mediaUrl} alt="Post media preview" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
            )}

            <div className="p-3 space-y-2">
              <p className="text-xs whitespace-pre-wrap break-words leading-relaxed">
                {shown || <span className="text-muted-foreground italic">Your caption will appear here…</span>}
              </p>
              {!isFeedCard && mediaUrl && (
                <img
                  src={mediaUrl}
                  alt="Post media preview"
                  className="rounded-lg border border-border/60 max-h-40 w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="flex items-center gap-4 pt-1 text-muted-foreground">
                <Heart className="h-3.5 w-3.5" />
                <MessageCircle className="h-3.5 w-3.5" />
                <Repeat2 className="h-3.5 w-3.5" />
                <Send className="h-3.5 w-3.5 ml-auto" />
              </div>
            </div>
          </>
        )}
      </div>

      {over && (
        <p className="text-[10px] text-destructive">
          Caption exceeds the {current} limit by {breakdown.weighted - limit} weighted characters — it will be truncated.
        </p>
      )}
    </div>
  );
}
