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
import Pricing from "./pages/Pricing";


// Dashboard shell
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
  "team": "/dashboard/settings/team",
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
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

              

              {/* Dashboard */}
              <Route path="/dashboard" element={<DashboardLayout />}>
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
                <Route path="settings/*" element={<SettingsHub />} />
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
