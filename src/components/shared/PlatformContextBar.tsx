import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConnectedAccount } from "@/contexts/AccountContext";
import { getPlatformById } from "@/config/platforms";
import { PlatformIcon } from "@/components/shared/PlatformIcon";

interface PlatformContextBarProps {
  toolLabel: string;
  accounts: ConnectedAccount[];
  onChange: () => void;
}

export function PlatformContextBar({ toolLabel, accounts, onChange }: PlatformContextBarProps) {
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
      <Button size="sm" variant="ghost" className="ml-auto h-7" onClick={onChange}>
        <Repeat className="mr-1 h-3 w-3" />
        Change
      </Button>
    </div>
  );
}
