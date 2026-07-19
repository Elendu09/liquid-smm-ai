import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BulkAction = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void | Promise<void>;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  disabled?: boolean;
};

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  actions: BulkAction[];
  label?: string;
  className?: string;
}

/**
 * Floating glassmorphic action bar that appears when items are selected.
 * Mount once per page next to the list; feed it from useBulkSelection.
 */
export function BulkActionBar({ count, onClear, actions, label = "selected", className }: BulkActionBarProps) {
  if (count <= 0) return null;
  return (
    <>
      {(
        <div
          className={cn(
            "pointer-events-auto fixed inset-x-0 bottom-24 z-40 mx-auto flex w-fit max-w-[95vw] items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-2 shadow-xl backdrop-blur-xl md:bottom-8",
            "animate-in fade-in slide-in-from-bottom-4 duration-200",
            className,
          )}
          role="toolbar"
          aria-label="Bulk actions"
        >
          <div className="flex items-center gap-2 pl-2 pr-1">
            <span className="text-sm font-semibold tabular-nums">{count}</span>
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
          </div>
          <div className="mx-1 h-6 w-px bg-border/60" />
          <div className="flex items-center gap-1 overflow-x-auto">
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <Button
                  key={a.id}
                  size="sm"
                  variant={a.variant ?? "ghost"}
                  disabled={a.disabled}
                  onClick={a.onClick}
                  className="h-8 rounded-full px-3 text-xs"
                >
                  {Icon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
                  {a.label}
                </Button>
              );
            })}
          </div>
          <div className="mx-1 h-6 w-px bg-border/60" />
          <Button
            size="icon"
            variant="ghost"
            onClick={onClear}
            aria-label="Clear selection"
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
