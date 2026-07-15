import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { UserCog, Users } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import { SettingsPanels } from "@/components/settings/SettingsPanels";
import Team from "../Team";

const tabs: HubTab[] = [
  { label: "Account", href: "/dashboard/settings/account", icon: UserCog },
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

function AccountPanel() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <SettingsPanels />
    </div>
  );
}

export default function SettingsHub() {
  return (
    <Routes>
      <Route element={<SettingsLayout />}>
        <Route index element={<Navigate to="account" replace />} />
        <Route path="account" element={<AccountPanel />} />
        <Route path="team" element={<Team />} />
      </Route>
    </Routes>
  );
}
