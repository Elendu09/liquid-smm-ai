import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Sparkles, Hash, Wand2, PenLine } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import CreateStudio from "../views/CreateStudio";
import CaptionsCreateView from "../views/CaptionsCreateView";
import HashtagsCreateView from "../views/HashtagsCreateView";
import AiCreateView from "../views/AiCreateView";

const tabs: HubTab[] = [
  { label: "Studio", href: "/dashboard/create/studio", icon: PenLine },
  { label: "Captions", href: "/dashboard/create/captions", icon: Sparkles },
  { label: "Hashtags", href: "/dashboard/create/hashtags", icon: Hash },
  { label: "AI Studio", href: "/dashboard/create/ai", icon: Wand2 },
];

function CreateLayout() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Create"
          description="Draft, edit, and preview posts before they hit the queue."
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
        <Route index element={<Navigate to="studio" replace />} />
        <Route path="studio" element={<CreateStudio />} />
        <Route path="captions" element={<CaptionsCreateView />} />
        <Route path="hashtags" element={<HashtagsCreateView />} />
        <Route path="ai" element={<AiCreateView />} />
      </Route>
    </Routes>
  );
}
