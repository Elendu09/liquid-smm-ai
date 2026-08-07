import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Users, Target, Layers, Sparkles, BarChart3 } from "lucide-react";
import { PageHeader, HubTabs, HeaderActionRow, sectionActions, type HubTab } from "@/components/dashboard/shell";
import SegmentsBoard from "../views/SegmentsBoard";
import CompetitorsBoard from "../views/CompetitorsBoard";
import MyAudienceBoard from "../views/MyAudienceBoard";

const tabs: HubTab[] = [
  { label: "My Audience", href: "/dashboard/audience/followers", icon: Users },
  { label: "Segments", href: "/dashboard/audience/segments", icon: Layers },
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
          actions={
            <HeaderActionRow actions={sectionActions(tabs)} />
          }
        />

        <HubTabs tabs={tabs} />
      </div>
      <Outlet />
    </div>
  );
}

export default function AudienceHub() {
  return (
    <Routes>
      <Route element={<AudienceLayout />}>
        <Route index element={<Navigate to="followers" replace />} />
        <Route path="followers" element={<MyAudienceBoard />} />
        <Route path="segments" element={<SegmentsBoard />} />
        <Route path="competitors" element={<CompetitorsBoard />} />
      </Route>
    </Routes>
  );
}
