import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { useGuest } from "@/hooks/useGuest";

/**
 * Mobile/tablet: fixed above the mobile header (publishes --demo-banner-h so
 * the header + main can offset). Desktop: renders nothing here — the desktop
 * variant is rendered inside <main> via <DemoBannerInline />.
 */
export function DemoBanner() {
  const { isGuest } = useGuest();

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const mobile = window.matchMedia("(max-width: 1023px)").matches;
      if (isGuest && mobile) root.style.setProperty("--demo-banner-h", "28px");
      else root.style.removeProperty("--demo-banner-h");
    };
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      root.style.removeProperty("--demo-banner-h");
    };
  }, [isGuest]);

  if (!isGuest) return null;

  return (
    <div className="lg:hidden fixed inset-x-0 top-0 z-50 h-7 border-b border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 backdrop-blur-md">
      <BannerBody />
    </div>
  );
}

/** Desktop-only inline banner rendered at the top of <main>. */
export function DemoBannerInline() {
  const { isGuest } = useGuest();
  if (!isGuest) return null;
  return (
    <div className="hidden lg:block sticky top-0 z-30 border-b border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 backdrop-blur-md">
      <div className="py-1.5">
        <BannerBody />
      </div>
    </div>
  );
}

function BannerBody() {
  return (
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
  );
}
