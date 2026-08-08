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
 * Figma polish: rounded overflow, subtle gradient placeholder, enhanced play button.
 */
export function MediaThumb({ url, alt = "", className, onPlay }: MediaThumbProps) {
  if (!url) return null;
  const isVideo = VIDEO_RE.test(url);

  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-muted/60 via-muted/30 to-muted/40", className)}>
      {isVideo ? (
        <>
          <video
            src={url}
            muted
            playsInline
            preload="metadata"
            aria-label={alt || "Video preview"}
            className="h-full w-full object-cover"
            poster={undefined}
          />
          {/* Play overlay — always visible, Figma-style pill with soft shadow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onPlay) onPlay(url);
              else window.open(url, "_blank", "noopener");
            }}
            className="absolute inset-0 grid place-items-center bg-black/[0.18] backdrop-blur-[0.5px] transition-colors hover:bg-black/30 group"
            aria-label="Play video"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-black shadow-[0_4px_16px_rgba(0,0,0,0.25)] ring-1 ring-black/5 transition-transform group-hover:scale-105">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </span>
            <span className="sr-only">Play video</span>
          </button>
          {/* subtle video badge */}
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white backdrop-blur">
            Video
          </span>
        </>
      ) : (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = "none";
            const fallback = el.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = "grid";
          }}
        />
      )}
      {/* fallback for broken image */}
      {!isVideo && (
        <div
          style={{ display: "none" }}
          className="absolute inset-0 place-items-center bg-gradient-to-br from-muted to-muted/60 text-muted-foreground"
        >
          <span className="text-[10px] uppercase tracking-wider">No preview</span>
        </div>
      )}
    </div>
  );
}
