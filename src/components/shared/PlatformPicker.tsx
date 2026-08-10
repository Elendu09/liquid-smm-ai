import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Plus, Search, Settings2 } from "lucide-react";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConnectAccountDialog } from "@/components/accounts/ConnectAccountDialog";
import { platforms as ALL_PLATFORMS } from "@/config/platforms";
import { useAccounts } from "@/contexts/AccountContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlatformPickerProps {
  /** Currently selected platform IDs */
  selected: string[];
  /** Toggle a platform on/off */
  onToggle: (platformId: string) => void;
  /** Which platforms to show (defaults to all connected/common ones) */
  available?: string[];
  /** Label above the row */
  label?: string;
  /** Allow multi-select (default true). When false, acts as single-select radio */
  multi?: boolean;
  /** Show the "+" connect more button (default true) */
  showAdd?: boolean;
  /** Override the "add more" action (default: navigate to integrations) */
  onAddMore?: () => void;
  /** Extra class on the outer wrapper */
  className?: string;
  /** Size of the icons */
  size?: "sm" | "md" | "lg";
}

const DEFAULT_VISIBLE = [
  "instagram",
  "tiktok",
  "youtube",
  "twitter",
  "facebook",
  "linkedin",
  "threads",
  "pinterest",
  "bluesky",
  "reddit",
  "snapchat",
  "telegram",
  "discord",
  "whatsapp",
];

function platformLabel(id: string): string {
  const p = ALL_PLATFORMS.find((x) => x.id === id);
  return p?.name ?? id.charAt(0).toUpperCase() + id.slice(1);
}

const sizeMap = {
  sm: { icon: "sm" as const, ring: "h-9 w-9", plus: "h-9 w-9" },
  md: { icon: "md" as const, ring: "h-11 w-11", plus: "h-11 w-11" },
  lg: { icon: "lg" as const, ring: "h-13 w-13", plus: "h-13 w-13" },
};

/**
 * Simple, clean row of real platform logos with toggle selection and a "+"
 * button to connect more channels. Used across all creation dialogs.
 *
 * The "+" now opens a small Popover beside the button (like Connect Channel but smaller)
 * listing available platforms to quick-add, search, and manage connections.
 */
export function PlatformPicker({
  selected,
  onToggle,
  available,
  label,
  multi = true,
  showAdd = true,
  onAddMore,
  className,
  size = "md",
}: PlatformPickerProps) {
  const navigate = useNavigate();
  const { accounts } = useAccounts();
  // Base row = the configured defaults; any extra platform added via the "+"
  // popover (and thus in `selected`) is appended so it visibly appears.
  const ids = useMemo(() => {
    const base = available ?? DEFAULT_VISIBLE;
    const extras = selected.filter((id) => !base.includes(id));
    return extras.length ? [...base, ...extras] : base;
  }, [available, selected]);
  const s = sizeMap[size];

  const [addOpen, setAddOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleAdd = () => {
    if (onAddMore) return onAddMore();
    navigate("/dashboard/settings/integrations");
  };

  // Platforms available to quick-add: not selected, filtered by search
  const connectedIds = useMemo(() => new Set(accounts.map((a) => a.platformId)), [accounts]);

  const filteredAddable = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Show: (1) visible but unselected, + (2) hidden platforms (not in ids) that match query
    const pool = ALL_PLATFORMS.filter((p) => {
      const inVisible = ids.includes(p.id);
      // If already selected, don't show in add list (they're already active)
      if (selected.includes(p.id)) return false;
      if (q) {
        return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      }
      return true;
    });
    // Sort: visible unselected first, then hidden
    return pool.sort((a, b) => {
      const aVis = ids.includes(a.id) ? 0 : 1;
      const bVis = ids.includes(b.id) ? 0 : 1;
      if (aVis !== bVis) return aVis - bVis;
      return a.name.localeCompare(b.name);
    });
  }, [query, ids, selected]);

  const handleQuickAdd = (id: string) => {
    if (!multi) {
      selected.forEach((sid) => onToggle(sid));
      onToggle(id);
    } else {
      onToggle(id);
    }
    toast.success(`${platformLabel(id)} added`);
    setAddOpen(false);
    setQuery("");
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground block">
          {label}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {ids.map((id) => {
          const isSelected = selected.includes(id);
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    if (!multi) {
                      // Single-select: toggle only this one
                      if (isSelected) return;
                      selected.forEach((sid) => onToggle(sid));
                      onToggle(id);
                    } else {
                      onToggle(id);
                    }
                  }}
                  aria-pressed={isSelected}
                  aria-label={platformLabel(id)}
                  className={cn(
                    "relative grid place-items-center rounded-xl border-2 transition-all",
                    s.ring,
                    isSelected
                      ? "border-primary ring-2 ring-primary/25 scale-105 shadow-md shadow-primary/15"
                      : "border-transparent hover:border-border/80 hover:scale-105",
                  )}
                >
                  <PlatformIcon platform={id} size={s.icon} showBackground />
                  {isSelected && (
                    <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  )}
                  {connectedIds.has(id) && !isSelected && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" aria-hidden />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[11px] capitalize">
                {platformLabel(id)}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {showAdd && (
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Add platform"
                    aria-expanded={addOpen}
                    className={cn(
                      "grid place-items-center rounded-xl border-2 border-dashed border-border/70 text-muted-foreground transition-all hover:border-primary/50 hover:text-primary hover:bg-primary/5 hover:scale-105",
                      s.plus,
                      addOpen && "border-primary/50 bg-primary/5 text-primary",
                    )}
                  >
                    <Plus className={size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[11px]">
                Add platforms
              </TooltipContent>
            </Tooltip>

            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={8}
              className="w-[320px] p-0 overflow-hidden rounded-xl shadow-xl border-border/60"
            >
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold leading-tight">Add platforms</p>
                    <p className="text-[10px] text-muted-foreground">Pick to add to this post · {filteredAddable.length} available</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md"
                    onClick={() => {
                      setAddOpen(false);
                      if (onAddMore) onAddMore();
                      else navigate("/dashboard/settings/connected");
                    }}
                    aria-label="Manage channels"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search platforms…"
                    className="pl-8 h-8 text-xs bg-muted/40 border-border/50 rounded-lg"
                  />
                </div>

                <div className="max-h-[220px] overflow-y-auto pr-1 -mr-1">
                  {filteredAddable.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-muted-foreground">
                        {query ? "No matches" : "All platforms added"}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">Use Manage to connect more channels.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {filteredAddable.slice(0, 24).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleQuickAdd(p.id)}
                          className="group flex flex-col items-center gap-1 rounded-xl border border-border/60 p-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors text-center"
                        >
                          <PlatformIcon platform={p.id} size="sm" showBackground />
                          <span className="text-[10px] font-medium leading-tight line-clamp-1">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {filteredAddable.length > 24 && (
                    <p className="text-[10px] text-muted-foreground text-center mt-2">+{filteredAddable.length - 24} more — refine search</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={() => {
                      setAddOpen(false);
                      setConnectOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Connect channel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={() => {
                      setAddOpen(false);
                      handleAdd();
                    }}
                  >
                    Manage
                  </Button>
                </div>
                <p className="text-[9px] text-muted-foreground text-center leading-tight">
                  Tip: connected platforms show a green dot on the picker.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {selected.length} platform{selected.length === 1 ? "" : "s"} selected
          {multi && selected.length > 0 && (
            <button
              type="button"
              onClick={() => selected.forEach((sid) => onToggle(sid))}
              className="ml-2 text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </p>
      )}

      <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </div>
  );
}

export default PlatformPicker;
