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
  CornerDownLeft,
  Gift,
  Palette,
  Rss,
} from "lucide-react";
import { ConnectChannelsSection } from "./ConnectChannelsSection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useEffect, useMemo, useRef, KeyboardEvent } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SignOutDialog } from "@/components/auth/SignOutDialog";
import { CreditsPill } from "@/components/shared/CreditsPill";
import { BrandSwitcher } from "@/components/shared/BrandSwitcher";
import { HeaderActions } from "./HeaderActions";

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
      { label: "Studio", href: "/dashboard/create/studio", icon: Wand2 },
      { label: "Captions", href: "/dashboard/create/captions", icon: Type },
      { label: "Hashtags", href: "/dashboard/create/hashtags", icon: Hash },
    ],
  },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Target },
  {
    label: "Publish",

    href: "/dashboard/publish",
    icon: Calendar,
    children: [
      { label: "Queue", href: "/dashboard/publish/queue", icon: ListChecks },
      { label: "Calendar", href: "/dashboard/publish/calendar", icon: Calendar },
      { label: "Stories", href: "/dashboard/publish/stories", icon: Film },
      { label: "RSS Feeds", href: "/dashboard/publish/rss", icon: Rss },
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
      { label: "Captions", href: "/dashboard/library/captions", icon: Type },
      { label: "Assets", href: "/dashboard/library/assets", icon: ImageIcon },
      { label: "Presets", href: "/dashboard/library/presets", icon: Bookmark },
    ],
  },
  {
    label: "Link in Bio",
    href: "/dashboard/link-in-bio",
    icon: Link2,
    children: [
      { label: "Analytics", href: "/dashboard/link-in-bio/analytics", icon: BarChart3 },
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
  { label: "Team", href: "/dashboard/team", icon: Users, exact: true },
  { label: "Referrals", href: "/dashboard/referrals", icon: Gift, exact: true },
];

type CommandResult = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
  group: "Pages" | "Sections" | "Commands";
};

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
  const [activeIdx, setActiveIdx] = useState(0);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
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

  // Global ⌘K / Ctrl+K to focus search (desktop only — never pop the
  // on-screen keyboard on touch devices).
  useEffect(() => {
    if (isMobile) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile]);

  const openOnboardingTour = () => {
    window.dispatchEvent(new CustomEvent("smmpilot:open-onboarding-tour"));
    onNavigate?.();
  };

  const q = query.trim().toLowerCase();

  // Flat command results for search palette
  const commands: CommandResult[] = useMemo(() => {
    const cmds: CommandResult[] = [
      { id: "cmd-tour", label: "Start product tour", icon: HelpCircle, group: "Commands", action: openOnboardingTour, hint: "Guided walkthrough" },
      { id: "cmd-settings", label: "Open Settings", icon: Cog, group: "Commands", href: "/dashboard/settings", hint: "Preferences" },
      { id: "cmd-notifications", label: "Open Notifications", icon: Bell, group: "Commands", href: "/dashboard/activity/notifications" },
      { id: "cmd-signout", label: "Sign out", icon: LogOut, group: "Commands", action: () => setSignOutOpen(true) },
    ];

    const pages: CommandResult[] = [];
    for (const it of navItems) {
      pages.push({ id: `p-${it.href}`, label: it.label, icon: it.icon, href: it.href, group: "Pages", hint: it.href });
      if (it.children) {
        for (const c of it.children) {
          pages.push({
            id: `s-${c.href}`,
            label: c.label,
            icon: c.icon,
            href: c.href,
            group: "Sections",
            hint: `${it.label} › ${c.label}`,
          });
        }
      }
    }
    return [...pages, ...cmds];
  }, [navigate]);

  const results = useMemo(() => {
    if (!q) return [] as CommandResult[];
    return commands
      .filter((c) => c.label.toLowerCase().includes(q) || (c.hint ?? "").toLowerCase().includes(q))
      .slice(0, 12);
  }, [q, commands]);

  useEffect(() => setActiveIdx(0), [q]);

  const runResult = (r: CommandResult) => {
    if (r.href) navigate(r.href);
    r.action?.();
    setQuery("");
    onNavigate?.();
  };

  const onSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i - 1 + results.length) % results.length); }
    else if (e.key === "Enter") { e.preventDefault(); runResult(results[activeIdx]); }
    else if (e.key === "Escape") { setQuery(""); }
  };

  const grouped = useMemo(() => {
    const g: Record<string, CommandResult[]> = { Pages: [], Sections: [], Commands: [] };
    results.forEach((r) => g[r.group].push(r));
    return g;
  }, [results]);

  return (
    <TooltipProvider delayDuration={200}>
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-border/50 flex-shrink-0">
        <Link to="/" data-tour="brand" className="flex items-center gap-2.5 min-w-0" onClick={onNavigate}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 ring-1 ring-primary/20">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          {showLabels && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-['Instrument_Serif'] text-2xl leading-none tracking-tight text-foreground truncate">
                SMMSAAS<span className="italic text-primary">.</span>
              </span>
              <span className="text-[9px] font-semibold tracking-[0.16em] text-primary/80 uppercase">
                Panel Manager
              </span>
            </div>
          )}
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full border border-border/60 bg-card/60 hover:bg-muted"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>

      {/* Search */}
      {showLabels && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Search pages, sections…"
              className="h-9 pl-8 pr-12 text-xs bg-muted/40 border-border/50 rounded-lg focus-visible:ring-1 focus-visible:ring-primary/40"
              aria-label="Search navigation"
            />
            <kbd className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 h-5 items-center gap-0.5 px-1.5 rounded border border-border/60 bg-background/70 text-[9px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>
      )}

      {/* Nav / Search results */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto scrollbar-none" aria-label="Primary">
        {showLabels && q ? (
          <div className="space-y-3 pt-1">
            {(["Pages", "Sections", "Commands"] as const).map((g) =>
              grouped[g].length ? (
                <div key={g}>
                  <div className="px-2 pb-1 text-[9.5px] font-bold tracking-[0.18em] text-muted-foreground/70 uppercase">
                    {g}
                  </div>
                  <div className="space-y-0.5">
                    {grouped[g].map((r) => {
                      const flatIdx = results.indexOf(r);
                      const isActive = flatIdx === activeIdx;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onMouseEnter={() => setActiveIdx(flatIdx)}
                          onClick={() => runResult(r)}
                          className={cn(
                            "group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium min-h-[34px] transition-colors",
                            isActive
                              ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          )}
                        >
                          <r.icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                          <span className="flex-1 text-left truncate">{r.label}</span>
                          {r.hint && (
                            <span className="text-[10px] text-muted-foreground/70 truncate max-w-[110px]">
                              {r.hint}
                            </span>
                          )}
                          {isActive && <CornerDownLeft className="w-3 h-3 opacity-70" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null,
            )}
            {!results.length && (
              <div className="px-2 py-8 text-center text-[11px] text-muted-foreground">
                No matches for "{query}"
              </div>
            )}
          </div>
        ) : (
          <>
            {showLabels && (
              <div className="px-2 pt-1 pb-1 text-[9.5px] font-bold tracking-[0.18em] text-muted-foreground/70 uppercase">
                Main
              </div>
            )}
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href) && item.href !== "/dashboard";
              const hasKids = !!item.children?.length;
              const isOpen = !!openGroups[item.href];

              const rowContent = (
                <div
                  data-tour={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg text-[12.5px] font-medium min-h-[36px] transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    !showLabels && "justify-center",
                  )}
                >
                  {active && showLabels && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary-foreground/70" />
                  )}
                  {/* Main click target → navigate */}
                  <button
                    type="button"
                    onClick={() => {
                      navigate(item.href);
                      if (hasKids && showLabels) {
                        setOpenGroups((p) => ({ ...p, [item.href]: true }));
                      }
                      onNavigate?.();
                    }}
                    className={cn(
                      "flex items-center gap-2.5 flex-1 min-w-0 px-2.5 py-2 text-left",
                      !showLabels && "justify-center px-0",
                    )}
                    title={!showLabels ? item.label : undefined}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {showLabels && <span className="flex-1 truncate">{item.label}</span>}
                  </button>
                  {/* Chevron toggle */}
                  {showLabels && hasKids && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenGroups((p) => ({ ...p, [item.href]: !p[item.href] }));
                      }}
                      className={cn(
                        "h-full px-2 flex items-center rounded-r-lg opacity-70 hover:opacity-100 hover:bg-black/10",
                        active && "hover:bg-white/15",
                      )}
                      aria-label={isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
                      aria-expanded={isOpen}
                    >
                      <ChevronDown
                        className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")}
                      />
                    </button>
                  )}
                </div>
              );

              return (
                <div key={item.href}>
                  {!showLabels ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{rowContent}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    rowContent
                  )}

                  {showLabels && hasKids && isOpen && (
                    <div className="mt-0.5 mb-1 ml-4 pl-3 border-l border-border/50 space-y-0.5">
                      {item.children!.map((sub) => (
                        <NavLink
                          key={sub.href}
                          to={sub.href}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-md text-[11.5px] font-medium min-h-[28px] transition-colors",
                              isActive
                                ? "text-primary bg-primary/10 ring-1 ring-primary/20"
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

            {showLabels && <ConnectChannelsSection onNavigate={onNavigate} />}

            {showLabels && (
              <>
                <div className="px-2 pt-4 pb-1 text-[9.5px] font-bold tracking-[0.18em] text-muted-foreground/70 uppercase">
                  Workspace
                </div>
                <NavLink
                  to="/dashboard/settings"
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium min-h-[36px] transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    )
                  }
                >
                  <Cog className="w-4 h-4 flex-shrink-0" />
                  <span>Settings</span>
                </NavLink>
                <NavLink
                  to="/dashboard/support"
                  data-tour="support"
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium min-h-[36px] transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    )
                  }
                >
                  <HelpCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Help & Support</span>
                </NavLink>
              </>
            )}
            {!showLabels && (
              <>
                <ConnectChannelsSection collapsed />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to="/dashboard/settings"
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "mt-2 flex items-center justify-center px-0 py-2 rounded-lg min-h-[36px] transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                        )
                      }
                    >
                      <Cog className="w-4 h-4" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">Settings</TooltipContent>
                </Tooltip>
              </>
            )}
          </>
        )}
      </nav>

      {/* Bottom action bar */}
      <div className="p-2 border-t border-border/50 flex-shrink-0 bg-gradient-to-b from-transparent to-muted/20">
        <div
          className={cn(
            "flex items-center gap-1 rounded-xl bg-muted/30 backdrop-blur-sm p-1 ring-1 ring-border/40",
            showLabels ? "justify-between" : "flex-col justify-center gap-1",
          )}
        >
          {showLabels && <CreditsPill variant="compact" />}
          <Tooltip>
            <TooltipTrigger asChild>
              <div><NotificationBell collapsed /></div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Notifications</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div><ThemeToggle /></div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Toggle theme</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg"
                onClick={openOnboardingTour}
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
                className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setSignOutOpen(true);
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
      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
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
      <div
        className="lg:hidden fixed left-0 right-0 z-40 h-14 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-4"
        style={{ top: "var(--demo-banner-h, 0px)" }}
      >
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" data-tour="mobile-menu" className="h-9 w-9" aria-label="Open navigation">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          {/* Prevent Radix auto-focusing the search input, which would pop the
              on-screen keyboard every time the drawer opens on mobile/tablet. */}
          <SheetContent
            side="left"
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="p-0 w-72 flex flex-col rounded-r-3xl border-border/60 bg-card/95 backdrop-blur-xl"
          >
            <SidebarContent
              collapsed={false}
              setCollapsed={setCollapsed}
              onNavigate={() => setMobileOpen(false)}
              isMobile
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="hidden lg:flex w-7 h-7 rounded-lg bg-gradient-to-br from-primary via-primary to-primary/70 items-center justify-center shadow-sm shadow-primary/30 ring-1 ring-primary/20">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-['Instrument_Serif'] text-lg sm:text-xl leading-none tracking-tight text-foreground truncate">
              SMMSAAS<span className="italic text-primary">.</span>
            </span>
          </Link>
          <BrandSwitcher compact className="shrink-0" />
        </div>
        <HeaderActions compact className="ml-auto" />
      </div>


      <aside
        className={cn(
          "hidden lg:flex h-dvh sticky top-0 flex-col border-r border-border/60 bg-gradient-to-b from-card via-card to-card/95 transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>
    </>
  );
}
