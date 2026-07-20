import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";

interface Props {
  children: ReactNode;
}

export function RequireAuth({ children }: Props) {
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

  if (!user && !isGuest) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <>{children}</>;
}
