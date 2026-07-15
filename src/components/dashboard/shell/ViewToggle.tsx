import { useEffect, useState } from "react";
import { LayoutGrid, List, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "kanban" | "calendar" | "grid";

interface Option {
  value: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_OPTIONS: Option[] = [
  { value: "list", label: "List", icon: List },
  { value: "kanban", label: "Columns", icon: LayoutGrid },
];

export const VIEW_ICONS = {
  list: List,
  kanban: LayoutGrid,
  grid: LayoutGrid,
  calendar: CalendarIcon,
} as const;

interface ViewToggleProps {
  value?: ViewMode;
  onChange?: (v: ViewMode) => void;
  storageKey?: string;
  options?: Option[];
  className?: string;
}

export function useViewMode(storageKey: string, initial: ViewMode = "list") {
  const key = `smmsaas:view:${storageKey}`;
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return initial;
    return (localStorage.getItem(key) as ViewMode) || initial;
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, mode);
    } catch {
      /* ignore */
    }
  }, [key, mode]);
  return [mode, setMode] as const;
}

export function ViewToggle({
  value,
  onChange,
  storageKey,
  options = DEFAULT_OPTIONS,
  className,
}: ViewToggleProps) {
  const [internal, setInternal] = useViewMode(
    storageKey ?? "default",
    options[0].value,
  );
  const active = value ?? internal;
  const setActive = (v: ViewMode) => {
    if (onChange) onChange(v);
    else setInternal(v);
  };

  return (
    <div
      role="tablist"
      aria-label="Change view"
      className={cn(
        "inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-border/60 bg-muted/40",
        className,
      )}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = active === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            aria-label={opt.label + " view"}
            onClick={() => setActive(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium min-h-[36px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isActive
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
