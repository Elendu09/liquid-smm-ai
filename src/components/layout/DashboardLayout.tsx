import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { MobileHubNav } from "@/components/dashboard/shell/MobileHubNav";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { useOnboarding } from "@/hooks/useOnboarding";

export function DashboardLayout() {
  const { state } = useOnboarding();
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    if (!state.completed) {
      const t = setTimeout(() => setTourOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, [state.completed]);

  useEffect(() => {
    const handler = () => setTourOpen(true);
    window.addEventListener("smmpilot:open-onboarding", handler);
    return () => window.removeEventListener("smmpilot:open-onboarding", handler);
  }, []);

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 min-w-0">
        <Outlet />
        <div className="h-20 lg:hidden" aria-hidden />
      </main>
      <MobileHubNav />
      <OnboardingWizard open={tourOpen} onOpenChange={setTourOpen} />
    </div>
  );
}
