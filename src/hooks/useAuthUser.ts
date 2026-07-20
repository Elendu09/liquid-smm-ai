import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isGuestSession } from "@/hooks/useGuest";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => isGuestSession());

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setIsGuest(isGuestSession());
      setLoading(false);
    });

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      setIsGuest(isGuestSession());
      setLoading(false);
    });

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
