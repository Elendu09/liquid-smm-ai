import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Zap, TrendingDown, TrendingUp, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccounts } from "@/contexts/AccountContext";
import { useGuest } from "@/hooks/useGuest";
import { useAuthUser } from "@/hooks/useAuthUser";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/shared/EmptyState";

type Severity = "info" | "warning" | "critical" | "success";

interface Anomaly {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  when: string;
  metric?: string;
  delta?: number;
}

const ICONS: Record<Severity, React.ComponentType<{ className?: string }>> = {
  info: Zap,
  warning: TrendingDown,
  critical: ShieldAlert,
  success: TrendingUp,
};

const TONE: Record<Severity, string> = {
  info: "text-primary bg-primary/10 border-primary/20",
  warning: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  critical: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  success: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function AnomalyFeed() {
  const { accounts } = useAccounts();
  const { isGuest } = useGuest();
  const { user } = useAuthUser();
  const [remote, setRemote] = useState<Anomaly[] | null>(null);

  useEffect(() => {
    if (isGuest || !user) { setRemote(null); return; }
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, severity, type, created_at, metric")
        .eq("user_id", user.id)
        .in("type", ["engagement", "viral", "health", "milestone", "system"])
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(8);
      if (cancelled) return;
      const mapped: Anomaly[] = (data ?? []).map((n) => {
        const sev: Severity =
          n.severity === "critical" ? "critical" :
          n.severity === "warning" ? "warning" :
          n.type === "viral" ? "success" : "info";
        const metricObj = (n.metric ?? {}) as Record<string, unknown>;
        const delta = typeof metricObj.delta === "number" ? metricObj.delta : undefined;
        return {
          id: n.id,
          severity: sev,
          title: n.title,
          detail: n.message ?? "",
          when: relTime(n.created_at),
          metric: typeof metricObj.metric === "string" ? metricObj.metric : undefined,
          delta,
        };
      });
      setRemote(mapped);
    })();
    return () => { cancelled = true; };
  }, [isGuest, user]);

  const anomalies = useMemo<Anomaly[]>(() => {
    if (!isGuest) return remote ?? [];
    // Guest / demo synth only.
    const out: Anomaly[] = [];
    accounts.forEach((a, i) => {
      if (a.status === "error") {
        out.push({
          id: `an-${a.id}-1`,
          severity: "critical",
          title: `${a.platformId} · @${a.username} disconnected`,
          detail: "Reauthorise to resume scheduled posts.",
          when: "2h ago",
        });
      }
      if (a.engagement < 3) {
        out.push({
          id: `an-${a.id}-2`,
          severity: "warning",
          title: `Engagement below baseline`,
          detail: `@${a.username} ER dropped to ${a.engagement}% (7d avg 5.4%).`,
          when: `${(i + 1) * 4}h ago`,
          metric: "ER",
          delta: -32,
        });
      }
      if (a.engagement > 7) {
        out.push({
          id: `an-${a.id}-3`,
          severity: "success",
          title: `${a.platformId} post surging`,
          detail: `@${a.username} is 2.4× your rolling 30d median.`,
          when: `${(i + 1) * 3}h ago`,
          metric: "Reach",
          delta: 140,
        });
      }
    });
    out.push({
      id: "an-plat-1",
      severity: "info",
      title: "Meta Graph API latency elevated",
      detail: "Some Instagram inserts may retry — no action required.",
      when: "18m ago",
    });
    return out.slice(0, 8);
  }, [isGuest, remote, accounts]);

  return (
    <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="text-base font-semibold">Anomalies & alerts</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">last 24h</span>
      </header>
      {anomalies.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={ShieldAlert}
            title="No anomalies detected"
            description="Viral spikes, engagement dips, and platform incidents from the last 24 hours will show up here."
            compact
          />
        </div>
      ) : (
        <ul className="divide-y divide-border/50">
          {anomalies.map((a) => {
            const Icon = ICONS[a.severity];
            return (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                <span className={cn("mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border shrink-0", TONE[a.severity])}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{a.detail}</p>
                </div>
                <div className="text-right shrink-0">
                  {a.delta != null && (
                    <span className={cn("text-xs font-semibold tabular-nums", a.delta >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {a.delta >= 0 ? "+" : ""}{a.delta}%
                    </span>
                  )}
                  <p className="text-[10px] text-muted-foreground">{a.when}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
