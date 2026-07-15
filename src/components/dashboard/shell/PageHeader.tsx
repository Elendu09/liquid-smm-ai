import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  const location = useLocation();
  const crumbs: Crumb[] =
    breadcrumbs ??
    [{ label: "Dashboard", href: "/dashboard" }, { label: title }];

  return (
    <header
      className={cn(
        "flex flex-col gap-3 pb-5 mb-6 border-b border-border/60",
        className,
      )}
    >
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Link
          to="/dashboard"
          className="flex items-center gap-1 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          aria-label="Dashboard home"
        >
          <Home className="h-3 w-3" />
        </Link>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 opacity-60" />
            {c.href && i < crumbs.length - 1 ? (
              <Link
                to={c.href}
                className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                {c.label}
              </Link>
            ) : (
              <span
                className={
                  i === crumbs.length - 1
                    ? "text-foreground font-medium"
                    : undefined
                }
                aria-current={i === crumbs.length - 1 ? "page" : undefined}
              >
                {c.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 md:flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
