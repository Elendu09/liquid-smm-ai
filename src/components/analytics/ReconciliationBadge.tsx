import { useState } from "react";
import { CheckCircle2, AlertTriangle, AlertOctagon, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * ReconciliationBadge
 *
 * Fix 5.1 — data discrepancies. Every metric we render carries a small
 * "Matches platform" / "Drift 8%" chip with a tooltip explaining the
 * gap. The chip is honest: it doesn't pretend the numbers are perfect
 * when they aren't, and it gives the user a path to investigate.
 *
 * Drift = max(0, abs(ourValue - platformValue) / platformValue).
 */
export type ReconciliationLevel = "matches" | "close" | "drift" | "unknown";

export interface ReconciliationBadgeProps {
  /** Value we computed. */
  ours: number;
  /** Value the platform itself reported (if known). */
  platform?: number;
  /** Optional platform label, e.g. "Instagram". */
  platformLabel?: string;
  /** Last sync timestamp; used in the tooltip. */
  lastSyncedAt?: string | Date;
  className?: string;
}

export function reconciliationFor(ours: number, platform?: number): { level: ReconciliationLevel; drift: number } {
  if (platform === undefined || platform === null) return { level: "unknown", drift: 0 };
  if (platform === 0) return { level: ours === 0 ? "matches" : "drift", drift: 0 };
  const drift = Math.abs(ours - platform) / platform;
  if (drift <= 0.03) return { level: "matches", drift };
  if (drift <= 0.1) return { level: "close", drift };
  return { level: "drift", drift };
}

export function ReconciliationBadge({ ours, platform, platformLabel, lastSyncedAt, className }: ReconciliationBadgeProps) {
  const [open, setOpen] = useState(false);
  const { level, drift } = reconciliationFor(ours, platform);
  const Icon = level === "matches" ? CheckCircle2
    : level === "close" ? Info
    : level === "drift" ? AlertTriangle
    : AlertOctagon;
  const tone =
    level === "matches" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" :
    level === "close" ? "text-cyan-500 bg-cyan-500/10 border-cyan-500/30" :
    level === "drift" ? "text-amber-500 bg-amber-500/10 border-amber-500/30" :
    "text-muted-foreground bg-muted/30 border-border/60";

  const label = level === "matches" ? `Matches ${platformLabel ?? "platform"} (±${(drift * 100).toFixed(1)}%)`
    : level === "close" ? `Close (${(drift * 100).toFixed(1)}% drift)`
    : level === "drift" ? `Drift ${(drift * 100).toFixed(1)}%`
    : "Awaiting platform sync";

  const lastSync = lastSyncedAt ? new Date(lastSyncedAt) : null;
  const ageMin = lastSync ? Math.max(0, Math.round((Date.now() - lastSync.getTime()) / 60_000)) : null;

  const node = (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-medium",
        tone,
        className,
      )}
      aria-label={label}
    >
      <Icon className="h-2.5 w-2.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>{node}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-[10px]">
        {level === "matches" && (
          <p>
            We see <strong>{formatNum(ours)}</strong>
            {platform !== undefined && <> vs <strong>{formatNum(platform)}</strong> on {platformLabel ?? "the platform"}</>}.
            Drift is under 3%, which is normal (different timezones, deleted engagements, etc).
          </p>
        )}
        {level === "close" && (
          <p>
            We see <strong>{formatNum(ours)}</strong>{platform !== undefined && <> vs <strong>{formatNum(platform)}</strong></>}.
            Small drift of {(drift * 100).toFixed(1)}% — usually timezone or recent deletion.
          </p>
        )}
        {level === "drift" && (
          <p>
            <strong>{(drift * 100).toFixed(1)}% drift</strong> between us and {platformLabel ?? "the platform"}.
            Common causes: timezone mismatch, deleted posts, or our sample window.
            Open the metric inspector for the full breakdown.
          </p>
        )}
        {level === "unknown" && (
          <p>
            We don't have a comparison value from {platformLabel ?? "the platform"} yet.
            Once the next sync lands, this chip will tell you whether the numbers match.
          </p>
        )}
        {ageMin !== null && <p className="mt-1 text-muted-foreground">Last platform sync {ageMin === 0 ? "just now" : `${ageMin} min ago`}.</p>}
      </TooltipContent>
    </Tooltip>
  );
}

function formatNum(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}
