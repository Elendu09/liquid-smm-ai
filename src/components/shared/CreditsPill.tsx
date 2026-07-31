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
          "inline-flex items-center gap-1.5 h-8 rounded-md px-2.5 text-xs font-semibold text-foreground/80 hover:bg-background hover:text-foreground transition-colors",
          low && "text-foreground",
          className,
        )}
      >
        <Zap className="h-3.5 w-3.5 fill-current" />
        <span className="tabular-nums">{balance.balance.toLocaleString()}</span>
      </Link>

    ) : (
      <Link
        to="/dashboard/settings?tab=billing"
        aria-label={`${balance.balance} credits remaining, ${usedPct}% of monthly allowance used`}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 backdrop-blur pl-2 pr-3 h-9 text-xs font-medium hover:border-foreground/40 transition-colors",
          className,
        )}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground/10">
          <Sparkles className="h-3.5 w-3.5 text-foreground" />
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
