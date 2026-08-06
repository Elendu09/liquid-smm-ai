import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

const KEY = "smmpilot:pendingRef";

/**
 * Mounted once in the dashboard shell. If the user arrived with a referral
 * code (captured by the signup page / referral landing into localStorage), it
 * claims the referrer on their profile a single time and clears the marker.
 * The claim-referral edge fn is idempotent, so retries are harmless.
 */
export function useClaimPendingReferral() {
  const { user, isGuest } = useAuthUser();
  const attempted = useRef(false);

  useEffect(() => {
    if (!user || isGuest || attempted.current) return;
    attempted.current = true;
    let code: string | null = null;
    try { code = window.localStorage.getItem(KEY); } catch { /* ignore */ }
    if (!code) return;

    supabase.functions
      .invoke("claim-referral", { body: { code } })
      .then(() => {
        try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
      })
      .catch(() => {
        // Keep the marker so a later session can retry.
      });
  }, [user, isGuest]);
}
