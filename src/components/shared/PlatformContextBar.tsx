import { Repeat, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConnectedAccount } from "@/contexts/AccountContext";
import { getPlatformById } from "@/config/platforms";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { usePresets } from "@/hooks/usePresets";
import { useActivePreset } from "@/hooks/useActivePreset";

interface PlatformContextBarProps {
  toolLabel: string;
  accounts: ConnectedAccount[];
  onChange: () => void;
  toolKey?: string;
}

export function PlatformContextBar({
  toolLabel,
  accounts,
  onChange,
  toolKey,
}: PlatformContextBarProps) {
  const primaryPlatform = accounts[0]?.platformId;
  const { rows: presets } = usePresets(toolKey, primaryPlatform);
  const { preset: activePreset, setActivePreset } = useActivePreset(toolKey, primaryPlatform);

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
      <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
        {toolLabel} · Working on:
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {accounts.map((a) => {
          const p = getPlatformById(a.platformId);
          return (
            <Badge
              key={a.id}
              variant="secondary"
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1"
            >
              <PlatformIcon platform={a.platformId} size="xs" />
              <span className="text-xs font-medium">{p?.name ?? a.platformId}</span>
              <span className="text-xs text-muted-foreground">@{a.username}</span>
            </Badge>
          );
        })}
      </div>

      {toolKey && presets.length > 0 && (
        <div className="flex items-center gap-1.5">
          <Star className="h-3 w-3 text-muted-foreground" />
          <Select value={activePreset?.id} onValueChange={setActivePreset}>
            <SelectTrigger className="h-7 w-[180px] text-xs" aria-label="Active preset">
              <SelectValue placeholder="Preset" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}{p.isDefault ? " · default" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1">
        <Button asChild size="sm" variant="ghost" className="h-7">
          <Link to="/dashboard/history">
            <Clock className="mr-1 h-3 w-3" /> Activity
          </Link>
        </Button>
        <Button size="sm" variant="ghost" className="h-7" onClick={onChange}>
          <Repeat className="mr-1 h-3 w-3" /> Change
        </Button>
      </div>
    </div>
  );
}
