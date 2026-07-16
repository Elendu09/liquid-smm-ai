import { Link, useLocation, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  Sparkles,
  Calendar,
  Bot,
  BarChart3,
  Users,
  FolderOpen,
  Clock,
  Cog,
  Search,
  HelpCircle,
  Wand2,
  Hash,
  Type,
  ListChecks,
  Film,
  MessageSquare,
  Inbox,
  Send,
  UserSearch,
  Target,
  Activity,
  FileBarChart,
  HeartPulse,
  Image as ImageIcon,
  Link2,
  Bookmark,
  Terminal,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SubItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  children?: SubItem[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  {
    label: "Create",
    href: "/dashboard/create",
    icon: Sparkles,
    children: [
      { label: "AI Studio", href: "/dashboard/create/ai", icon: Wand2 },
      { label: "Captions", href: "/dashboard/create/captions", icon: Type },
      { label: "Hashtags", href: "/dashboard/create/hashtags", icon: Hash },
    ],
  },
  {
    label: "Publish",
    href: "/dashboard/publish",
    icon: Calendar,
    children: [
      { label: "Queue", href: "/dashboard/publish/queue", icon: ListChecks },
      { label: "Calendar", href: "/dashboard/publish/calendar", icon: Calendar },
      { label: "Stories", href: "/dashboard/publish/stories", icon: Film },
    ],
  },
  {
    label: "Engage",
    href: "/dashboard/engage",
    icon: Bot,
    children: [
      { label: "Inbox", href: "/dashboard/engage/inbox", icon: Inbox },
      { label: "Comments", href: "/dashboard/engage/comments", icon: MessageSquare },
      { label: "DMs", href: "/dashboard/engage/dms", icon: Send },
      { label: "Bot rules", href: "/dashboard/engage/bot", icon: Bot },
    ],
  },
  {
    label: "Audience",
    href: "/dashboard/audience",
    icon: Users,
    children: [
      { label: "Followers", href: "/dashboard/audience/followers", icon: UserSearch },
      { label: "Segments", href: "/dashboard/audience/segments", icon: Users },
      { label: "Competitors", href: "/dashboard/audience/competitors", icon: Target },
    ],
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    children: [
      { label: "Overview", href: "/dashboard/analytics/overview", icon: Activity },
      { label: "Reports", href: "/dashboard/analytics/reports", icon: FileBarChart },
      { label: "Account health", href: "/dashboard/analytics/health", icon: HeartPulse },
    ],
  },
  {
    label: "Library",
    href: "/dashboard/library",
    icon: FolderOpen,
    children: [
      { label: "Assets", href: "/dashboard/library/assets", icon: ImageIcon },
      { label: "Link in bio", href: "/dashboard/library/link-bio", icon: Link2 },
      { label: "Presets", href: "/dashboard/library/presets", icon: Bookmark },
    ],
  },
  {
    label: "Activity",
    href: "/dashboard/activity",
    icon: Clock,
    children: [
      { label: "Runs", href: "/dashboard/activity/runs", icon: Clock },
      { label: "MCP calls", href: "/dashboard/activity/mcp", icon: Terminal },
      { label: "Notifications", href: "/dashboard/activity/notifications", icon: Bell },
    ],
  },
];

interface SidebarContentProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onNavigate?: () => void;
  isMobile?: boolean;
}

function SidebarContent({ collapsed, setCollapsed, onNavigate, isMobile }: SidebarContentProps) {
  const showLabels = isMobile || !collapsed;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const it of navItems) {
      if (it.children && pathname.startsWith(it.href) && it.href !== "/dashboard") {
        init[it.href] = true;
      }
    }
    return init;
  });

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const it of navItems) {
        if (it.children && pathname.startsWith(it.href) && it.href !== "/dashboard") {
          next[it.href] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return navItems;
    return navItems
      .map((it) => {
        const parentMatch = it.label.toLowerCase().includes(q);
        const kids = it.children?.filter((c) => c.label.toLowerCase().includes(q)) ?? [];
        if (parentMatch) return it;
        if (kids.length) return { ...it, children: kids };
        return null;
      })
      .filter(Boolean) as NavItem[];
  }, [q]);

  const openOnboarding = () => {
    window.dispatchEvent(new CustomEvent("smmpilot:open-onboarding"));
    onNavigate?.();
  };

  return (
    <TooltipProvider delayDuration={200}>
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-border/60 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 min-w-0" onClick={onNavigate}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          {showLabels && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[13px] font-black tracking-tight text-foreground truncate">
                HOME OF SMM
              </span>
              <span className="text-[9px] font-semibold tracking-[0.14em] text-primary/80 uppercase">
                Panel Manager
              </span>
            </div>
          )}
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full border border-border/60 bg-card/60"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>

      {/* Search */}
      {showLabels && (
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-8 pl-8 pr-10 text-xs bg-muted/40 border-border/60 rounded-lg"
              aria-label="Search navigation"
            />
            <kbd className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 h-5 items-center gap-0.5 px-1.5 rounded border border-border/60 bg-background/70 text-[9px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-none" aria-label="Primary">
        {showLabels && (
          <div className="px-2 pb-1 text-[10px] font-bold tracking-[0.16em] text-muted-foreground/70 uppercase">
            Main
          </div>
        )}
        {filtered.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== "/dashboard";
          const hasKids = !!item.children?.length;
          const isOpen = !!openGroups[item.href] || !!q;

          const rowBtn = (
            <button
              type="button"
              onClick={() => {
                navigate(item.href);
                if (hasKids && showLabels) {
                  setOpenGroups((p) => ({ ...p, [item.href]: !p[item.href] }));
                }
                onNavigate?.();
              }}
              className={cn(
                "group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium min-h-[36px] transition-colors",
                (item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== "/dashboard") || pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                !showLabels && "justify-center px-0",
              )}
              title={!showLabels ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {showLabels && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {hasKids && (
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform opacity-70",
                        isOpen && "rotate-180",
                      )}
                    />
                  )}
                </>
              )}
            </button>
          );

          return (
            <div key={item.href}>
              {!showLabels ? (
                <Tooltip>
                  <TooltipTrigger asChild>{rowBtn}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                rowBtn
              )}

              {showLabels && hasKids && isOpen && (
                <div className="mt-0.5 mb-1 ml-3 pl-3 border-l border-border/60 space-y-0.5">
                  {item.children!.map((sub) => (
                    <NavLink
                      key={sub.href}
                      to={sub.href}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-md text-[11.5px] font-medium min-h-[30px] transition-colors",
                          isActive
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/50",
                        )
                      }
                    >
                      <sub.icon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
                      <span className="truncate">{sub.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {showLabels && filtered.length === 0 && (
          <div className="px-2 py-6 text-center text-[11px] text-muted-foreground">
            No matches for "{query}"
          </div>
        )}
      </nav>

      {/* Settings row */}
      <div className="px-2 pt-2 border-t border-border/60 flex-shrink-0">
        <NavLink
          to="/dashboard/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium min-h-[36px] transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              !showLabels && "justify-center px-0",
            )
          }
          title={!showLabels ? "Settings" : undefined}
        >
          <Cog className="w-4 h-4 flex-shrink-0" />
          {showLabels && <span>Settings</span>}
        </NavLink>
      </div>

      {/* Bottom action bar: notifications / theme / onboarding / logout */}
      <div className="mt-2 p-2 border-t border-border/60 flex-shrink-0 bg-muted/20">
        <div
          className={cn(
            "flex items-center gap-1",
            showLabels ? "justify-between" : "flex-col justify-center gap-1.5",
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <NotificationBell collapsed />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Notifications</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <ThemeToggle />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Toggle theme</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={openOnboarding}
                aria-label="Onboarding tour"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Onboarding tour</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  onNavigate?.();
                  navigate("/login");
                }}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Sign out</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
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
          <span className="text-base font-black tracking-tight text-foreground">HOME OF SMM</span>
        </Link>
        <div className="w-9" />
      </div>

      <aside
        className={cn(
          "hidden lg:flex h-dvh sticky top-0 flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>
    </>
  );
}
