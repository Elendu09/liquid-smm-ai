import { Outlet, Route, Routes, Navigate } from "react-router-dom";
import { BarChart3, FileText, Activity } from "lucide-react";
import { PageHeader, HubTabs, StatusBoard, type HubTab } from "@/components/dashboard/shell";
import Analytics from "../Analytics";
import Reports from "../Reports";

const tabs: HubTab[] = [
  { label: "Overview", href: "/dashboard/analytics/overview", icon: BarChart3 },
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


const healthSeed = [
  { id: "h1", title: "Instagram · @smmpilot", subtitle: "Reach down 12% w/w", status: "warning", createdAt: new Date().toISOString() },
  { id: "h2", title: "TikTok · @smmpilot_official", subtitle: "All systems green", status: "healthy", createdAt: new Date().toISOString() },
  { id: "h3", title: "YouTube · SMMSAASChannel", subtitle: "Copyright strike pending", status: "critical", createdAt: new Date().toISOString() },
];

export default function AnalyticsHub() {
  return (
    <Routes>
      <Route element={<AnalyticsLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route
          path="health"
          element={
            <StatusBoard
              storageKey="analytics:health"
              hubKey="analytics-health"
              icon={Activity}
              searchPlaceholder="Search accounts…"
              addPlaceholder="Add check…"
              seed={healthSeed}
              columns={[
                { id: "healthy", label: "Healthy" },
                { id: "warning", label: "Warning" },
                { id: "critical", label: "Critical" },
              ]}
            />
          }
        />
      </Route>
    </Routes>
  );
}
