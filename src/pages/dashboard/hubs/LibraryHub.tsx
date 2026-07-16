import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { FolderOpen, LinkIcon, Palette, FileText } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import CaptionsBoard from "../views/CaptionsBoard";
import AssetsBoard from "../views/AssetsBoard";
import LinkBioView from "../views/LinkBioView";
import PresetsView from "../views/PresetsView";

const tabs: HubTab[] = [
  { label: "Captions", href: "/dashboard/library/captions", icon: FileText },
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
        <Route index element={<Navigate to="captions" replace />} />
        <Route path="captions" element={<CaptionsBoard />} />
        <Route path="assets" element={<AssetsBoard />} />
        <Route path="link-bio" element={<LinkBioView />} />
        <Route path="presets" element={<PresetsView />} />
      </Route>
    </Routes>
  );
}
