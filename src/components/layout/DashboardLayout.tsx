import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { MobileHubNav } from "@/components/dashboard/shell/MobileHubNav";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { HelpWidget } from "@/components/support/HelpWidget";
import { AiAssistantDrawer } from "@/components/dashboard/AiAssistantDrawer";
import { PresetHandler } from "@/components/support/PresetHandler";
import { PresetLandingBanner } from "@/components/dashboard/PresetLandingBanner";
import { DemoBanner, DemoBannerInline } from "@/components/layout/DemoBanner";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useSendSimulator } from "@/hooks/useSendSimulator";
import { useClaimPendingReferral } from "@/hooks/useClaimPendingReferral";

export function DashboardLayout() {
  const { state, markSeen } = useOnboarding();
  const [tourOpen, setTourOpen] = useState(false);
  useSendSimulator();
  useClaimPendingReferral();

  // One-shot: open the setup wizard exactly once, on first dashboard visit for
  // a user who has neither completed nor previously dismissed it. After it
  // closes we never auto-open again — the guided tour is the only re-entry.
  useEffect(() => {
    if (!state.completed && !state.seen) {
      const t = setTimeout(() => setTourOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, [state.completed, state.seen]);

  const handleWizardOpenChange = (open: boolean) => {
    setTourOpen(open);
    if (!open && !state.seen) void markSeen();
  };


  return (
    <div className="flex min-h-dvh w-full bg-background">
      <DemoBanner />
      <DashboardSidebar />
      <main
        className="flex-1 overflow-auto min-w-0"
        style={{
          paddingTop:
            "calc(var(--demo-banner-h, 0px) + var(--mobile-header-h, 0px))",
        }}
      >
        <DashboardHeader variant="desktop" />
        <DemoBannerInline />
        <PresetLandingBanner />
        <Outlet />
        <div className="h-28 lg:hidden" aria-hidden />
      </main>
      <MobileHubNav />
      <OnboardingWizard open={tourOpen} onOpenChange={handleWizardOpenChange} />
      <OnboardingTour />
      <HelpWidget />
      <AiAssistantDrawer />
      <PresetHandler />
    </div>
  );
}
