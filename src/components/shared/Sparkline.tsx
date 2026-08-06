import { cn } from "@/lib/utils";

/**
 * Tiny inline sparkline. Renders nothing when there is not enough history.
 */
export function Sparkline({
  points,
  className,
  width = 64,
  height = 20,
}: {
  points: number[];
  className?: string;
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(height - ((p - min) / span) * height).toFixed(2)}`)
    .join(" ");
  const rising = points[points.length - 1] >= points[0];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={rising ? "stroke-emerald-500" : "stroke-destructive"}
      />
    </svg>
  );
}
