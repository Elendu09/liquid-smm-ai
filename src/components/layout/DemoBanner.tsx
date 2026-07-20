import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { useGuest } from "@/hooks/useGuest";

export function DemoBanner() {
  const { isGuest } = useGuest();
  if (!isGuest) return null;
  return (
    <div className="sticky top-14 lg:top-0 z-30 border-b border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 px-3 sm:px-6 lg:px-8 py-2 text-[11px] sm:text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            You're browsing in demo mode. Changes won't be saved.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 pl-5 sm:pl-0">
          <Link to="/signup" className="underline underline-offset-4 hover:text-foreground whitespace-nowrap">
            Create account
          </Link>
          <span className="opacity-40" aria-hidden>·</span>
          <Link to="/login" className="underline underline-offset-4 hover:text-foreground whitespace-nowrap">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
