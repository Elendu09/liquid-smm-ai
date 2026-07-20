import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { useGuest } from "@/hooks/useGuest";

export function DemoBanner() {
  const { isGuest } = useGuest();
  if (!isGuest) return null;
  return (
    <div className="sticky top-14 lg:top-0 z-30 border-b border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 backdrop-blur-md">
      <div className="flex flex-col gap-1 px-3 py-1.5 text-[11px] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:text-xs lg:px-8">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            <span className="sm:hidden">Demo mode — changes won't save.</span>
            <span className="hidden sm:inline">You're browsing in demo mode. Changes won't be saved.</span>
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 pl-5 sm:pl-0">
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
