import { Outlet, Route, Routes, Navigate, Link } from "react-router-dom";
import { UserCog, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, HubTabs, SectionCard, type HubTab } from "@/components/dashboard/shell";
import Team from "../Team";

const tabs: HubTab[] = [
  { label: "Account", href: "/dashboard/settings/account", icon: UserCog },
  { label: "Team", href: "/dashboard/settings/team", icon: Users },
];

function AccountPanel() {
  return (
    <SectionCard
      title="Account preferences"
      description="Profile, notifications, connected platforms, and billing live on the full settings page."
    >
      <Button asChild>
        <Link to="/settings">
          Open account settings
          <ExternalLink className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </SectionCard>
  );
}

function SettingsLayout() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Settings"
        description="Account preferences and team management."
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
        <Route path="account" element={<AccountPanel />} />
        <Route path="team" element={<Team />} />
      </Route>
    </Routes>
  );
}
