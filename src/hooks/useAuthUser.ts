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

    const applyUser = (u: User | null) => {
      if (!mounted) return;
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

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("smmpilot:guest-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { user, loading, isGuest };
}
