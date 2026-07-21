import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Bot, Inbox, MessageSquare, MessageCircle } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import BotRulesView from "../views/BotRulesView";
import { InboxBoard } from "../views/InboxBoard";
import { UnifiedInboxView } from "../views/UnifiedInboxView";

const tabs: HubTab[] = [
  { label: "Inbox", href: "/dashboard/engage/inbox", icon: Inbox },
  { label: "Comments", href: "/dashboard/engage/comments", icon: MessageSquare },
  { label: "DMs", href: "/dashboard/engage/dms", icon: MessageCircle },
  { label: "Bot rules", href: "/dashboard/engage/bot", icon: Bot },
];

function EngageLayout() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Engage"
          description="Reply, auto-engage, and manage conversations across every account."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Engage" }]}
        />
        <HubTabs tabs={tabs} />
      </div>
      <Outlet />
    </div>
  );
}

export default function EngageHub() {
  return (
    <Routes>
      <Route element={<EngageLayout />}>
        <Route index element={<Navigate to="bot" replace />} />
        <Route path="bot" element={<BotRulesView />} />
        <Route
          path="comments"
          element={<InboxBoard kind="comment" title="Comments" description="Every comment across your accounts in one board." />}
        />
        <Route
          path="dms"
          element={<InboxBoard kind="dm" title="Direct Messages" description="All inbound DMs, sorted by conversation state." />}
        />
      </Route>
    </Routes>
  );
}
