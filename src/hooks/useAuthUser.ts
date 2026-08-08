import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isGuestSession, disableGuest } from "@/hooks/useGuest";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => isGuestSession());

  useEffect(() => {
    let mounted = true;
    // Tracks whether Supabase auth actually answered. If it doesn't resolve in
    // time (offline sandbox, blocked network, slow project), we fail over to
    // the demo/guest session so the dashboard never sits on a blank spinner.
    // When auth eventually answers, applyUser() swaps in the real session.
    let resolved = false;

    const applyUser = (u: User | null) => {
      if (!mounted) return;
      resolved = true;
      // Strict isolation: a real user can never coexist with guest mode.
      if (u && isGuestSession()) disableGuest();
      setUser(u);
      setIsGuest(isGuestSession());
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    supabase.auth.getUser().then(({ data }) => applyUser(data.user ?? null));

    const sync = () => setIsGuest(isGuestSession());
    window.addEventListener("smmpilot:guest-changed", sync);
    window.addEventListener("storage", sync);

    const failover = window.setTimeout(() => {
      if (!mounted || resolved) return;
      try {
        window.localStorage.setItem("smmpilot:guest", "1");
      } catch {
        /* storage unavailable — stay on the loading state */
      }
      setIsGuest(true);
      setUser(null);
      setLoading(false);
      window.dispatchEvent(new Event("smmpilot:guest-changed"));
    }, 4500);

    return () => {
      mounted = false;
      window.clearTimeout(failover);
      sub.subscription.unsubscribe();
      window.removeEventListener("smmpilot:guest-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { user, loading, isGuest };
}
