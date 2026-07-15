import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { FolderOpen, LinkIcon, Palette } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import ContentLibrary from "../ContentLibrary";
import LinkInBio from "../LinkInBio";
import PresetsAndTemplates from "../PresetsAndTemplates";

const tabs: HubTab[] = [
  { label: "Assets", href: "/dashboard/library/assets", icon: FolderOpen },
  { label: "Link in Bio", href: "/dashboard/library/link-bio", icon: LinkIcon },
  { label: "Presets & Templates", href: "/dashboard/library/presets", icon: Palette },
];

function LibraryLayout() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Library"
          description="Reusable assets, link pages, and platform presets."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Library" }]}
        />
        <HubTabs tabs={tabs} />
      </div>
      <Outlet />
    </div>
  );
}

export default function LibraryHub() {
  return (
    <Routes>
      <Route element={<LibraryLayout />}>
        <Route index element={<Navigate to="assets" replace />} />
        <Route path="assets" element={<ContentLibrary />} />
        <Route path="link-bio" element={<LinkInBio />} />
        <Route path="presets" element={<PresetsAndTemplates />} />
      </Route>
    </Routes>
  );
}
