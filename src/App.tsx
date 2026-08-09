import "@/hooks/useWhiteLabel";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AccountProvider } from "@/contexts/AccountContext";
import { BrandProvider } from "@/contexts/BrandContext";

// Public pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import Tools from "./pages/Tools";
import ToolDetail from "./pages/ToolDetail";
import FAQ from "./pages/FAQ";
import Solutions from "./pages/Solutions";
import PublicCalendar from "./pages/PublicCalendar";
import PublicBio from "./pages/PublicBio";
import PublicCampaign from "./pages/PublicCampaign";
import PublicApproval from "./pages/PublicApproval";
import ReferralLanding from "./pages/ReferralLanding";
import Mcp from "./pages/Mcp";
import AcceptInvite from "./pages/AcceptInvite";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Cookies from "./pages/legal/Cookies";
import About from "./pages/company/About";
import Blog from "./pages/company/Blog";
import BlogPost from "./pages/company/BlogPost";
import Careers from "./pages/company/Careers";
import Contact from "./pages/company/Contact";
import Changelog from "./pages/Changelog";



// Dashboard shell
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Dashboard from "@/pages/dashboard/Dashboard";

// Hubs — code-split heavy hubs for 3.5MB → smaller initial
const CreateHub = lazy(() => import("@/pages/dashboard/hubs/CreateHub"));
const PublishHub = lazy(() => import("@/pages/dashboard/hubs/PublishHub"));
const EngageHub = lazy(() => import("@/pages/dashboard/hubs/EngageHub"));
const AudienceHub = lazy(() => import("@/pages/dashboard/hubs/AudienceHub"));
const AnalyticsHub = lazy(() => import("@/pages/dashboard/hubs/AnalyticsHub"));
const LibraryHub = lazy(() => import("@/pages/dashboard/hubs/LibraryHub"));
const LinkInBioHub = lazy(() => import("@/pages/dashboard/hubs/LinkInBioHub"));
const ActivityHub = lazy(() => import("@/pages/dashboard/hubs/ActivityHub"));
const SettingsHub = lazy(() => import("@/pages/dashboard/hubs/SettingsHub"));
import Support from "@/pages/dashboard/Support";
import Campaigns from "@/pages/dashboard/Campaigns";
import Team from "@/pages/dashboard/Team";
import Referrals from "@/pages/dashboard/Referrals";

const queryClient = new QueryClient();

// Old route -> new hub tab
const legacyRedirects: Record<string, string> = {
  "caption-generator": "/dashboard/create/captions",
  "hashtag-research": "/dashboard/create/hashtags",
  "ai-studio": "/dashboard/create/studio",
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

const MarketingScrollTop = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/dashboard")) return null;
  return <ScrollToTopButton />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AccountProvider>
        <BrandProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
            <Suspense fallback={<div className="min-h-dvh grid place-items-center bg-background"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/features" element={<Features />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/tools/:slug" element={<ToolDetail />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/mcp" element={<Mcp />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="/public/calendar/:token" element={<PublicCalendar />} />
              <Route path="/bio/:slug" element={<PublicBio />} />
              <Route path="/b/:slug" element={<PublicBio />} />
              <Route path="/@:slug" element={<PublicBio />} />
              <Route path="/c/:slug" element={<PublicCampaign />} />
              <Route path="/p/approve/:token" element={<PublicApproval />} />

              <Route path="/invite/:token" element={<AcceptInvite />} />
              <Route path="/referral/:code" element={<ReferralLanding />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/legal/privacy" element={<Navigate to="/privacy" replace />} />
              <Route path="/legal/terms" element={<Navigate to="/terms" replace />} />
              <Route path="/legal/cookies" element={<Navigate to="/cookies" replace />} />
              <Route path="/about" element={<About />} />
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/contact" element={<Contact />} />


              

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
                {/* Campaigns is guest-viewable (demo data, write-guarded) */}
                <Route path="campaigns" element={<Campaigns />} />

                {/* Team page allows demo/guest view (mock members, write-guarded) */}
                <Route path="team" element={<Team />} />
                <Route path="referrals" element={<Referrals />} />
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
            </Suspense>
            </ErrorBoundary>
            <MarketingScrollTop />
          </BrowserRouter>
        </TooltipProvider>
        </BrandProvider>
      </AccountProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
