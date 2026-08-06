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

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "relative flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-medium min-h-[44px] transition-all duration-300",
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
  );

function Item({ i }: { i: (typeof left)[number] }) {
  return (
    <NavLink key={i.href} to={i.href} end={"exact" in i ? i.exact : undefined} data-tour={i.tour} className={itemClass}>
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "grid h-8 w-11 place-items-center rounded-full transition-all duration-300",
              isActive
                ? "bg-primary/20 ring-1 ring-primary/35 shadow-[0_4px_14px_-6px_hsl(var(--primary)/0.6),inset_0_1px_0_hsl(var(--foreground)/0.1)]"
                : "bg-transparent",
            )}
          >
            <i.icon className={cn("transition-all duration-300", isActive ? "w-[18px] h-[18px]" : "w-5 h-5")} />
          </span>
          <span className={cn("leading-none transition-opacity", isActive ? "opacity-100" : "opacity-80")}>
            {i.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export function MobileHubNav() {
  return (
    <nav
      aria-label="Hub navigation"
      data-tour="mobile-nav"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="relative mx-auto max-w-screen-sm liquid-pill animate-liquid-rise">
        {/* Slow-moving ambient halo behind the nav for the liquid look */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-3 rounded-[inherit] liquid-orb"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 50%, hsl(var(--primary) / 0.35) 0%, hsl(var(--primary) / 0) 70%)",
            zIndex: -1,
          }}
        />
        {/* Soft top highlight for the glass edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[26px] bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />

        <div className="grid grid-cols-5 items-center px-2 py-1.5">
          {left.map((i) => (
            <Item key={i.href} i={i} />
          ))}

          {/* Floating center publish action */}
          <div className="flex items-start justify-center">
            <NavLink
              to="/dashboard/publish"
              data-tour="mobile-nav-publish"
              className={({ isActive }) =>
                cn(
                  "-mt-7 flex h-14 w-14 flex-col items-center justify-center gap-0 rounded-full bg-primary text-primary-foreground ring-[5px] ring-background transition-transform duration-200 active:scale-95",
                  isActive
                    ? "shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.85)]"
                    : "shadow-[0_8px_24px_-10px_hsl(var(--primary)/0.7)] hover:bg-primary/90",
                )
              }
              aria-label="Publish"
            >
              <Calendar className="h-5 w-5" />
              <span className="mt-0.5 text-[9px] font-semibold leading-none">Publish</span>
            </NavLink>
          </div>

          {right.map((i) => (
            <Item key={i.href} i={i} />
          ))}
        </div>
      </div>
    </nav>
  );
}
