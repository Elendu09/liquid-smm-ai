import { useEffect, useState } from "react";
import { Clock3, ShieldCheck, Zap, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Limit {
  platform: string;
  limit: number;
  used: number;
  resetIn: string;
  status: "ok" | "warn" | "throttled";
}

const initial: Limit[] = [
  { platform: "instagram", limit: 200, used: 42, resetIn: "23m", status: "ok" },
  { platform: "tiktok", limit: 100, used: 89, resetIn: "7m", status: "warn" },
  { platform: "linkedin", limit: 150, used: 150, resetIn: "2h", status: "throttled" },
  { platform: "twitter", limit: 300, used: 120, resetIn: "41m", status: "ok" },
  { platform: "youtube", limit: 10000, used: 3400, resetIn: "1h", status: "ok" },
];

export function RateLimitDashboard() {
  const [limits, setLimits] = useState<Limit[]>(initial);
  const [live, setLive] = useState(true);

  // live sync simulation: bump used randomly, rotate reset countdown
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      setLimits((prev) => prev.map((l) => {
        // eslint-disable-next-line no-restricted-syntax -- synth-ok: live jitter
        const delta = Math.floor(Math.random() * 4) - 1; // -1..2
        const used = Math.max(0, Math.min(l.limit, l.used + delta));
        const pct = (used / l.limit) * 100;
        const status: Limit["status"] = pct >= 100 ? "throttled" : pct > 85 ? "warn" : "ok";
        return { ...l, used, status };
      }));
    }, 4000);
    return () => clearInterval(id);
  }, [live]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4 space-y-3 backdrop-blur-sm">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-600"><ShieldCheck className="h-4 w-4" /></span>
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-1.5">Rate-limit dashboard <span className={cn("h-2 w-2 rounded-full", live ? "bg-emerald-500 animate-pulse" : "bg-muted")} /></h3>
            <p className="text-xs text-muted-foreground">Per-platform call budget • auto backoff • live sync 4s</p>
          </div>
        </div>
        <button onClick={() => setLive((v) => !v)} className="text-xs px-2 py-1 rounded-full border border-border/60 bg-muted/40 hover:bg-muted">
          {live ? "Live" : "Paused"}
        </button>
      </header>

      <div className="grid gap-2 sm:grid-cols-2">
        {limits.map((l) => {
          const pct = Math.round((l.used / l.limit) * 100);
          const tone =
            l.status === "throttled" ? "border-rose-500/30 bg-rose-500/10 text-rose-600" :
            l.status === "warn" ? "border-amber-500/30 bg-amber-500/10 text-amber-600" :
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-600";
          return (
            <div key={l.platform} className={cn("rounded-xl border p-3 space-y-2", tone)}>
              <div className="flex items-center justify-between">
                <span className="capitalize text-sm font-semibold flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" />{l.platform}</span>
                <Badge variant="outline" className={cn("text-[10px] border", tone)}>{l.status === "throttled" ? "Throttled" : l.status === "warn" ? "Warn" : "OK"}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="tabular-nums">{l.used} / {l.limit}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock3 className="h-3 w-3" /> reset {l.resetIn}</span>
              </div>
              <Progress value={pct} className="h-1.5" />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {pct}% used • backoff {l.status === "throttled" ? "active" : "standby"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
