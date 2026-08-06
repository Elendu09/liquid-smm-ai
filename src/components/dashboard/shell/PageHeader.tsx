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
        "relative isolate flex flex-col gap-3 pb-5 mb-6 border-b border-border/40 dark:border-border/60",
        className,
      )}
    >
      {/* Ambient glow backing the title — adds depth without changing
          the layout. Pointer-events: none so it never intercepts clicks. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-4 -top-6 -bottom-6 -z-10 liquid-orb"
        style={{
          background:
            "radial-gradient(45% 60% at 25% 30%, hsl(var(--primary) / 0.16) 0%, hsl(var(--primary) / 0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-0 h-32 w-64 -z-10 liquid-orb"
        style={{
          animationDelay: "3s",
          background:
            "radial-gradient(40% 60% at 60% 40%, hsl(var(--brand-purple) / 0.14) 0%, hsl(var(--brand-purple) / 0) 70%)",
        }}
      />
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
          <div className="flex flex-wrap items-center gap-2 md:flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
