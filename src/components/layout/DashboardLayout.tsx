import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
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
import { PublishEventsBridge } from "@/components/shared/PublishEventsBridge";
import { GracePeriodBanner } from "@/components/billing/GracePeriodBanner";
import { DemoSeeder } from "@/components/demo/DemoSeeder";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useSendSimulator } from "@/hooks/useSendSimulator";
import { useClaimPendingReferral } from "@/hooks/useClaimPendingReferral";
import { PageShimmer } from "@/components/ui/shimmer";

export function DashboardLayout() {
  const { state, markSeen } = useOnboarding();
  const [tourOpen, setTourOpen] = useState(false);
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const isFirstRender = useRef(true);
  
  useSendSimulator();
  useClaimPendingReferral();

  // Show shimmer when navigating between dashboard pages.
  // Note: we can't use `useNavigation()` here because the app uses a plain
  // BrowserRouter (no data router), and that hook requires createBrowserRouter.
  // Instead, we detect route changes via the location and briefly show the
  // shimmer while the new page renders (skipped on first mount).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

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
      <DemoSeeder />
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
        <GracePeriodBanner />
        <PresetLandingBanner />
        {isNavigating ? <PageShimmer /> : <Outlet />}
        <div className="h-28 lg:hidden" aria-hidden />
      </main>
      <MobileHubNav />
      <OnboardingWizard open={tourOpen} onOpenChange={handleWizardOpenChange} />
      <OnboardingTour />
      <HelpWidget />
      <AiAssistantDrawer />
      <PresetHandler />
      <PublishEventsBridge />
    </div>
  );
}
