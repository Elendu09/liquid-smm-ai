import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      {/* pt-14 on mobile to clear the fixed top bar */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
