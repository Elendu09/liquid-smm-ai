import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { MobileHubNav } from "@/components/dashboard/shell/MobileHubNav";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useOnboarding } from "@/hooks/useOnboarding";

export function DashboardLayout() {
  const { state } = useOnboarding();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!state.completed) {
      // Slight delay so the dashboard paints first.
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, [state.completed]);

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <DashboardSidebar />
      {/* pt-14 on mobile to clear the fixed top bar */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 min-w-0">
        <Outlet />
        {/* Mobile spacer so page content isn't hidden behind fixed bottom nav */}
        <div className="h-20 lg:hidden" aria-hidden />
      </main>
      <MobileHubNav />
      <OnboardingWizard open={open} onOpenChange={setOpen} />
    </div>
  );
}
