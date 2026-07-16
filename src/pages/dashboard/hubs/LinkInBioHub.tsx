import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Link2, Palette, Sparkles, BarChart3 } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import PagesView from "../views/linkbio/PagesView";
import ThemesView from "../views/linkbio/ThemesView";
import TemplatesView from "../views/linkbio/TemplatesView";
import AnalyticsView from "../views/linkbio/AnalyticsView";

const tabs: HubTab[] = [
  { label: "Pages", href: "/dashboard/link-in-bio/pages", icon: Link2 },
  { label: "Themes", href: "/dashboard/link-in-bio/themes", icon: Palette },
  { label: "Templates", href: "/dashboard/link-in-bio/templates", icon: Sparkles },
  { label: "Analytics", href: "/dashboard/link-in-bio/analytics", icon: BarChart3 },
];

function LinkInBioLayout() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Link in Bio"
          description="Design your bio page, browse themes, and start from a template."
        />
        <HubTabs tabs={tabs} />
      </div>
      <Outlet />
    </div>
  );
}

export default function LinkInBioHub() {
  return (
    <Routes>
      <Route element={<LinkInBioLayout />}>
        <Route index element={<Navigate to="pages" replace />} />
        <Route path="pages" element={<PagesView />} />
        <Route path="themes" element={<ThemesView />} />
        <Route path="templates" element={<TemplatesView />} />
        <Route path="analytics" element={<AnalyticsView />} />
      </Route>
    </Routes>
  );
}
