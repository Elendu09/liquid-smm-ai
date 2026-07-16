import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Clock, StopCircle, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { nextDelayMs, recordAction, type RateLimitSettings } from "./RateLimitSettingsDialog";

export interface BulkTarget {
  id: string;
  title: string;
  /** Simulated total actions to run for this audience. */
  actions: number;
}

type RunStatus = "queued" | "running" | "done" | "failed" | "cancelled";

interface RunState {
  target: BulkTarget;
  status: RunStatus;
  success: number;
  failure: number;
  completed: number;
  error?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  targets: BulkTarget[];
  rateLimit: RateLimitSettings;
  ruleName: string;
}

export function BulkAutomationProgressDialog({ open, onOpenChange, targets, rateLimit, ruleName }: Props) {
  const [runs, setRuns] = useState<RunState[]>([]);
  const [cancelled, setCancelled] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    cancelledRef.current = false;
    setCancelled(false);
    setRuns(targets.map((t) => ({ target: t, status: "queued", success: 0, failure: 0, completed: 0 })));

    let stopped = false;
    const run = async () => {
      for (let ti = 0; ti < targets.length; ti++) {
        if (cancelledRef.current || stopped) break;
        setRuns((prev) => prev.map((r, i) => (i === ti ? { ...r, status: "running" } : r)));
        const total = targets[ti].actions;
        for (let a = 0; a < total; a++) {
          if (cancelledRef.current || stopped) break;
          const delay = Math.max(120, nextDelayMs(rateLimit) / 6); // compressed sim
          await new Promise((res) => setTimeout(res, delay));
          if (cancelledRef.current || stopped) break;
          const ok = Math.random() > 0.08;
          if (ok) recordAction();
          setRuns((prev) =>
            prev.map((r, i) =>
              i === ti
                ? { ...r, completed: r.completed + 1, success: r.success + (ok ? 1 : 0), failure: r.failure + (ok ? 0 : 1) }
                : r,
            ),
          );
        }
        setRuns((prev) =>
          prev.map((r, i) =>
            i === ti
              ? { ...r, status: cancelledRef.current ? "cancelled" : r.failure === total ? "failed" : "done" }
              : r,
          ),
        );
      }
      if (cancelledRef.current) {
        setRuns((prev) => prev.map((r) => (r.status === "queued" ? { ...r, status: "cancelled" } : r)));
      }
    };
    run();
    return () => { stopped = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const totals = runs.reduce(
    (acc, r) => ({
      success: acc.success + r.success,
      failure: acc.failure + r.failure,
      completed: acc.completed + r.completed,
      total: acc.total + r.target.actions,
    }),
    { success: 0, failure: 0, completed: 0, total: 0 },
  );
  const overallPct = totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;
  const allTerminal = runs.length > 0 && runs.every((r) => r.status === "done" || r.status === "failed" || r.status === "cancelled");

  const cancel = () => {
    cancelledRef.current = true;
    setCancelled(true);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) cancelledRef.current = true; onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" /> Bulk automation
          </DialogTitle>
          <DialogDescription>
            {ruleName} · {targets.length} audience{targets.length === 1 ? "" : "s"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border border-border/60 p-3 bg-muted/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium">Overall progress</span>
              <span className="text-xs text-muted-foreground">{totals.completed} / {totals.total}</span>
            </div>
            <Progress value={overallPct} className="h-2" />
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px] bg-brand-green/10 text-brand-green">
                <CheckCircle2 className="h-3 w-3 mr-1" /> {totals.success} success
              </Badge>
              <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive">
                <XCircle className="h-3 w-3 mr-1" /> {totals.failure} failed
              </Badge>
              {cancelled && (
                <Badge variant="secondary" className="text-[10px] bg-brand-orange/10 text-brand-orange">
                  <StopCircle className="h-3 w-3 mr-1" /> Cancelled
                </Badge>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {runs.map((r) => {
              const pct = r.target.actions ? Math.round((r.completed / r.target.actions) * 100) : 0;
              return (
                <div key={r.target.id} className="rounded-md border border-border/60 p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {r.status === "running" && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />}
                      {r.status === "queued" && <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      {r.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-brand-green shrink-0" />}
                      {r.status === "failed" && <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      {r.status === "cancelled" && <StopCircle className="h-3.5 w-3.5 text-brand-orange shrink-0" />}
                      <span className="text-xs font-medium truncate">{r.target.title}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] capitalize",
                      r.status === "done" && "text-brand-green border-brand-green/40",
                      r.status === "failed" && "text-destructive border-destructive/40",
                      r.status === "cancelled" && "text-brand-orange border-brand-orange/40",
                    )}>
                      {r.status}
                    </Badge>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{r.completed} / {r.target.actions}</span>
                    <span>
                      <span className="text-brand-green">{r.success}✓</span>
                      {" · "}
                      <span className="text-destructive">{r.failure}✗</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          {!allTerminal ? (
            <Button variant="outline" onClick={cancel} className="border-destructive text-destructive hover:bg-destructive/10">
              <StopCircle className="h-3.5 w-3.5 mr-1" /> Cancel run
            </Button>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
