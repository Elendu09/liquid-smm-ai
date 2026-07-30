import { useMemo, useState } from "react";
import { Building2, Check, ChevronsUpDown, Layers, Plus, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useBrands } from "@/contexts/BrandContext";
import { useAccounts } from "@/contexts/AccountContext";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** Compact icon-first trigger for tight headers. */
  compact?: boolean;
}

/**
 * Workspace/brand switcher — the top-level scope above connected channels.
 * Selecting a brand narrows every brand-aware surface (planner, analytics,
 * inbox, reports) to that brand's channels.
 */
export function BrandSwitcher({ className, compact }: Props) {
  const { activeBrands, activeBrand, setActiveBrandId } = useBrands();
  const { accounts } = useAccounts();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const countFor = useMemo(() => {
    const map = new Map<string, number>();
    accounts.forEach((a) => {
      if (!a.brandId) return;
      map.set(a.brandId, (map.get(a.brandId) ?? 0) + 1);
    });
    return map;
  }, [accounts]);

  const label = activeBrand?.name ?? "All brands";
  const accent = activeBrand?.color ?? "217 91% 60%";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Workspace — ${label}`}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 backdrop-blur h-8 pl-1.5 pr-2.5 text-xs font-medium hover:border-primary/50 transition-colors max-w-[190px]",
            className,
          )}
        >
          <span
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-semibold text-background"
            style={{ backgroundColor: `hsl(${accent})` }}
          >
            {activeBrand ? activeBrand.name.slice(0, 1).toUpperCase() : <Layers className="h-3 w-3" />}
          </span>
          {!compact && <span className="truncate">{label}</span>}
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-2">
        <p className="px-2 pb-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Workspaces
        </p>

        <button
          type="button"
          onClick={() => { setActiveBrandId(null); setOpen(false); }}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted transition-colors",
            !activeBrand && "bg-muted/70",
          )}
        >
          <span className="grid h-7 w-7 place-items-center rounded-md border border-border/60 bg-card">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block truncate font-medium">All brands</span>
            <span className="block text-[11px] text-muted-foreground">
              {accounts.length} channel{accounts.length === 1 ? "" : "s"} combined
            </span>
          </span>
          {!activeBrand && <Check className="h-4 w-4 text-primary" />}
        </button>

        <div className="my-1.5 h-px bg-border/60" />

        <ul className="max-h-64 space-y-0.5 overflow-y-auto">
          {activeBrands.map((b) => {
            const selected = activeBrand?.id === b.id;
            const n = countFor.get(b.id) ?? 0;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => { setActiveBrandId(b.id); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted transition-colors",
                    selected && "bg-muted/70",
                  )}
                >
                  <span
                    className="grid h-7 w-7 place-items-center rounded-md text-[11px] font-semibold text-background"
                    style={{ backgroundColor: `hsl(${b.color})` }}
                  >
                    {b.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-medium">{b.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {n} channel{n === 1 ? "" : "s"} · {b.timezone}
                    </span>
                  </span>
                  {selected && <Check className="h-4 w-4 text-primary" />}
                </button>
              </li>
            );
          })}
          {activeBrands.length === 0 && (
            <li className="px-2 py-3 text-xs text-muted-foreground">
              No brands yet — create one to group channels per client.
            </li>
          )}
        </ul>

        <div className="mt-1.5 flex items-center gap-1.5 border-t border-border/60 pt-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start h-8 text-xs"
            onClick={() => { setOpen(false); navigate("/dashboard/settings/brands"); }}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New brand
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Manage brands"
            onClick={() => { setOpen(false); navigate("/dashboard/settings/brands"); }}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { Building2 as BrandIcon };
