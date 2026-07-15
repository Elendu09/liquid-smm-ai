import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  Bot,
  BarChart3,
  Hash,
  MessageSquare,
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Film,
  MessageCircle,
  Users,
  Target,
  LinkIcon,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems: { label: string; href: string; icon: typeof LayoutDashboard; toolKey?: string }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Caption Generator", href: "/dashboard/caption-generator", icon: Sparkles, toolKey: "caption-generator" },
  { label: "Post Scheduler", href: "/dashboard/scheduler", icon: Calendar, toolKey: "scheduler" },
  { label: "Engagement Bot", href: "/dashboard/engagement-bot", icon: Bot, toolKey: "engagement-bot" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Hashtag Research", href: "/dashboard/hashtag-research", icon: Hash, toolKey: "hashtag-research" },
  { label: "Comment Manager", href: "/dashboard/comment-manager", icon: MessageSquare, toolKey: "comment-manager" },
  { label: "Content Calendar", href: "/dashboard/content-calendar", icon: CalendarDays },
  { label: "Story Automation", href: "/dashboard/story-automation", icon: Film, toolKey: "story-automation" },
  { label: "DM Automation", href: "/dashboard/dm-automation", icon: MessageCircle, toolKey: "dm-automation" },
  { label: "Follower Analyzer", href: "/dashboard/follower-analyzer", icon: Users, toolKey: "follower-analyzer" },
  { label: "Competitor Tracker", href: "/dashboard/competitor-tracker", icon: Target, toolKey: "competitor-tracker" },
  { label: "Link in Bio", href: "/dashboard/link-bio", icon: LinkIcon },
];

const bottomItems = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarContentProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onNavigate?: () => void;
  isMobile?: boolean;
}

function SidebarContent({ collapsed, setCollapsed, onNavigate, isMobile }: SidebarContentProps) {
  const location = useLocation();
  const showLabels = isMobile || !collapsed;

  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
        <Link to="/" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {showLabels && (
            <span className="text-lg font-bold bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
              SMMPilot
            </span>
          )}
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "animate-pulse")} />
              {showLabels && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-border space-y-1 flex-shrink-0">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {showLabels && <span>{item.label}</span>}
            </Link>
          );
        })}

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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
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
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
            SMMPilot
          </span>
        </Link>
        <div className="w-9" />
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex h-screen sticky top-0 flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>
    </>
  );
}
