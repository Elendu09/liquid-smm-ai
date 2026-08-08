import { ReactNode, useRef, useState, useEffect, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isTabActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");
  const anyActive = tabs.some((t) => isTabActive(t.href));

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, tabs.length]);

  // Scroll active tab into view on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector('[aria-current="page"]') as HTMLElement | null;
    if (activeEl) {
      const containerRect = el.getBoundingClientRect();
      const tabRect = activeEl.getBoundingClientRect();
      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [location.pathname]);

  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  return (
    <div className={cn("w-full min-w-0", children ? "space-y-6" : undefined, className)}>
      <div className="relative w-full min-w-0 group">
        {/* Left scroll arrow */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll tabs left"
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 hidden sm:grid h-7 w-7 place-items-center rounded-full border border-border/60 bg-background/90 shadow-md backdrop-blur-sm text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Left fade */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-[5] w-8 bg-gradient-to-r from-muted/80 to-transparent rounded-l-xl" />
        )}

        <div
          ref={scrollRef}
          role="tablist"
          aria-label="Section tabs"
          className="flex gap-0.5 sm:gap-1 p-1 rounded-xl border border-border/60 bg-muted/40 md:w-fit max-w-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
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
                "snap-start flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium min-h-[36px] sm:min-h-[40px] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.icon && <t.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
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

        {/* Right fade */}
        {canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-[5] w-8 bg-gradient-to-l from-muted/80 to-transparent rounded-r-xl" />
        )}

        {/* Right scroll arrow */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scroll tabs right"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 hidden sm:grid h-7 w-7 place-items-center rounded-full border border-border/60 bg-background/90 shadow-md backdrop-blur-sm text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
