import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Clock, Bell, Terminal } from "lucide-react";
import { PageHeader, HubTabs, StatusBoard, type HubTab } from "@/components/dashboard/shell";
import { ActivityFeedView } from "../views/ActivityFeedView";
import { McpActivityView } from "../views/McpActivityView";

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
        />
        <HubTabs tabs={tabs} />
      </div>
      <Outlet />
    </div>
  );
}

const runSeed = [
  { id: "r1", title: "Auto-reply to @jordan.creates", subtitle: "Engagement bot · Instagram", status: "success", meta: "2m ago", createdAt: new Date().toISOString() },
  { id: "r2", title: "Publish scheduled post", subtitle: "Scheduler · Twitter", status: "success", meta: "12m ago", createdAt: new Date().toISOString() },
  { id: "r3", title: "Sync competitor stats", subtitle: "Competitor tracker", status: "pending", meta: "running", createdAt: new Date().toISOString() },
  { id: "r4", title: "Post story", subtitle: "Story automation · IG", status: "failed", meta: "auth expired", createdAt: new Date().toISOString() },
];

const notifSeed = [
  { id: "n1", title: "New follower milestone", subtitle: "You hit 50k on TikTok 🎉", status: "unread", createdAt: new Date().toISOString() },
  { id: "n2", title: "Report ready", subtitle: "Weekly performance report", status: "unread", createdAt: new Date().toISOString() },
  { id: "n3", title: "Draft saved", subtitle: 'Draft "Launch teaser" saved', status: "read", createdAt: new Date().toISOString() },
  { id: "n4", title: "Old maintenance notice", subtitle: "System back online", status: "archived", createdAt: new Date().toISOString() },
];

export default function ActivityHub() {
  return (
    <Routes>
      <Route element={<ActivityLayout />}>
        <Route index element={<Navigate to="runs" replace />} />
        <Route path="runs" element={<ActivityFeedView />} />
        <Route path="mcp" element={<McpActivityView />} />
        <Route
          path="notifications"
          element={
            <StatusBoard
              storageKey="activity:notifications"
              hubKey="activity-notifications"
              icon={Bell}
              searchPlaceholder="Search notifications…"
              addPlaceholder="New note…"
              seed={notifSeed}
              columns={[
                { id: "unread", label: "Unread" },
                { id: "read", label: "Read" },
                { id: "archived", label: "Archived" },
              ]}
            />
          }
        />
      </Route>
    </Routes>
  );
}
