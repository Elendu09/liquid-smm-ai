import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostPreviewCardProps {
  /** Post caption — a muted placeholder line shows when empty */
  caption: string;
  /** Optional image/video URL for the media area */
  mediaUrl?: string;
  /** Display handle; falls back to "yourbrand" */
  handle?: string;
  /** Extra classes on the outer card */
  className?: string;
}

/**
 * The unified post preview card used across the Create dialogs and the
 * studio quick-preview. Always renders — an empty caption shows the
 * "Write your caption…" hint and a camera placeholder for media,
 * exactly like the earlier Instagram-style mock.
 */
export function PostPreviewCard({
  caption,
  mediaUrl,
  handle = "yourbrand",
  className,
}: PostPreviewCardProps) {
  const name = handle.replace(/^@/, "") || "yourbrand";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm",
        className,
      )}
    >
      {/* Author row */}
      <header className="flex items-center gap-2.5 border-b border-border/60 p-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 text-[10px] font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{name}</p>
          <p className="text-[10px] text-muted-foreground">Sponsored</p>
        </div>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </header>

      {/* Media area */}
      <div className="aspect-square bg-muted/50 grid place-items-center overflow-hidden">
        {mediaUrl ? (
          /\.(mp4|webm|mov|m4v)([?#]|$)/i.test(mediaUrl) ? (
            <video src={mediaUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
          ) : (
            <img src={mediaUrl} alt="Post media preview" className="h-full w-full object-cover" loading="lazy" />
          )
        ) : (
          <Camera className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
        )}
      </div>

      {/* Engagement row */}
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-3 text-foreground/80">
          <Heart className="h-5 w-5" />
          <MessageCircle className="h-5 w-5" />
          <Send className="h-5 w-5" />
          <Bookmark className="ml-auto h-5 w-5" />
        </div>
        <p className="text-xs font-semibold">1,248 likes</p>
        <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
          <span className="font-semibold">{name}</span>{" "}
          {caption.trim() ? (
            caption
          ) : (
            <span className="text-muted-foreground">Write your caption…</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default PostPreviewCard;
