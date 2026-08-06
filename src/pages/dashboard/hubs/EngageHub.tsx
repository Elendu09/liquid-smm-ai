import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { Bot, Inbox, MessageSquare, MessageCircle, Sparkles } from "lucide-react";
import { PageHeader, HubTabs, HeaderActionRow, openOnboardingTour, type HubTab } from "@/components/dashboard/shell";
import { FeatureGate } from "@/components/shared/FeatureGate";
import { useUnreadInbox } from "@/hooks/useUnreadInbox";
import BotRulesView from "../views/BotRulesView";
import { InboxBoard } from "../views/InboxBoard";
import { UnifiedInboxView } from "../views/UnifiedInboxView";

function EngageLayout() {
  const unread = useUnreadInbox();

  const tabs: HubTab[] = [
    { label: "Inbox", href: "/dashboard/engage/inbox", icon: Inbox, badge: unread.total || undefined },
    { label: "Comments", href: "/dashboard/engage/comments", icon: MessageSquare, badge: unread.comments || undefined },
    { label: "DMs", href: "/dashboard/engage/dms", icon: MessageCircle, badge: unread.dms || undefined },
    { label: "Bot rules", href: "/dashboard/engage/bot", icon: Bot },
  ];

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Engage"
          description="Reply, auto-engage, and manage conversations across every account."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Engage" }]}
          actions={
            <HeaderActionRow
              actions={[
                { label: "Open inbox", icon: Inbox, to: "/dashboard/engage/inbox", primary: true },
                { label: "Take the tour", icon: Sparkles, onClick: openOnboardingTour },
                { label: "Bot rules", icon: Bot, to: "/dashboard/engage/bot" },
              ]}
            />
          }
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
