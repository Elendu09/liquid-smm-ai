import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Users, Target } from "lucide-react";
import { PageHeader, HubTabs, StatusBoard, type HubTab } from "@/components/dashboard/shell";

const tabs: HubTab[] = [
  { label: "My Audience", href: "/dashboard/audience/followers", icon: Users },
  { label: "Competitors", href: "/dashboard/audience/competitors", icon: Target },
];

function AudienceLayout() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Audience"
          description="Understand your followers and benchmark against competitors."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Audience" }]}
        />
        <HubTabs tabs={tabs} />
      </div>
      <Outlet />
    </div>
  );
}

const followerSeed = [
  { id: "f1", title: "@jordan.creates", subtitle: "34k · Instagram · engages weekly", status: "engaged", createdAt: new Date().toISOString() },
  { id: "f2", title: "@marta.design", subtitle: "8k · Instagram · new this week", status: "watching", createdAt: new Date().toISOString() },
  { id: "f3", title: "@kenf", subtitle: "22k · Twitter · quiet 30d", status: "churned", createdAt: new Date().toISOString() },
];

const competitorSeed = [
  { id: "co1", title: "@rivalstudio", subtitle: "120k · posts 4x/wk", status: "priority", createdAt: new Date().toISOString() },
  { id: "co2", title: "@nichequeen", subtitle: "45k · posts 2x/wk", status: "tracking", createdAt: new Date().toISOString() },
  { id: "co3", title: "@oldbrand", subtitle: "80k · inactive", status: "archived", createdAt: new Date().toISOString() },
];

export default function AudienceHub() {
  return (
    <Routes>
      <Route element={<AudienceLayout />}>
        <Route index element={<Navigate to="followers" replace />} />
        <Route
          path="followers"
          element={
            <StatusBoard
              storageKey="audience:followers"
              hubKey="audience-followers"
              icon={Users}
              searchPlaceholder="Search followers…"
              addPlaceholder="@handle"
              seed={followerSeed}
              columns={[
                { id: "watching", label: "Watching" },
                { id: "engaged", label: "Engaged" },
                { id: "churned", label: "Churned" },
              ]}
            />
          }
        />
        <Route
          path="competitors"
          element={
            <StatusBoard
              storageKey="audience:competitors"
              hubKey="audience-competitors"
              icon={Target}
              searchPlaceholder="Search competitors…"
              addPlaceholder="@competitor"
              seed={competitorSeed}
              columns={[
                { id: "tracking", label: "Tracking" },
                { id: "priority", label: "Priority" },
                { id: "archived", label: "Archived" },
              ]}
            />
          }
        />
      </Route>
    </Routes>
  );
}
