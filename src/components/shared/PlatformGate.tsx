import { ReactNode, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAccounts, ConnectedAccount } from "@/contexts/AccountContext";
import { platforms, Platform, getPlatformById } from "@/config/platforms";
import { toolPlatformRequirements, isPlatformCompatible } from "@/config/toolPlatformMap";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { PlatformContextBar } from "@/components/shared/PlatformContextBar";
import { ConnectAccountDialog } from "@/components/accounts/ConnectAccountDialog";

export interface SelectedContext {
  platforms: Platform[];
  accounts: ConnectedAccount[];
}

interface PlatformGateProps {
  toolKey: keyof typeof toolPlatformRequirements | string;
  children: (ctx: SelectedContext) => ReactNode;
}

const STORAGE_PREFIX = "smmpilot:gate:";

export function PlatformGate({ toolKey, children }: PlatformGateProps) {
  const req = toolPlatformRequirements[toolKey];
  const { accounts } = useAccounts();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  // Rehydrate selection
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_PREFIX + toolKey);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed) && parsed.length) {
          setSelectedIds(parsed);
          setConfirmed(true);
        }
      }
    } catch {
      // ignore
    }
  }, [toolKey]);

  const compatibleAccounts = useMemo(() => {
    if (!req) return accounts;
    return accounts.filter((a) => {
      const p = getPlatformById(a.platformId);
      return p ? isPlatformCompatible(p, req) : false;
    });
  }, [accounts, req]);

  const incompatiblePlatforms = useMemo(() => {
    if (!req) return [];
    return platforms.filter((p) => !isPlatformCompatible(p, req));
  }, [req]);

  const persist = (ids: string[]) => {
    try {
      sessionStorage.setItem(STORAGE_PREFIX + toolKey, JSON.stringify(ids));
    } catch {
      // ignore
    }
  };

  const toggle = (accountId: string) => {
    setSelectedIds((prev) => {
      if (!req?.multi) return [accountId];
      return prev.includes(accountId) ? prev.filter((i) => i !== accountId) : [...prev, accountId];
    });
  };

  const confirm = () => {
    if (!selectedIds.length) return;
    persist(selectedIds);
    setConfirmed(true);
  };

  const change = () => {
    setConfirmed(false);
  };

  if (!req) {
    // Unknown tool key → render without gating.
    return <>{children({ platforms: [], accounts: [] })}</>;
  }

  if (confirmed && selectedIds.length) {
    const selectedAccounts = accounts.filter((a) => selectedIds.includes(a.id));
    const selectedPlatforms = selectedAccounts
      .map((a) => getPlatformById(a.platformId))
      .filter((p): p is Platform => Boolean(p));

    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <PlatformContextBar
          toolLabel={req.label}
          accounts={selectedAccounts}
          onChange={change}
          toolKey={String(toolKey)}
        />
        {children({ platforms: selectedPlatforms, accounts: selectedAccounts })}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto glass-card p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Choose platform for {req.label}
          </h1>
          <p className="text-muted-foreground">
            {req.multi
              ? "Select one or more connected accounts to use this tool."
              : "Select the connected account you want to use with this tool."}
          </p>
        </div>

        {compatibleAccounts.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border bg-secondary/30 text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-brand-orange mx-auto" />
            <div>
              <p className="font-semibold">No compatible account connected</p>
              <p className="text-sm text-muted-foreground mt-1">
                {req.label} needs an account that supports this feature.
              </p>
            </div>
            <Button onClick={() => setConnectOpen(true)}>
              <Plug className="mr-2 h-4 w-4" />
              Connect an account
            </Button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {compatibleAccounts.map((account) => {
                const platform = getPlatformById(account.platformId);
                const selected = selectedIds.includes(account.id);
                return (
                  <button
                    key={account.id}
                    onClick={() => toggle(account.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      selected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border bg-secondary/30 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {req.multi && (
                        <Checkbox checked={selected} onCheckedChange={() => toggle(account.id)} />
                      )}
                      <PlatformIcon platform={account.platformId} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {platform?.name ?? account.platformId}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{account.username}
                        </p>
                      </div>
                      {selected && !req.multi && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={confirm}
              disabled={!selectedIds.length}
              className="w-full"
              size="lg"
            >
              Continue with {selectedIds.length || "…"}{" "}
              {selectedIds.length === 1 ? "account" : "accounts"}
            </Button>
          </>
        )}

        {incompatiblePlatforms.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Not supported on this tool:
            </p>
            <div className="flex flex-wrap gap-2">
              {incompatiblePlatforms.map((p) => (
                <Badge key={p.id} variant="secondary" className="text-xs opacity-60">
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </div>
  );
}

export default PlatformGate;
