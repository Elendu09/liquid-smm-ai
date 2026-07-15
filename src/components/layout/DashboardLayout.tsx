import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { MobileHubNav } from "@/components/dashboard/shell/MobileHubNav";

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      {/* pt-14 on mobile to clear the fixed top bar */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 min-w-0">
        <Outlet />
        {/* Mobile spacer so page content isn't hidden behind fixed bottom nav */}
        <div className="h-20 lg:hidden" aria-hidden />
      </main>
      <MobileHubNav />
    </div>
  );
}
