import { BrandSwitcher } from "@/components/shared/BrandSwitcher";
import { HeaderActions } from "./HeaderActions";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "desktop" | "mobile";
}

/**
 * Unified top header — live credits, notifications, support, profile.
 * Brand lives in the sidebar only.
 */
export function DashboardHeader({ variant = "desktop" }: Props) {
  const isMobile = variant === "mobile";

  return (
    <header
      className={cn(
        "sticky z-30 flex items-center gap-2 border-b border-border/50 bg-background/85 backdrop-blur-xl px-3 sm:px-5",
        isMobile ? "top-0 h-14 lg:hidden" : "top-0 h-14 hidden lg:flex",
      )}
      style={{ top: "var(--demo-banner-h, 0px)" }}
    >
      <BrandSwitcher compact={isMobile} className="ml-1" />

      <div className={cn("flex-1", isMobile && "min-w-0")} />

      <HeaderActions />
    </header>
  );
}
