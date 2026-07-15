import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Clock, Bell } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import RunHistory from "../RunHistory";
import Notifications from "../Notifications";

const tabs: HubTab[] = [
  { label: "Runs", href: "/dashboard/activity/runs", icon: Clock },
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

export default function ActivityHub() {
  return (
    <Routes>
      <Route element={<ActivityLayout />}>
        <Route index element={<Navigate to="runs" replace />} />
        <Route path="runs" element={<RunHistory />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
}
