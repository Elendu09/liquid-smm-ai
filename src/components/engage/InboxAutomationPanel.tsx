import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Filter, Plus, Trash2, Pencil, Play, Sparkles, UserCheck, MoveRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { INTENT_LABEL } from "@/hooks/useInboxAnalysis";
import { useInboxMessages } from "@/hooks/useInboxMessages";
import {
  useInboxAutomation,
  runInboxAutomation,
  type InboxRule,
} from "@/hooks/useInboxAutomation";
import { InboxRuleDialog } from "@/components/engage/InboxRuleDialog";
import { getPlatformById } from "@/config/platforms";

function summarise(rule: InboxRule): string {
  const m = rule.match;
  const when: string[] = [];
  if (m.kinds.length) when.push(m.kinds.map((k) => (k === "dm" ? "DMs" : "comments")).join(" / "));
  if (m.platforms.length) when.push(m.platforms.map((p) => getPlatformById(p)?.name ?? p).join(", "));
  if (m.sentiments.length) when.push(m.sentiments.join(" or "));
  if (m.intents.length) when.push(m.intents.map((i) => INTENT_LABEL[i]).join(" or "));
  if (m.keywords.length) when.push(`mentions "${m.keywords.slice(0, 3).join('", "')}"`);
  return when.length ? when.join(" · ") : "any inbound message";
}

export function InboxAutomationPanel() {
  const { rules, add, update, remove, bumpRuns } = useInboxAutomation();
  const comments = useInboxMessages("comment");
  const dms = useInboxMessages("dm");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InboxRule | null>(null);
  const [running, setRunning] = useState(false);

  const allItems = useMemo(() => [...comments.items, ...dms.items], [comments.items, dms.items]);
  const pending = allItems.filter((i) => i.status === "new" && !i.autoRuleId).length;

  const run = async () => {
    if (!rules.some((r) => r.enabled)) { toast.error("Enable at least one rule first"); return; }
    setRunning(true);
    try {
      const outcomes = await runInboxAutomation(allItems, rules);
      if (!outcomes.length) {
        toast("No new messages matched your rules");
        return;
      }
      const counts = new Map<string, number>();
      for (const o of outcomes) {
        const bucket = comments.items.some((i) => i.id === o.itemId) ? comments : dms;
        bucket.update(o.itemId, o.patch);
        counts.set(o.ruleId, (counts.get(o.ruleId) ?? 0) + 1);
      }
      counts.forEach((n, id) => bumpRuns(id, n));
      toast.success(`Routed ${outcomes.length} message${outcomes.length === 1 ? "" : "s"}`, {
        description: outcomes.slice(0, 3).map((o) => `${o.ruleName}: ${o.note}`).join(" · "),
      });
    } finally {
      setRunning(false);
    }
  };

  const submit = (rule: InboxRule) => {
    if (rules.some((r) => r.id === rule.id)) {
      update(rule.id, rule);
      toast.success("Rule updated");
    } else {
      add(rule);
      toast.success("Rule created");
    }
    setEditing(null);
  };

  return (
    <section className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" /> Inbox routing
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sort inbound comments and DMs by sentiment and intent, auto-assign teammates, and queue AI drafts for approval.
            {pending > 0 && <> <span className="text-foreground font-medium">{pending} unrouted</span> right now.</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={run} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
            Run routing
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> New inbox rule
          </Button>
        </div>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          variant="create-first"
          title="No inbox rules yet"
          description="Create a rule to route angry customers to support, send leads to sales, and auto-draft replies to common questions."
          ctaLabel="New inbox rule"
          onCta={() => { setEditing(null); setOpen(true); }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {rules.map((r) => (
            <div key={r.id} className="rounded-xl border border-border/60 bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold truncate">{r.name}</h3>
                <Switch
                  checked={r.enabled}
                  onCheckedChange={(v) => { update(r.id, { enabled: v }); toast(v ? "Rule enabled" : "Rule disabled"); }}
                  aria-label={r.enabled ? "Disable rule" : "Enable rule"}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium text-foreground/80">When</span> {summarise(r)}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {r.actions.setStatus && (
                  <Badge variant="secondary" className="text-[10px] gap-1"><MoveRight className="h-3 w-3" />{r.actions.setStatus}</Badge>
                )}
                {r.actions.assignTo && (
                  <Badge variant="secondary" className="text-[10px] gap-1"><UserCheck className="h-3 w-3" />{r.actions.assignTo}</Badge>
                )}
                {r.actions.aiDraftReply && (
                  <Badge variant="secondary" className="text-[10px] gap-1"><Sparkles className="h-3 w-3" />AI draft ({r.actions.aiTone})</Badge>
                )}
                {r.actions.aiClassify && <Badge variant="outline" className="text-[10px]">AI classifier</Badge>}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-muted-foreground">{r.runs.toLocaleString()} routed</span>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit rule"
                    onClick={() => { setEditing(r); setOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                    aria-label="Delete rule" onClick={() => { remove(r.id); toast.success("Rule deleted"); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <InboxRuleDialog open={open} onOpenChange={setOpen} initial={editing} onSubmit={submit} />
    </section>
  );
}
