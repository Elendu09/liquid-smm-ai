import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  as?: "section" | "div";
  /** Gradient classes for the colored stroke under the header (header stroke, not card). */
  accent?: string;
  /** Optional leading icon for Figma-style header */
  icon?: React.ComponentType<{ className?: string }>;
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  as: Tag = "section",
  accent = "from-orange-500 via-pink-500 via-primary via-cyan-500 to-transparent",
  icon: Icon,
}: SectionCardProps) {
  const hasHeader = !!(title || description || actions || Icon);
  return (
    <Tag
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card/80 dark:bg-card/70 backdrop-blur-sm shadow-[var(--shadow-premium)]",
        className,
      )}
    >
      {hasHeader && (
        <>
          <header className="flex items-center gap-3 px-5 pt-4 pb-3">
            {Icon && (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <h2 className="text-[13px] font-semibold tracking-tight leading-none">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-[11px] leading-relaxed text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {actions}
              </div>
            )}
          </header>
          <div className={cn("h-[2px] w-full bg-gradient-to-r", accent)} aria-hidden />
        </>
      )}
      <div className={cn("px-5 pb-5", !hasHeader ? "pt-5" : "pt-4", bodyClassName)}>
        {children}
      </div>
    </Tag>
  );
}
