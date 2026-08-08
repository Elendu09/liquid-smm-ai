import { Image as ImageIcon, Mic, Smile, Film, Layers, ExternalLink } from "lucide-react";
import type { InboxMedia } from "@/pages/dashboard/views/InboxBoard";

/**
 * InboxMediaChips
 *
 * Fix 1.5 — broken DM formatting. We never drop media silently: every
 * attachment is rendered as a chip with a platform-aware icon, a short
 * label, and a fallback when the URL is missing (e.g. disappearing image,
 * voice note, sticker).
 */
export function InboxMediaChips({ media, platform }: { media: InboxMedia[]; platform?: string }) {
  if (!media?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {media.map((m, i) => {
        const Icon = MEDIA_ICON[m.kind] ?? ImageIcon;
        const label = m.label || (m.kind === "voice" ? "Voice note" : m.kind === "sticker" ? "Sticker" : m.kind === "carousel" ? "Carousel" : m.kind === "video" ? "Video" : "Image");
        return (
          <span
            key={`${m.kind}-${i}`}
            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
            title={m.url || label}
          >
            <Icon className="h-2.5 w-2.5" />
            <span className="max-w-[8rem] truncate">{label}</span>
            {m.url && (
              <a
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Open ${label} in ${platform ?? "new tab"}`}
              >
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </span>
        );
      })}
    </div>
  );
}

const MEDIA_ICON: Record<InboxMedia["kind"], React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  video: Film,
  voice: Mic,
  sticker: Smile,
  carousel: Layers,
};
