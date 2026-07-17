import { NavLink } from "react-router-dom";
import { LayoutDashboard, Sparkles, Calendar, Bot, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const left = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard, exact: true, tour: "mobile-nav-home" },
  { label: "Create", href: "/dashboard/create", icon: Sparkles, tour: "mobile-nav-create" },
];
const right = [
  { label: "Engage", href: "/dashboard/engage", icon: Bot, tour: "mobile-nav-engage" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, tour: "mobile-nav-analytics" },
];

export function MobileHubNav() {
  return (
    <nav
      aria-label="Hub navigation"
      data-tour="mobile-nav"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-card/95 backdrop-blur-md border-t border-border"
    >
      <div className="relative h-full max-w-screen-sm mx-auto grid grid-cols-5 items-center px-2">
        {left.map((i) => (
          <NavLink
            key={i.href}
            to={i.href}
            end={i.exact}
            data-tour={i.tour}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium min-h-[48px] transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <i.icon className="w-5 h-5" />
            <span>{i.label}</span>
          </NavLink>
        ))}

        {/* Floating center */}
        <div className="flex items-start justify-center">
          <NavLink
            to="/dashboard/publish"
            data-tour="mobile-nav-publish"
            className={({ isActive }) =>
              cn(
                "-mt-8 w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0 shadow-lg ring-4 ring-background transition-transform active:scale-95",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )
            }
            aria-label="Publish"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[9px] font-semibold leading-none mt-0.5">Publish</span>
          </NavLink>
        </div>

        {right.map((i) => (
          <NavLink
            key={i.href}
            to={i.href}
            data-tour={i.tour}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium min-h-[48px] transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <i.icon className="w-5 h-5" />
            <span>{i.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
