import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { BarChart3, FileText, Activity, LayoutDashboard } from "lucide-react";
import { PageHeader, HubTabs, type HubTab } from "@/components/dashboard/shell";
import Analytics from "../Analytics";
import Reports from "../Reports";
import CustomReportsView from "../views/CustomReportsView";
import HealthOverviewView from "../views/HealthOverviewView";

const tabs: HubTab[] = [
  { label: "Overview", href: "/dashboard/analytics/overview", icon: BarChart3 },
  { label: "Custom", href: "/dashboard/analytics/custom", icon: LayoutDashboard },
  { label: "Reports", href: "/dashboard/analytics/reports", icon: FileText },
  { label: "Health", href: "/dashboard/analytics/health", icon: Activity },
];

function AnalyticsLayout() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Analytics"
          description="Growth, reporting, and account health in one place."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics" }]}
        />
        <HubTabs tabs={tabs} />
      </div>
      <Outlet />
    </div>
  );
}

export default function AnalyticsHub() {
  return (
    <Routes>
      <Route element={<AnalyticsLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Analytics />} />
        <Route path="custom" element={<CustomReportsView />} />
        <Route path="reports" element={<Reports />} />
        <Route path="health" element={<HealthOverviewView />} />
      </Route>
    </Routes>
  );
}
