import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromoBannerProps {
  variant?: "gradient" | "soft";
  icon?: LucideIcon;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
  children?: ReactNode;
}

/**
 * Editorial-style promo strip used across dashboard hubs.
 * - `gradient`: high-emphasis CTA banner (indigo → violet).
 * - `soft`: low-emphasis info strip (pale blue).
 */
export function PromoBanner({
  variant = "gradient",
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  className,
  children,
}: PromoBannerProps) {
  const isGradient = variant === "gradient";

  const Cta =
    ctaLabel && (ctaHref || onCtaClick) ? (
      ctaHref ? (
        <Link
          to={ctaHref}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap",
            isGradient
              ? "bg-white text-slate-900 hover:bg-white/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={onCtaClick}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap",
            isGradient
              ? "bg-white text-slate-900 hover:bg-white/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )
    ) : null;

  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4",
        isGradient
          ? "text-white shadow-[var(--shadow-premium)]"
          : "border border-border/60 bg-[var(--gradient-banner-soft)] dark:bg-card/60 text-foreground",
        className,
      )}
      style={isGradient ? { backgroundImage: "var(--gradient-banner)" } : undefined}
    >
      {Icon && (
        <div
          className={cn(
            "flex-shrink-0 h-9 w-9 rounded-full grid place-items-center",
            isGradient ? "bg-white/15" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold leading-tight", isGradient ? "text-white" : "text-foreground")}>
          {title}
        </p>
        {description && (
          <p
            className={cn(
              "text-xs mt-0.5 leading-snug truncate sm:whitespace-normal",
              isGradient ? "text-white/80" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        )}
        {children}
      </div>
      {Cta ?? (!isGradient && (ctaHref || onCtaClick) ? (
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      ) : null)}
    </div>
  );
}
