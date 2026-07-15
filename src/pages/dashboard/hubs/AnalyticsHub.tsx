import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { BarChart3, FileText, Activity } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import Analytics from "../Analytics";
import Reports from "../Reports";
import AccountHealth from "../AccountHealth";

const tabs: HubTab[] = [
  { label: "Overview", href: "/dashboard/analytics/overview", icon: BarChart3 },
  { label: "Reports", href: "/dashboard/analytics/reports", icon: FileText },
  { label: "Health", href: "/dashboard/analytics/health", icon: Activity },
];

function AnalyticsLayout() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Analytics"
        description="Growth, reporting, and account health in one place."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics" }]}
      />
      <HubTabs tabs={tabs}>
        <Outlet />
      </HubTabs>
    </div>
  );
}

export default function AnalyticsHub() {
  return (
    <Routes>
      <Route element={<AnalyticsLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="health" element={<AccountHealth />} />
      </Route>
    </Routes>
  );
}
