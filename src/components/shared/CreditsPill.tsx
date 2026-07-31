import { Link } from "react-router-dom";
import { Sparkles, Zap } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useAuthUser } from "@/hooks/useAuthUser";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  variant?: "pill" | "compact";
  className?: string;
}

/**
 * Live credits indicator. Hidden for guests. Links to Settings → Billing.
 */
export function CreditsPill({ variant = "pill", className }: Props) {
  const { user, isGuest } = useAuthUser();
  const { balance, usedPct } = useCredits();
  if (!user || isGuest) return null;

  const low = balance.balance <= Math.max(20, Math.round(balance.monthlyAllowance * 0.1));

  const body =
    variant === "compact" ? (
      <Link
        to="/dashboard/settings?tab=billing"
        aria-label={`${balance.balance} credits remaining`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full h-8 px-3 text-xs font-semibold bg-secondary text-secondary-foreground ring-1 ring-border/60 shadow-sm hover:ring-primary/50 transition-colors",
          low && "ring-amber-500/60 text-amber-500",
          className,
        )}
      >
        <Zap className={cn("h-3.5 w-3.5 fill-current", low ? "text-amber-500" : "text-primary")} />
        <span className="tabular-nums">{balance.balance.toLocaleString()}</span>
      </Link>

    ) : (
      <Link
        to="/dashboard/settings?tab=billing"
        aria-label={`${balance.balance} credits remaining, ${usedPct}% of monthly allowance used`}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 backdrop-blur pl-2 pr-3 h-9 text-xs font-medium hover:border-primary/50 transition-colors",
          low && "border-amber-500/50",
          className,
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full bg-primary/10",
            low && "bg-amber-500/15",
          )}
        >
          <Sparkles className={cn("h-3.5 w-3.5", low ? "text-amber-500" : "text-primary")} />
        </span>
        <span className="tabular-nums font-semibold">{balance.balance.toLocaleString()}</span>
        <span className="text-muted-foreground uppercase tracking-widest text-[10px] hidden sm:inline">
          credits
        </span>
      </Link>
    );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{body}</TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {balance.usedThisMonth.toLocaleString()} / {balance.monthlyAllowance.toLocaleString()} used
        this month
      </TooltipContent>
    </Tooltip>
  );
}
