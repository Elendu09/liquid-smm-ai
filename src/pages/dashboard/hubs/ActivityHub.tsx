import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Clock, Bell, Terminal, Sparkles } from "lucide-react";
import { PageHeader, HubTabs, HeaderActionRow, openOnboardingTour, type HubTab } from "@/components/dashboard/shell";
import { ActivityFeedView } from "../views/ActivityFeedView";
import { McpActivityView } from "../views/McpActivityView";
import { NotificationsView } from "../views/NotificationsView";

const tabs: HubTab[] = [
  { label: "Runs", href: "/dashboard/activity/runs", icon: Clock },
  { label: "MCP calls", href: "/dashboard/activity/mcp", icon: Terminal },
  { label: "Notifications", href: "/dashboard/activity/notifications", icon: Bell },
];

function ActivityLayout() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Activity"
          description="Every automation run and every notification, in order."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Activity" }]}
          actions={
            <HeaderActionRow
              actions={[
                { label: "Notifications", icon: Bell, to: "/dashboard/activity/notifications", primary: true },
                { label: "Take the tour", icon: Sparkles, onClick: openOnboardingTour },
                { label: "MCP calls", icon: Terminal, to: "/dashboard/activity/mcp" },
              ]}
            />
          }
        />

        <HubTabs tabs={tabs} />
      </div>
      <Outlet />
    </div>
  );
}

export default function ActivityHub() {
  return (
    <Routes>
      <Route element={<ActivityLayout />}>
        <Route index element={<Navigate to="runs" replace />} />
        <Route path="runs" element={<ActivityFeedView />} />
        <Route path="mcp" element={<McpActivityView />} />
        <Route path="notifications" element={<NotificationsView />} />
      </Route>
    </Routes>
  );
}
