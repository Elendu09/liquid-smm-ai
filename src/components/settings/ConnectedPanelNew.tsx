import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreVertical,
  Check,
  RefreshCw,
  BarChart3,
  Unplug,
  LayoutGrid,
  Rows3,
  Sparkles,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAccounts, type ConnectedAccount } from "@/contexts/AccountContext";
import { platforms } from "@/config/platforms";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { ConnectAccountDialog } from "@/components/accounts/ConnectAccountDialog";
import { OAuthReadinessPanel } from "@/components/settings/OAuthReadinessPanel";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type StatusFilter = "all" | "active" | "warning" | "error";

const STATUS_CHIPS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "warning", label: "Warning" },
  { key: "error", label: "Error" },
];

const PLAN_CAP = 5;

function timeAgo(date?: Date) {
  if (!date) return "never";
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StatusDot({ status }: { status: ConnectedAccount["status"] }) {
  const map = {
    active: "bg-emerald-500 shadow-[0_0_0_3px_hsl(var(--background))]",
    warning: "bg-amber-500 shadow-[0_0_0_3px_hsl(var(--background))]",
    error: "bg-destructive shadow-[0_0_0_3px_hsl(var(--background))]",
    disconnected: "bg-muted-foreground/50 shadow-[0_0_0_3px_hsl(var(--background))]",
  } as const;
  return <span className={cn("inline-block w-2 h-2 rounded-full", map[status])} />;
}

function AccountKebab({
  account,
  onDisconnect,
  onSetActive,
  isActive,
}: {
  account: ConnectedAccount;
  onDisconnect: () => void;
  onSetActive: () => void;
  isActive: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onSetActive} disabled={isActive}>
          <Check className="w-3.5 h-3.5 mr-2" /> {isActive ? "Active workspace" : "Set as active"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.success(`${account.username} synced`)}>
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh sync
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/analytics">
            <BarChart3 className="w-3.5 h-3.5 mr-2" /> View analytics
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.success("Reconnect flow started")}>
          <Unplug className="w-3.5 h-3.5 mr-2" /> Reconnect
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDisconnect}>
          <Unplug className="w-3.5 h-3.5 mr-2" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountCard({
  account,
  compact,
  isActive,
  onSetActive,
  onRequestDisconnect,
}: {
  account: ConnectedAccount;
  compact?: boolean;
  isActive: boolean;
  onSetActive: () => void;
  onRequestDisconnect: () => void;
}) {
  const platform = platforms.find((p) => p.id === account.platformId);
  const healthTone =
    account.healthScore >= 80 ? "bg-emerald-500" : account.healthScore >= 60 ? "bg-amber-500" : "bg-destructive";

  if (compact) {
    return (
      <div
        className={cn(
          "group flex items-center gap-3 p-3 rounded-xl border bg-card/60 hover:bg-card hover:shadow-sm transition-all",
          isActive && "ring-1 ring-primary/40 border-primary/30",
        )}
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", account.status === "error" ? "bg-destructive/10" : "bg-primary/10")}>
          <PlatformIcon platform={account.platformId} size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{platform?.name ?? account.platformId}</p>
            <StatusDot status={account.status} />
          </div>
          <p className="text-xs text-muted-foreground truncate">
            @{account.username} · {formatNum(account.followers)} followers · synced {timeAgo(account.lastSync)}
          </p>
        </div>
        <AccountKebab
          account={account}
          isActive={isActive}
          onSetActive={onSetActive}
          onDisconnect={onRequestDisconnect}
        />
      </div>
    );
  }

  const profileType = `${platform?.name ?? account.platformId} ${
    account.platformId === "facebook" || account.platformId === "linkedin" ? "Page" : "Profile"
  }`;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden bg-card/60 border-border/60 transition-all hover:border-primary/30 hover:shadow-md",
        isActive && "ring-1 ring-primary/40 border-primary/30",
      )}
    >
      <CardContent className="relative p-4 pb-0">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-border/60">
              <span className="text-sm font-semibold uppercase text-muted-foreground">
                {account.username.slice(0, 2)}
              </span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-background ring-1 ring-border/60">
              <PlatformIcon platform={account.platformId} size="xs" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-sm font-semibold">{account.displayName || account.username}</p>
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-full px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide",
                  account.status === "active"
                    ? "bg-emerald-500/15 text-emerald-600"
                    : account.status === "warning"
                      ? "bg-amber-500/15 text-amber-600"
                      : "bg-destructive/15 text-destructive",
                )}
              >
                {account.status}
              </Badge>
            </div>
            <button
              type="button"
              onClick={onSetActive}
              className="mt-0.5 block max-w-full truncate text-xs font-medium text-primary hover:underline"
            >
              @{account.username}
            </button>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{profileType}</p>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Add to group"
              onClick={() => toast.success(`${account.username} pinned`)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <AccountKebab
              account={account}
              isActive={isActive}
              onSetActive={onSetActive}
              onDisconnect={onRequestDisconnect}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{formatNum(account.followers)} followers</span>
          <span>synced {timeAgo(account.lastSync)}</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-all", healthTone)} style={{ width: `${account.healthScore}%` }} />
        </div>
      </CardContent>

      <div className="mt-3 flex items-center gap-1 border-t border-border/60 px-2 py-1.5">
        <Button asChild variant="ghost" size="sm" className="h-7 rounded-full px-2.5 text-[11px]">
          <Link to="/dashboard/analytics">Open</Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 rounded-full px-2.5 text-[11px]"
          onClick={() => toast.success("Reconnect flow started")}
        >
          Reconnect
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-7 w-7 rounded-full text-muted-foreground"
          aria-label="More views"
          onClick={onSetActive}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}

export function ConnectedPanel() {
  const { accounts, activeAccount, setActiveAccount, removeAccount } = useAccounts();
  const [connectOpen, setConnectOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [pendingRemove, setPendingRemove] = useState<ConnectedAccount | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [sort, setSort] = useState<"name" | "followers" | "recent">("name");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = accounts.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      const p = platforms.find((pp) => pp.id === a.platformId);
      return (
        a.username.toLowerCase().includes(q) ||
        a.displayName.toLowerCase().includes(q) ||
        p?.name.toLowerCase().includes(q)
      );
    });
    return [...list].sort((a, b) => {
      if (sort === "followers") return b.followers - a.followers;
      if (sort === "recent")
        return new Date(b.lastSync ?? 0).getTime() - new Date(a.lastSync ?? 0).getTime();
      return (a.displayName || a.username).localeCompare(b.displayName || b.username);
    });
  }, [accounts, query, statusFilter, sort]);

  const grouped = useMemo(() => {
    const map = new Map<string, ConnectedAccount[]>();
    for (const a of filtered) {
      const arr = map.get(a.platformId) ?? [];
      arr.push(a);
      map.set(a.platformId, arr);
    }
    return Array.from(map.entries()).map(([platformId, items]) => ({
      platformId,
      platform: platforms.find((p) => p.id === platformId),
      items,
    }));
  }, [filtered]);

  const showGroups = filtered.length > 6;
  const usedPct = Math.min(100, (accounts.length / PLAN_CAP) * 100);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Channels</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage every social account connected to your workspace.
          </p>
        </div>
        <Button onClick={() => setConnectOpen(true)} className="rounded-full">
          <Plus className="w-4 h-4 mr-1.5" /> Connect Channel
        </Button>
      </div>
      {/* OAuth provider readiness */}
      <OAuthReadinessPanel />

      {/* Plan callout */}
      <Card className="border-border/60 bg-gradient-to-r from-primary/[0.06] via-card/60 to-card/60">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Get to know your plan</p>
            <p className="text-xs text-muted-foreground">
              You've connected <span className="font-medium text-foreground">{accounts.length}</span> of {PLAN_CAP} channels on the Free plan.
            </p>
            <Progress value={usedPct} className="h-1.5 mt-2" />
          </div>
          <Button asChild size="sm" variant="outline" className="sm:ml-auto">
            <Link to="/dashboard/settings/billing">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Upgrade
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Empty state */}
      {accounts.length === 0 ? (
        <Card className="border-dashed border-border/70 bg-card/40">
          <CardContent className="py-16 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-semibold">Connect a channel to get started</p>
              <p className="text-xs text-muted-foreground mt-1">Once connected, you'll see your channels listed here.</p>
            </div>
            <Button onClick={() => setConnectOpen(true)} className="mt-2">
              <Plus className="w-4 h-4 mr-1.5" /> Connect Channel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filter bar */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search channels…"
                  className="pl-9 h-9 bg-card/60 border-border/60"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full"
                  onClick={() => toast.success(`Checked ${accounts.length} channels`)}
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Check all
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("h-9 rounded-full", showFilters && "border-primary/40 text-primary")}
                  onClick={() => setShowFilters((v) => !v)}
                >
                  Filters
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="h-9 rounded-full">Sort</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSort("name")}>By name</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSort("followers")}>By followers</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSort("recent")}>By last sync</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 rounded-full">Actions</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setConnectOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-2" /> Connect channel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.success("Syncing all channels…")}>
                      <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh all
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/analytics">
                        <BarChart3 className="w-3.5 h-3.5 mr-2" /> View analytics
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {showFilters && (
            <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-muted/40 rounded-full p-1">
              {STATUS_CHIPS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setStatusFilter(c.key)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full transition-colors",
                    statusFilter === c.key
                      ? "bg-background shadow-sm text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="hidden sm:flex items-center gap-1 rounded-full border border-border/60 p-0.5 ml-auto">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 rounded-full", view === "grid" && "bg-muted")}
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 rounded-full", view === "list" && "bg-muted")}
                onClick={() => setView("list")}
              >
                <Rows3 className="w-3.5 h-3.5" />
              </Button>
            </div>
            </div>
            )}
          </div>

          {/* Content */}
          {filtered.length === 0 ? (
            <div className="text-center py-14 text-sm text-muted-foreground">No channels match your filters.</div>
          ) : showGroups ? (
            <div className="space-y-6">
              {grouped.map((g) => (
                <section key={g.platformId} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={g.platformId} size="xs" />
                    <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                      {g.platform?.name ?? g.platformId}
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">{g.items.length}</Badge>
                  </div>
                  <div className={cn(view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" : "space-y-2")}>
                    {g.items.map((a) => (
                      <AccountCard
                        key={a.id}
                        account={a}
                        compact={view === "list"}
                        isActive={activeAccount?.id === a.id}
                        onSetActive={() => setActiveAccount(a)}
                        onRequestDisconnect={() => setPendingRemove(a)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className={cn(view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" : "space-y-2")}>
              {filtered.map((a) => (
                <AccountCard
                  key={a.id}
                  account={a}
                  compact={view === "list"}
                  isActive={activeAccount?.id === a.id}
                  onSetActive={() => setActiveAccount(a)}
                  onRequestDisconnect={() => setPendingRemove(a)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />

      <AlertDialog open={!!pendingRemove} onOpenChange={(o) => !o && setPendingRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {pendingRemove?.username}?</AlertDialogTitle>
            <AlertDialogDescription>
              Scheduled posts and automations for this channel will pause until it's reconnected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingRemove) {
                  removeAccount(pendingRemove.id);
                  toast.success(`${pendingRemove.username} disconnected`);
                }
                setPendingRemove(null);
              }}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ConnectedPanel;
