import { cn } from "@/lib/utils";

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] rounded",
        className
      )}
      style={{
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

export function CardShimmer() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Shimmer className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-5/6" />
        <Shimmer className="h-3 w-4/6" />
      </div>
      <div className="flex gap-2">
        <Shimmer className="h-8 w-20 rounded-lg" />
        <Shimmer className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function PageShimmer() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header shimmer */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Shimmer className="h-8 w-48" />
          <Shimmer className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-9 w-24 rounded-lg" />
          <Shimmer className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-8 w-16" />
            <Shimmer className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <CardShimmer key={i} />
        ))}
      </div>
    </div>
  );
}

export function TableShimmer() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/60 p-4 flex gap-4">
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-4 w-28" />
        <Shimmer className="h-4 w-20" />
      </div>
      {/* Rows */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="border-b border-border/60 p-4 flex gap-4 last:border-0">
          <Shimmer className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-48" />
            <Shimmer className="h-3 w-32" />
          </div>
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
