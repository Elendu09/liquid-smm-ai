import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface Rule { id: string; name: string; trigger: string; action: string; }

interface Sample {
  user: string;
  content: string;
  matched: boolean;
  reason: string;
}

function buildSamples(rule: Rule): Sample[] {
  const kwMatch = rule.trigger.match(/"(.+)"/);
  const kw = kwMatch?.[1]?.toLowerCase() ?? "";
  const pool = [
    { user: "@sarah_c", content: "Loving this! What's the price for the pro plan?" },
    { user: "@dev_mike", content: "Just followed — big fan of your work." },
    { user: "@nomad_life", content: "Can you share the link please?" },
    { user: "@founder_kate", content: "This looks great, is there a demo?" },
    { user: "@random_bot", content: "🔥🔥🔥" },
  ];
  return pool.map((p) => {
    const lc = p.content.toLowerCase();
    let matched = false;
    let reason = "no match";
    if (rule.trigger.toLowerCase().includes("new follower")) {
      matched = /follow/i.test(p.content);
      reason = matched ? "new follower event" : "not a follow event";
    } else if (kw) {
      matched = lc.includes(kw);
      reason = matched ? `contains "${kw}"` : `missing "${kw}"`;
    } else if (rule.trigger.toLowerCase().includes("mention")) {
      matched = /@/.test(p.content);
      reason = matched ? "mention detected" : "no mention";
    } else {
      matched = Math.random() > 0.4; // synth-ok: rule-test simulator
      reason = matched ? "generic trigger match" : "trigger conditions not met";
    }
    return { ...p, matched, reason };
  });
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rule: Rule | null;
}

export function TestRuleDialog({ open, onOpenChange, rule }: Props) {
  const [running, setRunning] = useState(false);
  const [samples, setSamples] = useState<Sample[] | null>(null);

  const run = () => {
    if (!rule) return;
    setRunning(true);
    setSamples(null);
    setTimeout(() => {
      setSamples(buildSamples(rule));
      setRunning(false);
    }, 700);
  };

  const matched = samples?.filter((s) => s.matched).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Test rule (dry-run)</DialogTitle>
          <DialogDescription>
            Simulates the rule against a small sample of recent activity. No messages are sent.
          </DialogDescription>
        </DialogHeader>
        {rule && (
          <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
            <div className="font-medium">{rule.name}</div>
            <div className="text-muted-foreground text-xs mt-1">
              <span className="font-medium text-foreground/80">When</span> {rule.trigger} ·{" "}
              <span className="font-medium text-foreground/80">then</span> {rule.action}
            </div>
          </div>
        )}
        <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
          {!samples && !running && (
            <div className="text-center text-sm text-muted-foreground py-6">
              Click <span className="font-medium text-foreground">Run test</span> to simulate.
            </div>
          )}
          {running && (
            <div className="flex items-center gap-2 justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Evaluating rule…
            </div>
          )}
          {samples?.map((s, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card">
              {s.matched ? (
                <CheckCircle2 className="h-4 w-4 text-brand-green mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">{s.user}</div>
                <div className="text-sm truncate">{s.content}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{s.reason}</div>
              </div>
            </div>
          ))}
        </div>
        {samples && (
          <div className="flex items-center gap-2 text-xs pt-1">
            <Badge variant="secondary">{matched} / {samples.length} matched</Badge>
            <span className="text-muted-foreground">Estimated fire rate: {Math.round((matched / samples.length) * 100)}%</span>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={run} disabled={running}>
            <PlayCircle className="h-4 w-4 mr-1" /> {samples ? "Re-run" : "Run test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
