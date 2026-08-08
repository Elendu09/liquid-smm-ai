import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { countForPlatform, limitFor, describeRules, type PlatformId } from "@/lib/charCount";

/**
 * CharCounter
 *
 * Fix 2.4 — per-platform char counter that knows URL / hashtag / emoji
 * weights. Replaces the naive `caption.length` math that miscounts on
 * X, LinkedIn, Instagram, etc.
 */
export function CharCounter({
  text,
  platform,
  className,
}: {
  text: string;
  platform: string;
  className?: string;
}) {
  const breakdown = useMemo(() => countForPlatform(text, platform), [text, platform]);
  const limit = limitFor(platform);
  const over = breakdown.weighted > limit;
  const pct = Math.min(100, Math.round((breakdown.weighted / limit) * 100));
  // Choose tone.
  const tone = over
    ? "text-rose-500"
    : pct >= 90
    ? "text-amber-500"
    : "text-muted-foreground";

  return (
    <div
      title={describeRules(platform)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-card/95 px-2 py-0.5 text-[10px] font-medium",
        over ? "border-rose-500/30" : "border-border/60",
        tone,
        className,
      )}
    >
      <span className="tabular-nums">
        {breakdown.weighted} / {limit}
      </span>
      <div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all",
            over ? "bg-rose-500" : pct >= 90 ? "bg-amber-500" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {(breakdown.urls > 0 || breakdown.hashtags > 0 || breakdown.emoji > 0 || breakdown.mentions > 0) && (
        <span className="hidden text-[9px] text-muted-foreground sm:inline">
          {[
            breakdown.urls > 0 && `${breakdown.urls} URL${breakdown.urls === 1 ? "" : "s"}`,
            breakdown.hashtags > 0 && `${breakdown.hashtags} #${breakdown.hashtags === 1 ? "tag" : "tags"}`,
            breakdown.mentions > 0 && `${breakdown.mentions} @`,
            breakdown.emoji > 0 && `${breakdown.emoji} 😀`,
          ].filter(Boolean).join(" · ")}
        </span>
      )}
    </div>
  );
}

/** Per-platform counter for a list of platforms (the worst tone wins). */
export function MultiCharCounter({ text, platforms, className }: { text: string; platforms: string[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {platforms.map((p) => <CharCounter key={p} text={text} platform={p as PlatformId} />)}
    </div>
  );
}
