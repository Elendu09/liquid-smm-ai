import { Link } from "react-router-dom";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * Shared empty state for signed-in users when a card has no real data yet.
 * Never used in guest/demo mode — demo cards keep their synthetic visuals.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCta,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20",
        compact ? "py-6 px-4" : "py-10 px-6",
        className,
      )}
    >
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{description}</p>
      )}
      {ctaLabel && (ctaHref || onCta) && (
        ctaHref ? (
          <Button asChild size="sm" variant="outline" className="mt-1">
            <Link to={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="mt-1" onClick={onCta}>
            {ctaLabel}
          </Button>
        )
      )}
    </div>
  );
}
