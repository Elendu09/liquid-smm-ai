import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Copy,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTroubleshooter, CheckStatus } from "@/hooks/useTroubleshooter";

const STATUS_STYLE: Record<CheckStatus, { icon: any; className: string; badge: string }> = {
  pass: { icon: CheckCircle2, className: "text-emerald-500", badge: "bg-emerald-500/10 text-emerald-600" },
  warn: { icon: AlertTriangle, className: "text-amber-500", badge: "bg-amber-500/10 text-amber-600" },
  fail: { icon: XCircle, className: "text-destructive", badge: "bg-destructive/10 text-destructive" },
  pending: { icon: Loader2, className: "text-muted-foreground animate-spin", badge: "bg-muted text-muted-foreground" },
};

export function TroubleshooterPanel() {
  const { results, run, running, ranAt, report, version } = useTroubleshooter();
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyReport = async () => {
    await navigator.clipboard.writeText(report());
    toast.success("Diagnostic report copied");
  };

  const summary = {
    pass: results.filter((r) => r.status === "pass").length,
    warn: results.filter((r) => r.status === "warn").length,
    fail: results.filter((r) => r.status === "fail").length,
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 sm:p-5 flex flex-wrap items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-40">
            <div className="text-sm font-semibold">Live diagnostics</div>
            <div className="text-xs text-muted-foreground">
              {ranAt
                ? `Last run ${ranAt.toLocaleTimeString()} · ${summary.pass} pass · ${summary.warn} warn · ${summary.fail} fail`
                : "Running initial checks…"}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={copyReport} disabled={!results.length}>
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Copy report
          </Button>
          <Button size="sm" onClick={run} disabled={running}>
            {running ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            Re-run
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-2 sm:p-3">
          {results.length === 0 && running && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Inspecting your workspace…
            </div>
          )}
          <ul className="divide-y divide-border/60">
            {results.map((r) => {
              const S = STATUS_STYLE[r.status];
              const Icon = S.icon;
              const isOpen = expanded === r.id;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    className="w-full flex items-center gap-3 px-2 sm:px-3 py-3 text-left hover:bg-muted/40 rounded-lg transition-colors"
                  >
                    <Icon className={cn("w-5 h-5 shrink-0", S.className)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{r.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.detail}</div>
                    </div>
                    <span className={cn("text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded", S.badge)}>
                      {r.status}
                    </span>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        isOpen && "rotate-90",
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 -mt-1 flex flex-wrap gap-2 items-center">
                      <div className="text-xs text-muted-foreground flex-1 min-w-40">
                        {r.detail}
                      </div>
                      {r.fix && r.fixLabel && (
                        <Button size="sm" variant="secondary" onClick={r.fix}>
                          {r.fixLabel}
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center">
        App {version} · Diagnostics run entirely in your browser.
      </p>
    </div>
  );
}
