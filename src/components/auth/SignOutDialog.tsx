import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { disableGuest, isGuestSession } from "@/hooks/useGuest";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scope?: "current" | "all";
}

export function SignOutDialog({ open, onOpenChange, scope = "current" }: Props) {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const guest = isGuestSession();

  const handleSignOut = async () => {
    setBusy(true);
    try {
      if (guest) {
        disableGuest();
      } else {
        const { error } = await supabase.auth.signOut({
          scope: scope === "all" ? "global" : "local",
        });
        if (error) throw error;
      }
      toast.success(guest ? "Left demo mode" : "Signed out");
      onOpenChange(false);
      navigate("/login", { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign out failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            {guest ? "Leave demo mode?" : scope === "all" ? "Sign out of all devices?" : "Sign out?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {guest
              ? "You'll return to the sign-in screen. Nothing was saved during your demo session."
              : scope === "all"
              ? "This ends every active session for your account across all browsers and devices."
              : "You'll be returned to the sign-in screen. Unsaved work in this tab may be lost."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Stay</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleSignOut();
            }}
            disabled={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
            {guest ? "Leave demo" : "Sign out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
