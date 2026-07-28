import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";

interface Props {
  children: ReactNode;
  /**
   * When true, guests (demo mode) are blocked and redirected to /login.
   * Use for sensitive sections (Settings, Team, Billing) where demo data
   * MUST NOT be visible or mutable.
   */
  authOnly?: boolean;
}

export function RequireAuth({ children, authOnly = false }: Props) {
  const { user, loading, isGuest } = useAuthUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs uppercase tracking-[0.3em]">Loading workspace</span>
        </div>
      </div>
    );
  }

  // Hard separation: guests may never access auth-only routes. Route them
  // to /login with a reason so the login page can present the correct CTA.
  if (authOnly && isGuest && !user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}&reason=auth-required`} replace />;
  }

  if (!user && !isGuest) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <>{children}</>;
}
