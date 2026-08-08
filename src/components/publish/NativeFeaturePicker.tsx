import { CheckCircle2, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NATIVE_FEATURES, commonFeatures, featuresFor, type NativeFeatureKey, type PlatformId } from "@/lib/nativeFeatures";

/**
 * NativeFeaturePicker
 *
 * Fix 2.2 — exposes every first-class publishing feature the selected
 * platforms support (product tag, collab post, location, trending audio,
 * cover frame, first comment, alt text, poll, link card). The user sees
 * which features are available per destination without having to guess.
 *
 * A feature is "common" if every selected platform supports it. We list
 * common features as switches the user can toggle, and per-platform
 * features as chips so they understand which destination would use them.
 */

export interface NativeFeaturePickerProps {
  platforms: string[];
  selected: Record<NativeFeatureKey, boolean>;
  onToggle: (key: NativeFeatureKey, next: boolean) => void;
  className?: string;
}

export function NativeFeaturePicker({ platforms, selected, onToggle, className }: NativeFeaturePickerProps) {
  const common = commonFeatures(platforms);
  if (platforms.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-border/60 p-3 text-[10px] text-muted-foreground", className)}>
        Pick at least one destination to see which native features are available.
      </div>
    );
  }
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card/95 p-3", className)}>
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Native features
        </p>
        <span className="text-[9px] text-muted-foreground">{common.length} available across all destinations</span>
      </div>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {common.map((f) => {
          const on = !!selected[f.key];
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onToggle(f.key, !on)}
              aria-pressed={on}
              className={cn(
                "flex items-start gap-2 rounded-xl border p-2 text-left transition-colors",
                on ? "border-primary/40 bg-primary/[0.05]" : "border-border/60 hover:bg-muted/40",
              )}
            >
              <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md", on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {on ? <CheckCircle2 className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold leading-tight">{f.label}</span>
                <span className="mt-0.5 block line-clamp-2 text-[9px] text-muted-foreground">{f.description}</span>
              </span>
            </button>
          );
        })}
      </div>
      {/* Per-platform chips for features that are NOT shared. */}
      {platforms.map((p) => {
        const hereOnly = featuresFor(p).filter((f) => !common.some((c) => c.key === f.key));
        if (!hereOnly.length) return null;
        return (
          <div key={p} className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Only on {p}</span>
            {hereOnly.map((f) => (
              <Badge key={f.key} variant="outline" className="text-[9px]">
                {f.label}
              </Badge>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** Empty selection helper. */
export const emptyNativeFeatureSelection = (): Record<NativeFeatureKey, boolean> => ({
  productTag: false,
  collabPost: false,
  location: false,
  trendingAudio: false,
  coverFrame: false,
  firstComment: false,
  altText: false,
  poll: false,
  linkCard: false,
});
