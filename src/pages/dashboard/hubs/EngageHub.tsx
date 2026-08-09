import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Bot, Inbox, MessageSquare, MessageCircle, Share2 } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { useUnreadInbox } from "@/hooks/useUnreadInbox";
import BotRulesView from "../views/BotRulesView";
import { InboxBoard } from "../views/InboxBoard";
import { UnifiedInboxView } from "../views/UnifiedInboxView";
import ReshareStudioView from "../views/ReshareStudioView";

function EngageLayout() {
  const unread = useUnreadInbox();

  const tabs: HubTab[] = [
    { label: "Inbox", href: "/dashboard/engage/inbox", icon: Inbox, badge: unread.total || undefined },
    { label: "Comments", href: "/dashboard/engage/comments", icon: MessageSquare, badge: unread.comments || undefined },
    { label: "DMs", href: "/dashboard/engage/dms", icon: MessageCircle, badge: unread.dms || undefined },
    { label: "Bot rules", href: "/dashboard/engage/bot", icon: Bot },
    { label: "Reshare", href: "/dashboard/engage/reshare", icon: Share2 },
  ];

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 space-y-4">
        <PageHeader
          title="Engage"
          description="Reply, automate conversations, and route one idea across every connected channel."
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
        <Route index element={<Navigate to="inbox" replace />} />
        <Route
          path="inbox"
          element={
            <div className="p-4 sm:p-6 lg:p-8 pt-0 sm:pt-0 lg:pt-0">
              <FeatureGate
                feature="inbox"
                title="Unified inbox is a Professional feature"
                description="Bring comments, DMs and mentions from every channel into one triage board with assignments, saved replies and SLA counters."
              >
                <UnifiedInboxView />
              </FeatureGate>
            </div>
          }
        />
        <Route path="bot" element={<BotRulesView />} />
        <Route path="reshare" element={<ReshareStudioView />} />
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
