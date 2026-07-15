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
        "rounded-xl sm:rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm p-3 sm:p-4 lg:p-5 hover:border-primary/40 transition-colors",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        {Icon && (
          <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-primary/10">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
          </div>
        )}
        {delta && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold",
              isPositive ? "text-brand-green" : "text-destructive",
            )}
          >
            {isPositive ? (
              <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            ) : (
              <ArrowDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            )}
            {delta}
          </div>
        )}
      </div>
      <div className="mt-2 sm:mt-3 lg:mt-4">
        <div className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
          {value}
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">
          {label}
        </div>
      </div>
    </div>
  );
}
