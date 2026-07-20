import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { useGuest } from "@/hooks/useGuest";

export function DemoBanner() {
  const { isGuest } = useGuest();
  if (!isGuest) return null;
  return (
    <div className="sticky top-14 lg:top-0 z-30 border-b border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-1.5 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            You're browsing in demo mode. Changes won't be saved.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/signup" className="underline underline-offset-4 hover:text-foreground">
            Create account
          </Link>
          <Link to="/login" className="underline underline-offset-4 hover:text-foreground">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
