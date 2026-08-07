import { Outlet, Route, Routes, Navigate, Link } from "react-router-dom";
import { FolderOpen, Palette, FileText, Image as ImageIcon, Sparkles } from "lucide-react";
import { PageHeader, HubTabs, HeaderActionRow, sectionActions, type HubTab } from "@/components/dashboard/shell";

import { useLocalCollection } from "@/hooks/useLocalCollection";
import CaptionsBoard from "../views/CaptionsBoard";
import AssetsBoard from "../views/AssetsBoard";
import PresetsView from "../views/PresetsView";

const tabs: HubTab[] = [
  { label: "Captions", href: "/dashboard/library/captions", icon: FileText },
  { label: "Assets", href: "/dashboard/library/assets", icon: FolderOpen },
  { label: "Presets & Templates", href: "/dashboard/library/presets", icon: Palette },
];

function LibraryStats() {
  const { items: captions } = useLocalCollection<{ id: string }>("library", "captions");
  const { items: assets } = useLocalCollection<{ id: string; type?: string }>("library", "assets");
  const images = assets.filter((a) => a.type === "image").length;

  const cards = [
    { label: "Captions saved", value: captions.length, icon: FileText, href: "/dashboard/library/captions" },
    { label: "Assets stored", value: assets.length, icon: FolderOpen, href: "/dashboard/library/assets" },
    { label: "Images ready", value: images, icon: ImageIcon, href: "/dashboard/library/assets" },
    { label: "Presets", value: 3, icon: Palette, href: "/dashboard/library/presets" },
  ];

  return (
    <div className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Link
          key={c.label}
          to={c.href}
          className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3.5 transition-colors hover:border-primary/40"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <c.icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xl font-semibold leading-none">{c.value}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{c.label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function LibraryLayout() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Library"
          description="Reusable assets, captions, and platform presets."
          actions={
            <HeaderActionRow actions={sectionActions(tabs)} />
          }
        />
        <LibraryStats />
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
        <Route path="link-bio" element={<Navigate to="/dashboard/link-in-bio" replace />} />
        <Route path="presets" element={<PresetsView />} />
      </Route>
    </Routes>
  );
}

