import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "moderator" | "user" | "owner" | "editor" | "viewer";

type State = {
  roles: AppRole[];
  loading: boolean;
  error: string | null;
};

/**
 * Client permission helper. Reads from a `user_roles` table if it exists
 * (RLS-scoped to auth.uid()). Gracefully returns empty roles when the table
 * hasn't been provisioned yet — feature gates that assume no role fall
 * back to their default (usually denied for admin-only actions).
 *
 *   const { hasRole, isAdmin, loading } = useHasRole();
 *   if (hasRole("moderator")) { ... }
 */
export function useHasRole() {
  const [state, setState] = useState<State>({ roles: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        if (!cancelled) setState({ roles: [], loading: false, error: null });
        return;
      }
      try {
        // Cast because generated types won't include user_roles until the migration lands.
        const { data, error } = await (supabase as unknown as {
          from: (t: string) => {
            select: (c: string) => {
              eq: (k: string, v: string) => Promise<{ data: { role: AppRole }[] | null; error: unknown }>;
            };
          };
        })
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (cancelled) return;
        if (error) {
          setState({ roles: [], loading: false, error: null });
          return;
        }
        setState({
          roles: (data ?? []).map((r) => r.role),
          loading: false,
          error: null,
        });
      } catch {
        if (!cancelled) setState({ roles: [], loading: false, error: null });
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setState((s) => ({ ...s, loading: true }));
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const hasRole = (role: AppRole) => state.roles.includes(role);
  const hasAny = (...roles: AppRole[]) => roles.some((r) => state.roles.includes(r));

  return {
    roles: state.roles,
    loading: state.loading,
    hasRole,
    hasAny,
    isAdmin: state.roles.includes("admin") || state.roles.includes("owner"),
    isModerator: state.roles.includes("moderator"),
  };
}
