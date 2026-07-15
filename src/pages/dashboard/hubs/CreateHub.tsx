import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Sparkles, Hash, Wand2 } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import CaptionGenerator from "../CaptionGenerator";
import HashtagResearch from "../HashtagResearch";
import AIStudio from "../AIStudio";

const tabs: HubTab[] = [
  { label: "Captions", href: "/dashboard/create/captions", icon: Sparkles },
  { label: "Hashtags", href: "/dashboard/create/hashtags", icon: Hash },
  { label: "AI Studio", href: "/dashboard/create/studio", icon: Wand2 },
];

function CreateLayout() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Create"
          description="Draft captions, research hashtags, and generate assets with AI — all in one place."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Create" }]}
        />
        <HubTabs tabs={tabs} />
      </div>
      <Outlet />
    </div>
  );
}

export default function CreateHub() {
  return (
    <Routes>
      <Route element={<CreateLayout />}>
        <Route index element={<Navigate to="captions" replace />} />
        <Route path="captions" element={<CaptionGenerator />} />
        <Route path="hashtags" element={<HashtagResearch />} />
        <Route path="studio" element={<AIStudio />} />
      </Route>
    </Routes>
  );
}
