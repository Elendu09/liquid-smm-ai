import { CheckCircle2, AlertTriangle, AlertOctagon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateMedia, type MediaMeta, type PlatformId } from "@/lib/mediaValidator";

/**
 * MediaFitBadge
 *
 * Fix 2.1 — pre-publish validation chip. A compact roundel per platform
 * showing ✓ / ⚠ / ✗ for the currently-attached media. Hovering opens a
 * popover with the full list of issues. The composer uses this instead
 * of the silent "you'll find out at publish time" behaviour.
 */
export function MediaFitBadge({
  meta,
  platform,
  className,
}: {
  meta: MediaMeta | null;
  platform: string;
  className?: string;
}) {
  if (!meta) {
    return (
      <span className={cn("inline-flex h-5 items-center gap-1 rounded-full border border-dashed border-border/60 px-1.5 text-[9px] text-muted-foreground", className)}>
        <Loader2 className="h-2.5 w-2.5" /> No media
      </span>
    );
  }
  const result = validateMedia(meta, [platform]);
  const issues = result.byPlatform[platform as PlatformId] ?? [];
  const worst = issues.reduce<"ok" | "info" | "warning" | "error">((acc, i) => {
    if (i.severity === "error") return "error";
    if (i.severity === "warning" && acc !== "error") return "warning";
    if (i.severity === "info" && acc === "ok") return "info";
    return acc;
  }, "ok");

  const Icon = worst === "ok" ? CheckCircle2 : worst === "warning" ? AlertTriangle : worst === "error" ? AlertOctagon : Loader2;
  const tone =
    worst === "ok" ? "text-emerald-500" :
    worst === "warning" ? "text-amber-500" :
    worst === "error" ? "text-rose-500" : "text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full border bg-card/95 px-1.5 text-[9px] font-medium",
        worst === "ok" && "border-emerald-500/30",
        worst === "warning" && "border-amber-500/30",
        worst === "error" && "border-rose-500/30",
        worst === "info" && "border-border/60",
        tone,
        className,
      )}
      title={issues.map((i) => `${i.title} — ${i.detail}`).join("\n")}
    >
      <Icon className="h-2.5 w-2.5" /> {worst === "ok" ? "Fits" : worst === "warning" ? "Warning" : worst === "error" ? "Blocker" : "Pending"}
    </span>
  );
}

/** Renders a row of MediaFitBadges for every selected platform. */
export function MediaFitRow({ meta, platforms }: { meta: MediaMeta | null; platforms: string[] }) {
  if (!platforms.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {platforms.map((p) => <MediaFitBadge key={p} meta={meta} platform={p} />)}
    </div>
  );
}
