import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Users, Target } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import FollowerAnalyzer from "../FollowerAnalyzer";
import CompetitorTracker from "../CompetitorTracker";

const tabs: HubTab[] = [
  { label: "My Audience", href: "/dashboard/audience/followers", icon: Users },
  { label: "Competitors", href: "/dashboard/audience/competitors", icon: Target },
];

function AudienceLayout() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Audience"
        description="Understand your followers and benchmark against competitors."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Audience" }]}
      />
      <HubTabs tabs={tabs}>
        <Outlet />
      </HubTabs>
    </div>
  );
}

export default function AudienceHub() {
  return (
    <Routes>
      <Route element={<AudienceLayout />}>
        <Route index element={<Navigate to="followers" replace />} />
        <Route path="followers" element={<FollowerAnalyzer />} />
        <Route path="competitors" element={<CompetitorTracker />} />
      </Route>
    </Routes>
  );
}
