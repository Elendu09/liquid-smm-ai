import { ReactNode } from "react";
import { LucideIcon, ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiTileProps {
  label: string;
  value: string | number;
  delta?: string;
  isPositive?: boolean;
  icon?: LucideIcon;
  className?: string;
  /** Optional visual (e.g. a sparkline) rendered in the tile's top-right slot. */
  visual?: ReactNode;
}

export function KpiTile({
  label,
  value,
  delta,
  isPositive = true,
  icon: Icon,
  className,
  visual,
}: KpiTileProps) {

  return (
    <div
      className={cn(
        "rounded-xl sm:rounded-2xl border border-border/60 bg-card dark:bg-card/70 dark:backdrop-blur-sm p-3 sm:p-4 lg:p-5 shadow-[var(--shadow-premium)] hover:border-primary/40 hover:shadow-[var(--shadow-premium-lg)] transition-all",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        {Icon && (
          <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-primary/10">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
          </div>
        )}
        {visual}
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
        <div className="font-['Instrument_Serif'] text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight leading-none text-foreground">
          {value}
        </div>
        <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-muted-foreground mt-1.5 leading-snug">
          {label}
        </div>
      </div>
    </div>
  );
}
