import { Route, Routes, Navigate, Outlet } from "react-router-dom";
import { UserCog, Bell, BellRing, Link2, CreditCard, Shield, Users, ScrollText, Puzzle, KeyRound, Palette, Webhook } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import {
  AccountPanel,
  NotificationPreferencesPanel,
  TeamActivityNotificationsPanel,
  ConnectedPanel,
  BillingPanel,
  SecurityPanel,
} from "@/components/settings/SettingsPanels";
import { AuditPanel } from "@/components/settings/AuditPanel";
import { RolesMatrixPanel } from "@/components/settings/RolesMatrixPanel";
import { WhiteLabelPanel } from "@/components/settings/WhiteLabelPanel";
import { WebhooksPanel } from "@/components/settings/WebhooksPanel";
import Team from "../Team";
import Integrations from "../Integrations";
import IntegrationDetail from "../IntegrationDetail";

const tabs: HubTab[] = [
  { label: "Account", href: "/dashboard/settings/account", icon: UserCog },
  { label: "Notifications", href: "/dashboard/settings/notifications", icon: Bell },
  { label: "Team alerts", href: "/dashboard/settings/team-alerts", icon: BellRing },
  { label: "Connected", href: "/dashboard/settings/connected", icon: Link2 },
  { label: "Integrations", href: "/dashboard/settings/integrations", icon: Puzzle },
  { label: "Webhooks", href: "/dashboard/settings/webhooks", icon: Webhook },
  { label: "Billing", href: "/dashboard/settings/billing", icon: CreditCard },
  { label: "Security", href: "/dashboard/settings/security", icon: Shield },
  { label: "Team", href: "/dashboard/settings/team", icon: Users },
  { label: "Roles", href: "/dashboard/settings/roles", icon: KeyRound },
  { label: "White-label", href: "/dashboard/settings/white-label", icon: Palette },
  { label: "Audit log", href: "/dashboard/settings/audit", icon: ScrollText },
];

function SettingsLayout() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent"
      />
      <div className="relative px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Settings"
          description="Profile, notifications, connected platforms, billing, security, team, and audit log."
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
        <Route path="notifications" element={<Wrap><NotificationPreferencesPanel /></Wrap>} />
        <Route path="team-alerts" element={<Wrap><TeamActivityNotificationsPanel /></Wrap>} />
        <Route path="connected" element={<Wrap><ConnectedPanel /></Wrap>} />
        <Route path="integrations" element={<Wrap><Integrations /></Wrap>} />
        <Route path="integrations/:slug" element={<Wrap><IntegrationDetail /></Wrap>} />
        <Route path="webhooks" element={<Wrap><WebhooksPanel /></Wrap>} />
        <Route path="billing" element={<Wrap><BillingPanel /></Wrap>} />
        <Route path="security" element={<Wrap><SecurityPanel /></Wrap>} />
        <Route path="team" element={<Team />} />
        <Route path="roles" element={<Wrap><RolesMatrixPanel /></Wrap>} />
        <Route path="white-label" element={<Wrap><WhiteLabelPanel /></Wrap>} />
        <Route path="audit" element={<Wrap><AuditPanel /></Wrap>} />
      </Route>
    </Routes>
  );
}


