import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  kicker?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  kicker,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 pb-5 mb-6 border-b border-border/40 dark:border-border/60",
        className,
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {kicker && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary mb-2">
              {kicker}
            </p>
          )}
          <h1 className="font-['Instrument_Serif'] font-normal tracking-tight leading-[0.95] text-4xl sm:text-5xl lg:text-6xl text-foreground truncate">
            {title}<span className="italic text-primary">.</span>
          </h1>
          {description && (
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:w-auto md:flex-shrink-0 md:justify-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
