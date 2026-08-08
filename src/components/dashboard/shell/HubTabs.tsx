import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface HubTab {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface HubTabsProps {
  tabs: HubTab[];
  className?: string;
  children?: ReactNode;
}

export function HubTabs({ tabs, className, children }: HubTabsProps) {
  const location = useLocation();
  const isTabActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");
  const anyActive = tabs.some((t) => isTabActive(t.href));

  return (
    <div className={cn("w-full min-w-0", children ? "space-y-6" : undefined, className)}>
      <div className="relative w-full min-w-0">
        <div
          role="tablist"
          aria-label="Section tabs"
          className="flex gap-1 p-1 rounded-xl border border-border/60 bg-muted/40 md:w-fit max-w-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
        >
          {tabs.map((t, i) => {
            const active = isTabActive(t.href) || (!anyActive && i === 0);
            return (
            <NavLink
              key={t.href}
              to={t.href}
              role="tab"
              aria-current={active ? "page" : undefined}
              className={cn(
                "snap-start flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium min-h-[40px] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.icon && <t.icon className="h-4 w-4" />}
              <span>{t.label}</span>
              {t.badge != null && (
                <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                  {t.badge}
                </span>
              )}
            </NavLink>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
