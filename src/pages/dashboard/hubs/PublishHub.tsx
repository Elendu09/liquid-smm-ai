import { Route, Routes, Navigate } from "react-router-dom";
import { Calendar, CalendarDays, Film, Rss, Plus, Sparkles } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import { HubContent } from "@/components/dashboard/shell/HubContent";
import QueueBoard from "../views/QueueBoard";
import ContentCalendar from "../ContentCalendar";
import StoryBoard from "../views/StoryBoard";
import RssFeeds from "../RssFeeds";

const tabs: HubTab[] = [
  { label: "Queue", href: "/dashboard/publish/queue", icon: Calendar },
  { label: "Calendar", href: "/dashboard/publish/calendar", icon: CalendarDays },
  { label: "Stories", href: "/dashboard/publish/stories", icon: Film },
  { label: "RSS", href: "/dashboard/publish/rss", icon: Rss },
];

function PublishLayout() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 space-y-4">
        <PageHeader
          title="Publish"
          description="Schedule, plan, and automate everything that goes out."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Publish" }]}
          actions={<HubTabs tabs={tabs} />}
        />
      </div>
      <HubContent />
    </div>
  );
}

export default function PublishHub() {
  return (
    <Routes>
      <Route element={<PublishLayout />}>
        <Route index element={<Navigate to="queue" replace />} />
        <Route path="queue" element={<QueueBoard />} />
        <Route path="calendar" element={<ContentCalendar />} />
        <Route path="stories" element={<StoryBoard />} />
        <Route path="rss" element={<RssFeeds />} />
      </Route>
    </Routes>
  );
}
