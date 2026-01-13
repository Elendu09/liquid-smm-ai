import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AccountProvider } from "@/contexts/AccountContext";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";

// Dashboard Layout and Pages
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "@/pages/dashboard/Dashboard";
import CaptionGenerator from "@/pages/dashboard/CaptionGenerator";
import Scheduler from "@/pages/dashboard/Scheduler";
import EngagementBot from "@/pages/dashboard/EngagementBot";
import Analytics from "@/pages/dashboard/Analytics";
import HashtagResearch from "@/pages/dashboard/HashtagResearch";
import CommentManager from "@/pages/dashboard/CommentManager";
import ContentCalendar from "@/pages/dashboard/ContentCalendar";
import StoryAutomation from "@/pages/dashboard/StoryAutomation";
import DMAutomation from "@/pages/dashboard/DMAutomation";
import FollowerAnalyzer from "@/pages/dashboard/FollowerAnalyzer";
import CompetitorTracker from "@/pages/dashboard/CompetitorTracker";
import LinkInBio from "@/pages/dashboard/LinkInBio";

// New Dashboard Pages
import AccountHealth from "@/pages/dashboard/AccountHealth";
import Team from "@/pages/dashboard/Team";
import ContentLibrary from "@/pages/dashboard/ContentLibrary";
import AIStudio from "@/pages/dashboard/AIStudio";
import Reports from "@/pages/dashboard/Reports";
import Notifications from "@/pages/dashboard/Notifications";

const queryClient = new QueryClient();

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
              <Route path="/settings" element={<Settings />} />
              
              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="caption-generator" element={<CaptionGenerator />} />
                <Route path="scheduler" element={<Scheduler />} />
                <Route path="engagement-bot" element={<EngagementBot />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="hashtag-research" element={<HashtagResearch />} />
                <Route path="comment-manager" element={<CommentManager />} />
                <Route path="content-calendar" element={<ContentCalendar />} />
                <Route path="story-automation" element={<StoryAutomation />} />
                <Route path="dm-automation" element={<DMAutomation />} />
                <Route path="follower-analyzer" element={<FollowerAnalyzer />} />
                <Route path="competitor-tracker" element={<CompetitorTracker />} />
                <Route path="link-bio" element={<LinkInBio />} />
                {/* New Dashboard Routes */}
                <Route path="account-health" element={<AccountHealth />} />
                <Route path="team" element={<Team />} />
                <Route path="content-library" element={<ContentLibrary />} />
                <Route path="ai-studio" element={<AIStudio />} />
                <Route path="reports" element={<Reports />} />
                <Route path="notifications" element={<Notifications />} />
              </Route>
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AccountProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
