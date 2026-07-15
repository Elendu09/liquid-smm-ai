import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { FolderOpen, LinkIcon, Palette, FileText } from "lucide-react";
import { PageHeader, HubTabs, StatusBoard, type HubTab } from "@/components/dashboard/shell";
import CaptionsBoard from "../views/CaptionsBoard";

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

const assetSeed = [
  { id: "a1", title: "Brand logo pack", subtitle: "12 files · PNG/SVG", status: "active", createdAt: new Date().toISOString() },
  { id: "a2", title: "Q3 campaign hero", subtitle: "3840×2160 · JPG", status: "draft", createdAt: new Date().toISOString() },
  { id: "a3", title: "Old product photos", subtitle: "Legacy · 2023", status: "archived", createdAt: new Date().toISOString() },
];

const linkSeed = [
  { id: "l1", title: "New drop pre-order", subtitle: "shop.smm.io/drop", status: "live", createdAt: new Date().toISOString() },
  { id: "l2", title: "Free newsletter", subtitle: "smm.io/newsletter", status: "live", createdAt: new Date().toISOString() },
  { id: "l3", title: "Winter sale", subtitle: "Ended Feb", status: "archived", createdAt: new Date().toISOString() },
];

const presetSeed = [
  { id: "p1", title: "Reel · Hook + CTA", subtitle: "Best for IG/TikTok · 45s", status: "favorite", createdAt: new Date().toISOString() },
  { id: "p2", title: "Carousel · 5 slides", subtitle: "Educational · IG", status: "team", createdAt: new Date().toISOString() },
  { id: "p3", title: "Story series", subtitle: "3-part · IG/FB", status: "mine", createdAt: new Date().toISOString() },
];

export default function LibraryHub() {
  return (
    <Routes>
      <Route element={<LibraryLayout />}>
        <Route index element={<Navigate to="captions" replace />} />
        <Route path="captions" element={<CaptionsBoard />} />
        <Route
          path="assets"
          element={
            <StatusBoard
              storageKey="library:assets"
              hubKey="library-assets"
              icon={FolderOpen}
              searchPlaceholder="Search assets…"
              addPlaceholder="New asset name…"
              seed={assetSeed}
              columns={[
                { id: "draft", label: "Draft" },
                { id: "active", label: "Active" },
                { id: "archived", label: "Archived" },
              ]}
            />
          }
        />
        <Route
          path="link-bio"
          element={
            <StatusBoard
              storageKey="library:link-bio"
              hubKey="library-linkbio"
              icon={LinkIcon}
              searchPlaceholder="Search links…"
              addPlaceholder="New link…"
              seed={linkSeed}
              columns={[
                { id: "draft", label: "Draft" },
                { id: "live", label: "Live" },
                { id: "archived", label: "Archived" },
              ]}
            />
          }
        />
        <Route
          path="presets"
          element={
            <StatusBoard
              storageKey="library:presets"
              hubKey="library-presets"
              icon={Palette}
              searchPlaceholder="Search presets…"
              addPlaceholder="New preset…"
              seed={presetSeed}
              columns={[
                { id: "mine", label: "Mine" },
                { id: "team", label: "Team" },
                { id: "favorite", label: "Favorites" },
              ]}
            />
          }
        />
      </Route>
    </Routes>
  );
}
