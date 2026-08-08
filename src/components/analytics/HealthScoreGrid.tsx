import { useScopedAccounts } from "@/hooks/useScopedAccounts";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { CheckCircle2, AlertTriangle, XCircle, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { useGuest } from "@/hooks/useGuest";
import { TimezoneSelector, TimezoneLabel } from "@/components/accounts/TimezoneSelector";
import { ConnectionHealthPill } from "@/components/accounts/ConnectionHealthPill";

const STATUS_META = {
  active: { label: "Healthy", tone: "text-emerald-500 bg-emerald-500/10", Icon: CheckCircle2 },
  warning: { label: "At risk", tone: "text-amber-500 bg-amber-500/10", Icon: AlertTriangle },
  error: { label: "Critical", tone: "text-rose-500 bg-rose-500/10", Icon: XCircle },
  disconnected: { label: "Offline", tone: "text-muted-foreground bg-muted", Icon: Wifi },
} as const;

export function HealthScoreGrid() {
  const { accounts } = useScopedAccounts();
  const { isGuest } = useGuest();
  if (!isGuest && accounts.length === 0) {
    return <EmptyState variant="connect-account" />;
  }
  const avg = accounts.length
    ? Math.round(accounts.reduce((s, a) => s + a.healthScore, 0) / accounts.length)
    : 0;
  const critical = accounts.filter((a) => a.status === "error").length;
  const warnings = accounts.filter((a) => a.status === "warning").length;
  const healthy = accounts.filter((a) => a.status === "active").length;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
          <p className="text-xs text-muted-foreground">Overall health</p>
          <p className="text-3xl font-bold mt-1 tabular-nums">{avg}<span className="text-lg text-muted-foreground">/100</span></p>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                avg >= 80 ? "bg-emerald-500" : avg >= 60 ? "bg-amber-500" : "bg-rose-500",
              )}
              style={{ width: `${avg}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
          <p className="text-xs text-muted-foreground">Healthy</p>
          <p className="text-3xl font-bold mt-1 tabular-nums text-emerald-500">{healthy}</p>
          <p className="text-[11px] text-muted-foreground mt-1">accounts operating normally</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
          <p className="text-xs text-muted-foreground">At risk</p>
          <p className="text-3xl font-bold mt-1 tabular-nums text-amber-500">{warnings}</p>
          <p className="text-[11px] text-muted-foreground mt-1">need attention soon</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
          <p className="text-xs text-muted-foreground">Critical</p>
          <p className="text-3xl font-bold mt-1 tabular-nums text-rose-500">{critical}</p>
          <p className="text-[11px] text-muted-foreground mt-1">action required now</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
        <header className="p-4 border-b border-border/50">
          <h3 className="text-base font-semibold">Per-account health</h3>
          <p className="text-xs text-muted-foreground">Sync status, API quota, and post reliability.</p>
        </header>
        <div className="divide-y divide-border/50">
          {accounts.map((a) => {
            const meta = STATUS_META[a.status] ?? STATUS_META.disconnected;
            const StatusIcon = meta.Icon;
            const lastSync = a.lastSync ? Math.floor((Date.now() - +a.lastSync) / 60_000) : null;
            return (
              <div key={a.id} className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 px-4 py-3 hover:bg-muted/30">
                <PlatformIcon platform={a.platformId} size="md" showBackground />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">@{a.username}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {a.platformId} · {lastSync != null ? `synced ${lastSync < 1 ? "just now" : lastSync + "m ago"}` : "never synced"}
                    </span>
                    <ConnectionHealthPill account={a} compact />
                    <TimezoneLabel accountId={a.id} />
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 shrink-0">
                  <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        a.healthScore >= 80 ? "bg-emerald-500" : a.healthScore >= 60 ? "bg-amber-500" : "bg-rose-500",
                      )}
                      style={{ width: `${a.healthScore}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums w-8 text-right">{a.healthScore}</span>
                </div>
                <div className="hidden md:block text-right text-xs shrink-0 w-20">
                  <p className="tabular-nums font-semibold">{a.engagement.toFixed(1)}%</p>
                  <p className="text-[10px] text-muted-foreground">ER</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full", meta.tone)}>
                    <StatusIcon className="h-3 w-3" />
                    {meta.label}
                  </span>
                  <TimezoneSelector accountId={a.id} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
