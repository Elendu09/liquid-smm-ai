import { ReactNode, useEffect, useRef } from "react";
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

function isTabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function HubTabs({ tabs, className, children }: HubTabsProps) {
  const location = useLocation();
  const anyActive = tabs.some((t) => isTabActive(location.pathname, t.href));
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active tab into view (mobile horizontal strip).
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [location.pathname]);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="relative -mx-4 sm:mx-0">
        <div
          ref={listRef}
          role="tablist"
          aria-label="Section tabs"
          className="flex gap-1 p-1 mx-4 sm:mx-0 rounded-xl border border-border/60 bg-muted/40 w-fit max-w-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
        >
          {tabs.map((t, i) => {
            const active = isTabActive(location.pathname, t.href);
            return (
              <NavLink
                key={t.href}
                to={t.href}
                end={false}
                role="tab"
                aria-current={active ? "page" : undefined}
                className={cn(
                  "snap-start flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium min-h-[40px] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  (active || (!anyActive && i === 0))
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

