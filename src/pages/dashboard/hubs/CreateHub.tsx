import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Sparkles, Hash, Wand2, PenLine } from "lucide-react";
import { PageHeader, HubTabs, StatusBoard, type HubTab } from "@/components/dashboard/shell";
import CreateStudio from "../views/CreateStudio";

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

const captionSeed = [
  { id: "c1", title: "Product launch hook", subtitle: "Big news 🚀 Something new drops Friday…", status: "idea", createdAt: new Date().toISOString() },
  { id: "c2", title: "Behind the scenes", subtitle: "A day in the studio 🎥", status: "polished", createdAt: new Date().toISOString() },
  { id: "c3", title: "Weekly tip", subtitle: "3 things I wish I knew before starting…", status: "used", createdAt: new Date().toISOString() },
];

const hashtagSeed = [
  { id: "h1", title: "#creatoreconomy", subtitle: "12.4M posts · high competition", status: "tracking", createdAt: new Date().toISOString() },
  { id: "h2", title: "#indiehackers", subtitle: "820k posts · niche fit", status: "saved", createdAt: new Date().toISOString() },
  { id: "h3", title: "#growthmarketing", subtitle: "4.2M · medium competition", status: "trending", createdAt: new Date().toISOString() },
];

const aiSeed = [
  { id: "a1", title: "Reel voiceover · fitness", status: "generated", createdAt: new Date().toISOString() },
  { id: "a2", title: "Carousel hook · SaaS", status: "queued", createdAt: new Date().toISOString() },
];

export default function CreateHub() {
  return (
    <Routes>
      <Route element={<CreateLayout />}>
        <Route index element={<Navigate to="studio" replace />} />
        <Route path="studio" element={<CreateStudio />} />
        <Route
          path="captions"
          element={
            <StatusBoard
              storageKey="create:captions"
              hubKey="create-captions"
              icon={Sparkles}
              searchPlaceholder="Search captions…"
              addPlaceholder="New caption idea…"
              seed={captionSeed}
              columns={[
                { id: "idea", label: "Ideas" },
                { id: "polished", label: "Polished" },
                { id: "used", label: "Used" },
              ]}
            />
          }
        />
        <Route
          path="hashtags"
          element={
            <StatusBoard
              storageKey="create:hashtags"
              hubKey="create-hashtags"
              icon={Hash}
              searchPlaceholder="Search hashtags…"
              addPlaceholder="#hashtag"
              seed={hashtagSeed}
              columns={[
                { id: "tracking", label: "Tracking" },
                { id: "saved", label: "Saved" },
                { id: "trending", label: "Trending" },
              ]}
            />
          }
        />
        <Route
          path="ai"
          element={
            <StatusBoard
              storageKey="create:ai"
              hubKey="create-ai"
              icon={Wand2}
              searchPlaceholder="Search generations…"
              addPlaceholder="New prompt…"
              seed={aiSeed}
              columns={[
                { id: "queued", label: "Queued" },
                { id: "generated", label: "Generated" },
                { id: "used", label: "Used" },
              ]}
            />
          }
        />
      </Route>
    </Routes>
  );
}
