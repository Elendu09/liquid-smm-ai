import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Incident {
  id: string;
  when: string;
  title: string;
  detail: string;
  severity: "resolved" | "warning" | "critical";
}

const INCIDENTS: Incident[] = [
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

export function IncidentsTimeline() {
  return (
    <section className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
      <header className="mb-4">
        <h3 className="text-base font-semibold">Incidents timeline</h3>
        <p className="text-xs text-muted-foreground">Platform-side events across all connected APIs.</p>
      </header>
      <ol className="relative border-l border-border/60 ml-3 space-y-4">
        {INCIDENTS.map((i) => {
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
    </section>
  );
}
