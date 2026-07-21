import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert } from "lucide-react";
import { useGuest } from "@/hooks/useGuest";
import { useAuthUser } from "@/hooks/useAuthUser";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

interface Incident {
  id: string;
  when: string;
  title: string;
  detail: string;
  severity: "resolved" | "warning" | "critical";
}

const DEMO_INCIDENTS: Incident[] = [
  { id: "i1", when: "Just now", title: "Instagram Graph API — degraded", detail: "Occasional 5xx on media uploads. Retrying.", severity: "warning" },
  { id: "i2", when: "2h ago", title: "TikTok scheduler restored", detail: "Backlog cleared, 12 posts published.", severity: "resolved" },
  { id: "i3", when: "Yesterday · 21:04", title: "YouTube quota exceeded", detail: "Daily quota reached; batching resumed at 00:00 UTC.", severity: "critical" },
  { id: "i4", when: "2 days ago", title: "Facebook token refreshed", detail: "Long-lived token rotated automatically.", severity: "resolved" },
  { id: "i5", when: "3 days ago", title: "X rate limit hit", detail: "Cooldown of 15 minutes applied. Normalised.", severity: "resolved" },
];

const ICON = { resolved: CheckCircle2, warning: AlertTriangle, critical: XCircle } as const;
const TONE = {
  resolved: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  warning: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  critical: "text-rose-500 bg-rose-500/10 border-rose-500/30",
} as const;

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

export function IncidentsTimeline() {
  const { isGuest } = useGuest();
  const { user } = useAuthUser();
  const [incidents, setIncidents] = useState<Incident[] | null>(null);

  useEffect(() => {
    if (isGuest || !user) { setIncidents(null); return; }
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, severity, category, created_at")
        .eq("user_id", user.id)
        .in("category", ["health", "platform", "system"])
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20);
      if (cancelled) return;
      const mapped: Incident[] = (data ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        detail: n.body ?? "",
        when: relTime(n.created_at),
        severity: n.severity === "critical" ? "critical" : n.severity === "warning" ? "warning" : "resolved",
      }));
      setIncidents(mapped);
    })();
    return () => { cancelled = true; };
  }, [isGuest, user]);

  const list = isGuest ? DEMO_INCIDENTS : (incidents ?? []);

  return (
    <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
      <header className="mb-4">
        <h3 className="text-base font-semibold">Incidents timeline</h3>
        <p className="text-xs text-muted-foreground">Platform-side events across all connected APIs.</p>
      </header>
      {list.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No incidents in the last 30 days"
          description="Platform outages, token issues, and rate-limit events will appear here."
          compact
        />
      ) : (
        <ol className="relative border-l border-border/60 ml-3 space-y-4">
          {list.map((i) => {
            const Icon = ICON[i.severity];
            return (
              <li key={i.id} className="pl-6 relative">
                <span className={cn("absolute -left-[13px] top-0.5 h-6 w-6 rounded-full border flex items-center justify-center", TONE[i.severity])}>
                  <Icon className="h-3 w-3" />
                </span>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{i.title}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{i.when}</span>
                </div>
                <p className="text-xs text-muted-foreground">{i.detail}</p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
