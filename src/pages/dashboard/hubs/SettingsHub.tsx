import { Route, Routes, Navigate, Outlet } from "react-router-dom";
import { UserCog, Bell, Link2, CreditCard, Shield, Users } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import {
  AccountPanel,
  NotificationsPanel,
  ConnectedPanel,
  BillingPanel,
  SecurityPanel,
} from "@/components/settings/SettingsPanels";
import Team from "../Team";

const tabs: HubTab[] = [
  { label: "Account", href: "/dashboard/settings/account", icon: UserCog },
  { label: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
  { label: "Connected", href: "/dashboard/settings/connected", icon: Link2 },
  { label: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
  { label: "Security", href: "/dashboard/settings/security", icon: Shield },
  { label: "Team", href: "/dashboard/settings/team", icon: Users },
];

function SettingsLayout() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Settings"
          description="Profile, notifications, connected platforms, billing, security, and team."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
        />
        <HubTabs tabs={tabs} />
      </div>
      <Outlet />
    </div>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="p-4 sm:p-6 lg:p-8">{children}</div>;
}

export default function SettingsHub() {
  return (
    <Routes>
      <Route element={<SettingsLayout />}>
        <Route index element={<Navigate to="account" replace />} />
        <Route path="account" element={<Wrap><AccountPanel /></Wrap>} />
        <Route path="notifications" element={<Wrap><NotificationsPanel /></Wrap>} />
        <Route path="connected" element={<Wrap><ConnectedPanel /></Wrap>} />
        <Route path="billing" element={<Wrap><BillingPanel /></Wrap>} />
        <Route path="security" element={<Wrap><SecurityPanel /></Wrap>} />
        <Route path="team" element={<Team />} />
      </Route>
    </Routes>
  );
}
