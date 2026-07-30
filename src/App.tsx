import "@/hooks/useWhiteLabel";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AccountProvider } from "@/contexts/AccountContext";

// Public pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import Solutions from "./pages/Solutions";
import PublicCalendar from "./pages/PublicCalendar";
import PublicBio from "./pages/PublicBio";
import AcceptInvite from "./pages/AcceptInvite";



// Dashboard shell
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Dashboard from "@/pages/dashboard/Dashboard";

// Hubs
import CreateHub from "@/pages/dashboard/hubs/CreateHub";
import PublishHub from "@/pages/dashboard/hubs/PublishHub";
import EngageHub from "@/pages/dashboard/hubs/EngageHub";
import AudienceHub from "@/pages/dashboard/hubs/AudienceHub";
import AnalyticsHub from "@/pages/dashboard/hubs/AnalyticsHub";
import LibraryHub from "@/pages/dashboard/hubs/LibraryHub";
import LinkInBioHub from "@/pages/dashboard/hubs/LinkInBioHub";
import ActivityHub from "@/pages/dashboard/hubs/ActivityHub";
import SettingsHub from "@/pages/dashboard/hubs/SettingsHub";
import Support from "@/pages/dashboard/Support";
import Team from "@/pages/dashboard/Team";

const queryClient = new QueryClient();

// Old route -> new hub tab
const legacyRedirects: Record<string, string> = {
  "caption-generator": "/dashboard/create/captions",
  "hashtag-research": "/dashboard/create/hashtags",
  "ai-studio": "/dashboard/create/ai",
  "scheduler": "/dashboard/publish/queue",
  "content-calendar": "/dashboard/publish/calendar",
  "story-automation": "/dashboard/publish/stories",
  "engagement-bot": "/dashboard/engage/bot",
  "comment-manager": "/dashboard/engage/comments",
  "dm-automation": "/dashboard/engage/dms",
  "follower-analyzer": "/dashboard/audience/followers",
  "competitor-tracker": "/dashboard/audience/competitors",
  "analytics": "/dashboard/analytics/overview",
  "reports": "/dashboard/analytics/reports",
  "account-health": "/dashboard/analytics/health",
  "content-library": "/dashboard/library/assets",
  "link-bio": "/dashboard/link-in-bio",
  "presets": "/dashboard/library/presets",
  "history": "/dashboard/activity/runs",
  "notifications": "/dashboard/activity/notifications",
  "team": "/dashboard/team",
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AccountProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="/public/calendar/:token" element={<PublicCalendar />} />
              <Route path="/bio/:slug" element={<PublicBio />} />
              <Route path="/b/:slug" element={<PublicBio />} />
              <Route path="/@:slug" element={<PublicBio />} />
              <Route path="/invite/:token" element={<AcceptInvite />} />


              

              {/* Dashboard */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <DashboardLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Dashboard />} />

                {/* Hubs */}
                <Route path="create/*" element={<CreateHub />} />
                <Route path="publish/*" element={<PublishHub />} />
                <Route path="engage/*" element={<EngageHub />} />
                <Route path="audience/*" element={<AudienceHub />} />
                <Route path="analytics/*" element={<AnalyticsHub />} />
                <Route path="library/*" element={<LibraryHub />} />
                <Route path="link-in-bio/*" element={<LinkInBioHub />} />
                <Route path="activity/*" element={<ActivityHub />} />
                {/* Hard auth/demo separation — guests may not see settings, billing, or team */}
                <Route
                  path="settings/*"
                  element={
                    <RequireAuth authOnly>
                      <SettingsHub />
                    </RequireAuth>
                  }
                />
                {/* Team page allows demo/guest view (mock members, write-guarded) */}
                <Route path="team" element={<Team />} />
                <Route path="support" element={<Support />} />

                {/* Legacy route redirects */}
                {Object.entries(legacyRedirects).map(([from, to]) => (
                  <Route
                    key={from}
                    path={from}
                    element={<Navigate to={to} replace />}
                  />
                ))}
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AccountProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
