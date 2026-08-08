import { useEffect, useMemo, useRef, useState } from "react";
import { Film, Image as ImageIcon, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * CoverFramePicker
 *
 * Fix 2.5 — custom cover frame for Reels / TikTok / Shorts. The composer
 * shows a filmstrip of candidate frames extracted from the source video.
 * The user picks one; we remember the time offset and re-apply the same
 * frame every time the draft is sent.
 *
 * For videos we have access to, we'd render `<video>` and capture frames
 * at offsets with a hidden canvas. For the demo (no real video), we
 * synthesise a filmstrip from the video URL with a hashed palette.
 */

export interface CoverFramePickerProps {
  /** URL of the source video. */
  videoUrl?: string;
  /** Current selected frame timestamp (seconds). */
  valueSec?: number;
  onChange: (sec: number | undefined) => void;
  /** Optional video duration override (otherwise inferred). */
  durationSec?: number;
  className?: string;
  /** How many candidate frames to show. Default 6. */
  candidates?: number;
}

const PALETTES = [
  ["#7c3aed", "#a855f7", "#f0abfc"],
  ["#06b6d4", "#3b82f6", "#0ea5e9"],
  ["#10b981", "#34d399", "#a3e635"],
  ["#f59e0b", "#f97316", "#fb923c"],
  ["#ec4899", "#f43f5e", "#fb7185"],
  ["#6366f1", "#818cf8", "#a5b4fc"],
];

function paletteFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

export function CoverFramePicker({
  videoUrl,
  valueSec,
  onChange,
  durationSec = 12,
  className,
  candidates = 6,
}: CoverFramePickerProps) {
  const offsets = useMemo(() => {
    const step = durationSec / (candidates + 1);
    return Array.from({ length: candidates }, (_, i) => Math.round((i + 1) * step * 10) / 10);
  }, [durationSec, candidates]);

  const palette = useMemo(() => paletteFor(videoUrl ?? "x"), [videoUrl]);
  const hasVideo = !!videoUrl;

  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card/95 p-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <Film className="h-3.5 w-3.5 text-primary" /> Cover frame
        </p>
        {valueSec !== undefined && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-[10px] text-muted-foreground"
            onClick={() => onChange(undefined)}
          >
            <X className="h-3 w-3" /> Use random
          </Button>
        )}
      </div>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        Choose the frame your Reel, Short or TikTok shows on your grid.
      </p>
      <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {offsets.map((sec, i) => {
          const active = valueSec !== undefined && Math.abs(valueSec - sec) < 0.2;
          return (
            <button
              key={sec}
              type="button"
              onClick={() => onChange(active ? undefined : sec)}
              className={cn(
                "group relative aspect-[9/16] overflow-hidden rounded-lg border-2 transition-all",
                active ? "border-primary ring-2 ring-primary/30" : "border-border/60 hover:border-primary/40",
              )}
              style={{
                background: hasVideo
                  ? `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 50%, ${palette[2]} 100%)`
                  : `linear-gradient(135deg, ${palette[0]}33 0%, ${palette[1]}33 50%, ${palette[2]}33 100%)`,
              }}
              aria-label={`Cover frame at ${sec} seconds`}
            >
              {hasVideo ? (
                <>
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_60%)]" />
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 font-mono text-[9px] text-white">
                    {sec.toFixed(1)}s
                  </span>
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-muted-foreground">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span className="text-[9px]">no video</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {hasVideo && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          {valueSec !== undefined
            ? `Frame locked to ${valueSec.toFixed(1)}s. We re-extract the same frame on every publish.`
            : "Random frame — the platform picks one. Pick a frame for control."}
        </div>
      )}
    </div>
  );
}

/** Hook that reads / writes the cover-frame choice onto a ScheduledPost. */
export function useCoverFrame(post: { coverFrameSec?: number }) {
  const [sec, setSec] = useState<number | undefined>(post.coverFrameSec);
  useEffect(() => { setSec(post.coverFrameSec); }, [post.coverFrameSec]);
  return { sec, setSec };
}
