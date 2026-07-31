import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, CreditCard, LayoutDashboard, LogOut } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Marketing-header account pill shown ONLY for real authenticated users
 * (never for guests/demo). Mirrors the reference: "Open workspace →" pill
 * plus an avatar dropdown.
 */
export function HeaderAccountMenu({ className }: { className?: string }) {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Account";
  const initial = displayName.slice(0, 1).toUpperCase();

  const signOut = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-border/60 bg-card/70 p-1 pl-1 backdrop-blur-xl shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="group inline-flex h-9 items-center gap-2 rounded-full bg-background px-4 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
      >
        Open workspace
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className="inline-flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-muted"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground ring-2 ring-primary/40">
              {initial}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60 p-1.5">
          <div className="px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Signed in as
            </p>
            <p className="mt-0.5 truncate text-sm font-medium">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-border/60" />
          <button
            type="button"
            onClick={() => { setOpen(false); navigate("/dashboard"); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
          >
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            Open workspace
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); navigate("/dashboard/settings/billing"); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
          >
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Billing
          </button>
          <div className="my-1 h-px bg-border/60" />
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
