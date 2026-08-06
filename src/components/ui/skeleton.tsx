import { cn } from "@/lib/utils";

/**
 * Skeleton — a frosted glass placeholder with a continuous liquid
 * shimmer. Replaces the prior `animate-pulse` placeholder with a
 * moving specular gradient so loading feels closer to the rest of
 * the glass design system.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("liquid-skeleton", className)} {...props} />;
}

export { Skeleton };
