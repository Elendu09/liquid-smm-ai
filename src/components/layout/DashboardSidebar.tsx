import { Link, useLocation, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
  Calendar,
  Bot,
  BarChart3,
  Users,
  FolderOpen,
  Clock,
  Cog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems: { label: string; href: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Create", href: "/dashboard/create", icon: Sparkles },
  { label: "Publish", href: "/dashboard/publish", icon: Calendar },
  { label: "Engage", href: "/dashboard/engage", icon: Bot },
  { label: "Audience", href: "/dashboard/audience", icon: Users },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Library", href: "/dashboard/library", icon: FolderOpen },
  { label: "Activity", href: "/dashboard/activity", icon: Clock },
  { label: "Settings", href: "/dashboard/settings", icon: Cog },
];

interface SidebarContentProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onNavigate?: () => void;
  isMobile?: boolean;
}

function SidebarContent({ collapsed, setCollapsed, onNavigate, isMobile }: SidebarContentProps) {
  const showLabels = isMobile || !collapsed;

  return (
    <>
      <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 min-w-0" onClick={onNavigate}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          {showLabels && (
            <span className="text-base font-black tracking-tight text-foreground truncate">
              SMMSAAS
            </span>
          )}
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )
            }
            title={!showLabels ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {showLabels && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-1 flex-shrink-0">
        <Link
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {showLabels && <span>Full settings</span>}
        </Link>

        <div className={cn("flex items-center gap-3 px-3 py-2", !showLabels && "justify-center")}>
          <ThemeToggle />
          {showLabels && <span className="text-sm text-muted-foreground">Theme</span>}
        </div>

        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {showLabels && <span>Logout</span>}
        </button>
      </div>
    </>
  );
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open navigation">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 flex flex-col">
            <SidebarContent
              collapsed={false}
              setCollapsed={setCollapsed}
              onNavigate={() => setMobileOpen(false)}
              isMobile
            />
          </SheetContent>
        </Sheet>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-base font-black tracking-tight text-foreground">
            SMMSAAS
          </span>
        </Link>
        <div className="w-9" />
      </div>

      <aside
        className={cn(
          "hidden lg:flex h-screen sticky top-0 flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>
    </>
  );
}
