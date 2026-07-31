import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gauge, HelpCircle, LogOut, Settings, User as UserIcon, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreditsPill } from "@/components/shared/CreditsPill";
import { QuotaMeters } from "@/components/shared/QuotaMeters";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { SignOutDialog } from "@/components/auth/SignOutDialog";
import { useAuthUser } from "@/hooks/useAuthUser";
import { usePlan } from "@/hooks/usePlan";
import { cn } from "@/lib/utils";

interface Props {
  compact?: boolean;
  className?: string;
}

/**
 * Shared header action cluster (plan usage, credits, notifications, support,
 * account menu) so desktop, tablet and mobile headers stay in sync.
 */
export function HeaderActions({ compact = false, className }: Props) {
  const { user, isGuest } = useAuthUser();
  const { plan } = usePlan();
  const navigate = useNavigate();
  const [signOutOpen, setSignOutOpen] = useState(false);

  const email = user?.email ?? (isGuest ? "guest@demo" : "");
  const initials =
    (user?.user_metadata?.full_name as string | undefined)
      ?.split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    email.slice(0, 2).toUpperCase() ||
    "US";

  return (
    <>
      <div className={cn("flex items-center gap-1.5 sm:gap-2", className)}>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Plan usage — ${plan.name} plan`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 backdrop-blur h-8 text-xs font-medium hover:border-primary/50 transition-colors",
                compact ? "px-2" : "px-3",
              )}
            >
              <Gauge className="h-3.5 w-3.5 text-primary" />
              {!compact && <span>{plan.name}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <QuotaMeters />
          </PopoverContent>
        </Popover>

        <CreditsPill variant="compact" />

        {!isGuest && <NotificationBell collapsed />}

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full border border-border/50 bg-card/60 hover:bg-muted"
          onClick={() => navigate("/dashboard/support")}
          aria-label="Help & Support"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="h-9 w-9 rounded-full border border-border/60 bg-gradient-to-br from-primary/15 to-primary/5 hover:border-primary/60 transition-colors inline-flex items-center justify-center text-[11px] font-semibold text-foreground"
            >
              {isGuest ? <UserIcon className="h-4 w-4 text-muted-foreground" /> : initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                {isGuest ? "Demo session" : "Signed in as"}
              </span>
              <span className="truncate text-sm font-medium text-foreground">
                {isGuest ? "Guest (read-only)" : email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard")}>
              <Sparkles className="h-4 w-4 mr-2" />
              Open workspace
            </DropdownMenuItem>
            {!isGuest && (
              <DropdownMenuItem onClick={() => navigate("/dashboard/settings?tab=billing")}>
                <Zap className="h-4 w-4 mr-2" />
                Billing & credits
              </DropdownMenuItem>
            )}
            {!isGuest && (
              <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setSignOutOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isGuest ? "Exit demo" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  );
}
