import { Link } from "react-router-dom";
import { Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useActivePreset } from "@/hooks/useActivePreset";

interface PresetChipProps {
  toolKey: string;
  platform?: string;
  className?: string;
}

/**
 * Small indicator showing which preset is currently applied to a tool.
 * Links to /dashboard/presets for editing.
 */
export function PresetChip({ toolKey, platform, className }: PresetChipProps) {
  const { preset, tone } = useActivePreset(toolKey, platform);
  if (!preset) return null;
  return (
    <Link
      to="/dashboard/presets"
      className={className}
      aria-label={`Active preset: ${preset.name}. Click to manage presets.`}
    >
      <Badge
        variant="outline"
        className="gap-1.5 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
      >
        <Palette className="h-3 w-3" />
        <span className="text-[11px] font-semibold">Preset:</span>
        <span className="text-[11px]">{preset.name}</span>
        <span className="text-[10px] text-muted-foreground">· {tone}</span>
      </Badge>
    </Link>
  );
}
