import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaThumbProps {
  url?: string;
  alt?: string;
  className?: string;
  /** Called when a video's play overlay is clicked. */
  onPlay?: (url: string) => void;
}

const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

/**
 * Uniform media thumbnail for cards. Images render directly; videos render a
 * first-frame preview with a play overlay (never an autoplaying video).
 */
export function MediaThumb({ url, alt = "", className, onPlay }: MediaThumbProps) {
  if (!url) return null;
  const isVideo = VIDEO_RE.test(url);

  return (
    <div className={cn("relative overflow-hidden bg-muted/40", className)}>
      {isVideo ? (
        <>
          <video
            src={url}
            muted
            playsInline
            preload="metadata"
            aria-label={alt || "Video preview"}
            className="h-full w-full object-cover"
          />
          {onPlay && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onPlay(url);
              }}
              className="absolute inset-0 grid place-items-center bg-black/20 transition-colors hover:bg-black/30"
              aria-label="Play video"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-black shadow-lg transition-transform hover:scale-105">
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </span>
            </button>
          )}
        </>
      ) : (
        <img src={url} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      )}
    </div>
  );
}
