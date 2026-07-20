import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Settings2, Plus, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccounts } from "@/contexts/AccountContext";
import { platforms } from "@/config/platforms";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { ConnectAccountDialog } from "@/components/accounts/ConnectAccountDialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function ConnectChannelsSection({ collapsed, onNavigate }: Props) {
  const { accounts, setActiveAccount, activeAccount } = useAccounts();
  const [connectOpen, setConnectOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const unique = useMemo(() => {
    const seen = new Set<string>();
    return accounts.filter((a) => {
      if (seen.has(a.platformId)) return false;
      seen.add(a.platformId);
      return true;
    });
  }, [accounts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return unique;
    return unique.filter((a) => {
      const p = platforms.find((pp) => pp.id === a.platformId);
      return (
        a.username.toLowerCase().includes(q) ||
        a.displayName.toLowerCase().includes(q) ||
        p?.name.toLowerCase().includes(q)
      );
    });
  }, [unique, query]);

  if (collapsed) {
    return (
      <>
        <div className="mt-3 pt-3 border-t border-border/50 flex flex-col items-center gap-1.5">
          {unique.slice(0, 4).map((a) => (
            <Tooltip key={a.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveAccount(a)}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    activeAccount?.id === a.id
                      ? "bg-primary/15 ring-1 ring-primary/40"
                      : "hover:bg-muted/60",
                  )}
                >
                  <PlatformIcon platform={a.platformId} size="sm" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                @{a.username}
              </TooltipContent>
            </Tooltip>
          ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg border border-dashed border-border/70"
                onClick={() => setConnectOpen(true)}
                aria-label="Connect channel"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Connect channel
            </TooltipContent>
          </Tooltip>
        </div>
        <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
      </>
    );
  }

  return (
    <>
      <div className="mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between px-2 pb-1.5">
          <span className="text-[9.5px] font-bold tracking-[0.18em] text-muted-foreground/70 uppercase">
            Connect channels
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search channels"
            >
              <Search className="w-3 h-3" />
            </Button>
            <Link to="/dashboard/settings/connected" onClick={onNavigate}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
                aria-label="Manage channels"
              >
                <Settings2 className="w-3 h-3" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setConnectOpen(true)}
              aria-label="Add channel"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {searchOpen && (
          <div className="px-2 pb-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-7 text-xs bg-muted/40 border-border/50 rounded-md"
            />
          </div>
        )}

        <div className="space-y-0.5">
          {filtered.map((a) => {
            const platform = platforms.find((p) => p.id === a.platformId);
            const isActive = activeAccount?.id === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setActiveAccount(a);
                  onNavigate?.();
                }}
                className={cn(
                  "group w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[12px] font-medium min-h-[32px] transition-colors",
                  isActive
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <PlatformIcon platform={a.platformId} size="sm" />
                <span className="flex-1 text-left truncate">
                  {platform?.name ?? a.platformId}
                </span>
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                    a.status === "active"
                      ? "bg-emerald-500"
                      : a.status === "warning"
                        ? "bg-amber-500"
                        : "bg-destructive/70",
                  )}
                  aria-hidden
                />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-2 py-3 text-center text-[11px] text-muted-foreground/70">
              {query ? `No matches` : "No channels yet"}
            </div>
          )}

          <button
            type="button"
            onClick={() => setConnectOpen(true)}
            className="mt-1 w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] font-medium text-muted-foreground border border-dashed border-border/60 hover:border-primary/40 hover:text-foreground hover:bg-primary/5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>More channels</span>
          </button>
        </div>
      </div>

      <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </>
  );
}

export default ConnectChannelsSection;
