import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HeaderAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  to?: string;
  onClick?: () => void;
  primary?: boolean;
}

const PRIMARY_CLASS =
  "group relative overflow-hidden rounded-lg border border-primary/40 bg-gradient-to-b from-primary/90 to-primary text-primary-foreground shadow-[0_4px_16px_-6px_hsl(var(--primary)/0.6)] hover:shadow-[0_8px_22px_-6px_hsl(var(--primary)/0.75)] hover:from-primary hover:to-primary/90 transition-all before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary-foreground/60 before:to-transparent";

const GHOST_CLASS =
  "group relative overflow-hidden rounded-lg border border-border/60 bg-card/60 text-foreground backdrop-blur-md hover:bg-card/80 hover:border-primary/50 hover:text-foreground transition-all before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-foreground/25 before:to-transparent";

const BASE = "w-full md:w-auto text-[11px] sm:text-xs md:text-sm px-2 sm:px-3 justify-center";

/**
 * Shared header action row — one line on every breakpoint.
 * Mobile/tablet: equal-width grid. Desktop: inline row.
 */
export function HeaderActionRow({
  actions,
  className,
}: {
  actions: HeaderAction[];
  className?: string;
}) {
  const cols =
    actions.length === 2 ? "grid-cols-2" : actions.length >= 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className={cn("grid gap-2 w-full md:w-auto md:flex md:items-center", cols, className)}>
      {actions.map((a) => {
        const Icon = a.icon;
        const content = (
          <>
            {Icon && <Icon className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            <span className="truncate">{a.label}</span>
          </>
        );
        const classes = cn(BASE, a.primary ? PRIMARY_CLASS : GHOST_CLASS);

        if (a.to) {
          return (
            <Button key={a.label} asChild size="sm" variant={a.primary ? "default" : "outline"} className={classes}>
              <Link to={a.to}>{content}</Link>
            </Button>
          );
        }
        return (
          <Button
            key={a.label}
            size="sm"
            variant={a.primary ? "default" : "outline"}
            onClick={a.onClick}
            className={classes}
          >
            {content}
          </Button>
        );
      })}
    </div>
  );
}

export const openOnboardingTour = () =>
  window.dispatchEvent(new Event("smmpilot:open-onboarding-tour"));
