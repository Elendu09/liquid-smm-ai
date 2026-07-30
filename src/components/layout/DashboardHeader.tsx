import { Link, useNavigate } from "react-router-dom";
import { Gauge, HelpCircle, LogOut, Settings, User as UserIcon, Zap, Sparkles } from "lucide-react";
import { useState } from "react";
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
import { BrandSwitcher } from "@/components/shared/BrandSwitcher";
import { QuotaMeters } from "@/components/shared/QuotaMeters";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { SignOutDialog } from "@/components/auth/SignOutDialog";
import { useAuthUser } from "@/hooks/useAuthUser";
import { usePlan } from "@/hooks/usePlan";
import { cn } from "@/lib/utils";


interface Props {
  variant?: "desktop" | "mobile";
}

/**
 * Unified top header — brand, live credits, notifications, support, profile.
 * Rendered inside the main scroll region so it stays consistent across every
 * dashboard page for desktop, tablet, and mobile.
 */
export function DashboardHeader({ variant = "desktop" }: Props) {
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

  const isMobile = variant === "mobile";

  return (
    <>
      <header
        className={cn(
          "sticky z-30 flex items-center gap-2 border-b border-border/50 bg-background/85 backdrop-blur-xl px-3 sm:px-5",
          isMobile ? "top-0 h-14 lg:hidden" : "top-0 h-14 hidden lg:flex",
        )}
        style={{ top: "var(--demo-banner-h, 0px)" }}
      >
        {/* Brand — hidden on mobile (sidebar toggle owns the brand there) */}
        {!isMobile && (
          <Link to="/dashboard" className="flex items-center gap-2 min-w-0 mr-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-sm shadow-primary/30 ring-1 ring-primary/20">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-['Instrument_Serif'] text-2xl leading-none tracking-tight text-foreground">
              SMMSAAS<span className="italic text-primary">.</span>
            </span>
          </Link>
        )}

        <BrandSwitcher compact={isMobile} className={isMobile ? "ml-1" : "ml-1"} />

        <div className={cn("flex-1", isMobile && "min-w-0")} />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Plan usage — ${plan.name} plan`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 backdrop-blur px-3 h-8 text-xs font-medium hover:border-primary/50 transition-colors"
              >
                <Gauge className="h-3.5 w-3.5 text-primary" />
                <span>{plan.name}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <QuotaMeters />
            </PopoverContent>
          </Popover>

          <CreditsPill variant="compact" />

          {!isGuest && (
            <div className="hidden sm:block">
              <NotificationBell collapsed />
            </div>
          )}


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
      </header>
      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  );
}
