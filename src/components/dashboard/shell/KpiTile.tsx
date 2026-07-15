import { LucideIcon, ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiTileProps {
  label: string;
  value: string | number;
  delta?: string;
  isPositive?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export function KpiTile({
  label,
  value,
  delta,
  isPositive = true,
  icon: Icon,
  className,
}: KpiTileProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-5 hover:border-primary/40 transition-colors",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        {Icon && (
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>
        )}
        {delta && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              isPositive ? "text-brand-green" : "text-destructive",
            )}
          >
            {isPositive ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {delta}
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight">
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}
