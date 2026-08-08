import { AlertCircle, AlertOctagon, AlertTriangle, CheckCircle2, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { validateMedia, type MediaMeta, type IssueSeverity, type MediaIssue } from "@/lib/mediaValidator";

/**
 * MediaValidatorBanner
 *
 * Fix 2.1 — full pre-publish validation. Renders a card with one row per
 * destination, listing every issue ("too long for Reels", "ratio not
 * supported", "oversize"). Surfaces the fix hint inline so the user
 * never has to dig through docs.
 */
export function MediaValidatorBanner({
  meta,
  platforms,
  onDismiss,
  onAutoAdapt,
  className,
}: {
  meta: MediaMeta | null;
  platforms: string[];
  onDismiss?: () => void;
  onAutoAdapt?: () => void;
  className?: string;
}) {
  if (!meta) return null;
  const result = validateMedia(meta, platforms);
  if (result.blockers === 0 && result.warnings === 0 && result.anyOk) {
    return (
      <div className={cn("flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3 text-xs", className)}>
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <p className="font-medium">Media fits every selected destination.</p>
        {onDismiss && <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={onDismiss}><X className="h-3 w-3" /></Button>}
      </div>
    );
  }
  return (
    <div className={cn("rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-3", className)}>
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-xs font-semibold">Heads up · {result.blockers} blocker{result.blockers === 1 ? "" : "s"}, {result.warnings} warning{result.warnings === 1 ? "" : "s"}</p>
            {onAutoAdapt && result.blockers + result.warnings > 0 && (
              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={onAutoAdapt}>
                <Lightbulb className="mr-1 h-3 w-3" /> Auto-adapt
              </Button>
            )}
          </div>
          <ul className="space-y-1.5">
            {platforms.flatMap((p) => (result.byPlatform[p as keyof typeof result.byPlatform] ?? []).map((it) => (
              <IssueRow key={it.id} issue={it} />
            )))}
          </ul>
        </div>
        {onDismiss && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}><X className="h-3 w-3" /></Button>}
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: MediaIssue }) {
  const Icon = SEVERITY_ICON[issue.severity];
  const tone = SEVERITY_TONE[issue.severity];
  return (
    <li className="flex items-start gap-2 rounded-lg border border-border/60 bg-card/80 p-2">
      <Icon className={cn("mt-0.5 h-3 w-3 shrink-0", tone)} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold leading-tight">{issue.title}</p>
        <p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{issue.detail}</p>
        {issue.fix && (
          <p className="mt-1 inline-flex items-center gap-1 text-[9px] font-medium text-primary">
            <Lightbulb className="h-2.5 w-2.5" /> {issue.fix}
          </p>
        )}
      </div>
    </li>
  );
}

const SEVERITY_ICON: Record<IssueSeverity, React.ComponentType<{ className?: string }>> = {
  ok: CheckCircle2,
  info: AlertCircle,
  warning: AlertTriangle,
  error: AlertOctagon,
};
const SEVERITY_TONE: Record<IssueSeverity, string> = {
  ok: "text-emerald-500",
  info: "text-cyan-500",
  warning: "text-amber-500",
  error: "text-rose-500",
};
