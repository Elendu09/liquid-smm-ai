import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Bot, MessageSquare, MessageCircle } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import EngagementBot from "../EngagementBot";
import CommentManager from "../CommentManager";
import DMAutomation from "../DMAutomation";

const tabs: HubTab[] = [
  { label: "Engagement Bot", href: "/dashboard/engage/bot", icon: Bot },
  { label: "Comments", href: "/dashboard/engage/comments", icon: MessageSquare },
  { label: "DMs", href: "/dashboard/engage/dms", icon: MessageCircle },
];

function EngageLayout() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Engage"
        description="Reply, auto-engage, and manage conversations across every account."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Engage" }]}
      />
      <HubTabs tabs={tabs}>
        <Outlet />
      </HubTabs>
    </div>
  );
}

export default function EngageHub() {
  return (
    <Routes>
      <Route element={<EngageLayout />}>
        <Route index element={<Navigate to="bot" replace />} />
        <Route path="bot" element={<EngagementBot />} />
        <Route path="comments" element={<CommentManager />} />
        <Route path="dms" element={<DMAutomation />} />
      </Route>
    </Routes>
  );
}
