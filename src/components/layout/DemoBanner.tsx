import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { useGuest } from "@/hooks/useGuest";

/**
 * Sits above everything (including the mobile fixed header) when in guest mode.
 * Publishes its height as `--demo-banner-h` so the sidebar/main can offset.
 */
export function DemoBanner() {
  const { isGuest } = useGuest();

  useEffect(() => {
    const root = document.documentElement;
    if (isGuest) root.style.setProperty("--demo-banner-h", "28px");
    else root.style.removeProperty("--demo-banner-h");
    return () => {
      root.style.removeProperty("--demo-banner-h");
    };
  }, [isGuest]);

  if (!isGuest) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-7 border-b border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 backdrop-blur-md">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 text-xs">
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
