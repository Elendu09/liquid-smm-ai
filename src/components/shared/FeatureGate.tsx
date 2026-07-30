import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { firstPlanWith, type FeatureKey } from "@/config/plans";
import { cn } from "@/lib/utils";

interface NudgeProps {
  title: string;
  description?: string;
  planName?: string;
  className?: string;
  compact?: boolean;
}

/** Inline upsell card shown wherever a feature is locked by the current plan. */
export function UpgradeNudge({ title, description, planName, className, compact }: NudgeProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-accent/[0.05] to-transparent",
        compact ? "p-4" : "p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background/60 backdrop-blur">
          <Lock className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <h3 className="font-['Instrument_Serif'] text-xl leading-tight tracking-tight">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground max-w-prose">{description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            <Button asChild size="sm" className="btn-rainbow rounded-full h-9 px-4 border-0">
              <Link to="/pricing">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {planName ? `Upgrade to ${planName}` : "Upgrade plan"}
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="rounded-full h-9 px-3 text-xs">
              <Link to="/dashboard/settings/billing">Compare plans</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GateProps {
  feature: FeatureKey;
  title: string;
  description?: string;
  children: ReactNode;
  /** Render nothing instead of a nudge when locked. */
  silent?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Renders `children` when the active plan unlocks `feature`; otherwise shows an
 * inline upgrade nudge so locked capabilities stay discoverable.
 */
export function FeatureGate({
  feature,
  title,
  description,
  children,
  silent,
  compact,
  className,
}: GateProps) {
  const { can } = usePlan();
  if (can(feature)) return <>{children}</>;
  if (silent) return null;
  return (
    <UpgradeNudge
      title={title}
      description={description}
      planName={firstPlanWith(feature).name}
      compact={compact}
      className={className}
    />
  );
}
