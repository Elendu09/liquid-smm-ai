import { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface ToolbarBarProps {
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  viewToggle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ToolbarBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
  viewToggle,
  actions,
  className,
}: ToolbarBarProps) {
  return (
    <div
      className={cn(
        "sticky top-14 lg:top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-4 bg-background/85 backdrop-blur-md border-b border-border/60",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange && (
          <div className="relative flex-1 min-w-[180px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8 h-10"
              aria-label="Search"
            />
          </div>
        )}
        {filters && <div className="flex flex-wrap items-center gap-1.5">{filters}</div>}
        <div className="ml-auto flex items-center gap-2">
          {viewToggle}
          {actions}
        </div>
      </div>
    </div>
  );
}
