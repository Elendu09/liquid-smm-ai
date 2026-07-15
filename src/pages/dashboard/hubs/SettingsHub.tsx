import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { UserCog, Users } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import Settings from "@/pages/Settings";
import Team from "../Team";

const tabs: HubTab[] = [
  { label: "Account", href: "/dashboard/settings/account", icon: UserCog },
  { label: "Team", href: "/dashboard/settings/team", icon: Users },
];

function SettingsLayout() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Settings"
        description="Account preferences, team, connected platforms, and billing."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
      />
      <HubTabs tabs={tabs}>
        <Outlet />
      </HubTabs>
    </div>
  );
}

export default function SettingsHub() {
  return (
    <Routes>
      <Route element={<SettingsLayout />}>
        <Route index element={<Navigate to="account" replace />} />
        <Route path="account" element={<Settings />} />
        <Route path="team" element={<Team />} />
      </Route>
    </Routes>
  );
}
