import { Route, Routes, Navigate } from "react-router-dom";
import { Sparkles, Hash, PenLine, Mic2, LayoutTemplate, Plus } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import { HubContent } from "@/components/dashboard/shell/HubContent";
import UnifiedStudio from "../views/UnifiedStudio";
import CaptionsCreateView from "../views/CaptionsCreateView";
import HashtagsCreateView from "../views/HashtagsCreateView";
import BrandVoicesView from "../views/BrandVoicesView";

const tabs: HubTab[] = [
  { label: "Studio", href: "/dashboard/create/studio", icon: PenLine },
  { label: "Captions", href: "/dashboard/create/captions", icon: Sparkles },
  { label: "Hashtags", href: "/dashboard/create/hashtags", icon: Hash },
  { label: "Brand Voice", href: "/dashboard/create/voices", icon: Mic2 },
];

function CreateLayout() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 space-y-4">
        <PageHeader
          title="Create"
          description="Draft, edit, and preview posts before they hit the queue."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Create" }]}
          actions={<HubTabs tabs={tabs} />}
        />
      </div>
      <HubContent />
    </div>
  );
}

export default function CreateHub() {
  return (
    <Routes>
      <Route element={<CreateLayout />}>
        <Route index element={<Navigate to="studio" replace />} />
        <Route path="studio" element={<UnifiedStudio />} />
        {/* AI Studio is now a sub-section of Studio */}
        <Route path="ai" element={<Navigate to="/dashboard/create/studio?section=ai" replace />} />
        <Route path="captions" element={<CaptionsCreateView />} />
        <Route path="hashtags" element={<HashtagsCreateView />} />
        <Route path="voices" element={<BrandVoicesView />} />
      </Route>
    </Routes>
  );
}
