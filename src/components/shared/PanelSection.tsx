import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PanelSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  /** Gradient classes for the colored stroke under the header. */
  accent?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * Figma-style section panel: the container that holds cards gets a clean
 * bordered shell and a COLORED STROKE under its header (the stroke belongs to
 * the panel header, never to the cards themselves).
 *
 * Visual upgrade: softer shadow, tighter tracking, 11px description, 2px
 * gradient stroke — the header owns the color, cards stay monochrome.
 */
export function PanelSection({
  title,
  description,
  icon: Icon,
  action,
  accent = "from-primary via-primary/50 to-transparent",
  className,
  bodyClassName,
  children,
}: PanelSectionProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm shadow-[var(--shadow-premium)]",
        className,
      )}
    >
      <header className="flex flex-wrap items-center gap-3 px-4 pb-3 pt-4">
        {Icon && (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold leading-none tracking-tight">{title}</h3>
          {description && (
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </header>
      <div className={cn("h-[2px] w-full bg-gradient-to-r", accent)} aria-hidden />
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
