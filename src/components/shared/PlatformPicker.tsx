import { useNavigate } from "react-router-dom";
import { Check, Plus } from "lucide-react";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { platforms as ALL_PLATFORMS } from "@/config/platforms";
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
  const ids = available ?? DEFAULT_VISIBLE;
  const s = sizeMap[size];

  const handleAdd = () => {
    if (onAddMore) return onAddMore();
    navigate("/dashboard/settings/integrations");
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
                      selected.forEach((s) => onToggle(s));
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
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[11px] capitalize">
                {platformLabel(id)}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {showAdd && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleAdd}
                aria-label="Connect more platforms"
                className={cn(
                  "grid place-items-center rounded-xl border-2 border-dashed border-border/70 text-muted-foreground transition-all hover:border-primary/50 hover:text-primary hover:bg-primary/5 hover:scale-105",
                  s.plus,
                )}
              >
                <Plus className={size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
              Connect more platforms
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {selected.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {selected.length} platform{selected.length === 1 ? "" : "s"} selected
          {multi && selected.length > 0 && (
            <button
              type="button"
              onClick={() => selected.forEach((s) => onToggle(s))}
              className="ml-2 text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </p>
      )}
    </div>
  );
}

export default PlatformPicker;
