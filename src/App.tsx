import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            
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
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
