import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Calendar, CalendarDays, Film } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import Scheduler from "../Scheduler";
import ContentCalendar from "../ContentCalendar";
import StoryAutomation from "../StoryAutomation";

const tabs: HubTab[] = [
  { label: "Queue", href: "/dashboard/publish/queue", icon: Calendar },
  { label: "Calendar", href: "/dashboard/publish/calendar", icon: CalendarDays },
  { label: "Stories", href: "/dashboard/publish/stories", icon: Film },
];

function PublishLayout() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Publish"
        description="Schedule, plan, and automate everything that goes out."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Publish" }]}
      />
      <HubTabs tabs={tabs}>
        <Outlet />
      </HubTabs>
    </div>
  );
}

export default function PublishHub() {
  return (
    <Routes>
      <Route element={<PublishLayout />}>
        <Route index element={<Navigate to="queue" replace />} />
        <Route path="queue" element={<Scheduler />} />
        <Route path="calendar" element={<ContentCalendar />} />
        <Route path="stories" element={<StoryAutomation />} />
      </Route>
    </Routes>
  );
}
