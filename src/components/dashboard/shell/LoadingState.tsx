import { cn } from "@/lib/utils";

interface LoadingStateProps {
  rows?: number;
  className?: string;
  label?: string;
}

export function LoadingState({
  rows = 3,
  className,
  label = "Loading",
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("space-y-3", className)}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl shimmer" aria-hidden="true" />
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}
