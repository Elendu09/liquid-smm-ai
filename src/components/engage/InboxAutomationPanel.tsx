import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  Bot,
  Eye,
  Filter,
  Flag,
  Heart,
  Inbox,
  LayoutGrid,
  List,
  Loader2,
  MessageCircle,
  MessageSquareQuote,
  PenLine,
  Play,
  Plus,
  Power,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { INTENT_LABEL, type Sentiment, type Intent } from "@/hooks/useInboxAnalysis";
import { useInboxMessages } from "@/hooks/useInboxMessages";
import {
  useInboxAutomation,
  runInboxAutomation,
  DEFAULT_INBOX_RULES,
  type InboxRule,
  type InboxRuleMatch,
  type InboxRuleActions,
} from "@/hooks/useInboxAutomation";
import { InboxRuleDialog } from "@/components/engage/InboxRuleDialog";
import { getPlatformById } from "@/config/platforms";
import { cn } from "@/lib/utils";

/**
 * Inbox routing panel — concise, mobile-first, defaults shipped.
 * Each rule card is a snapshot of the match+actions; clicking edit opens
 * the n8n-style visual flow editor.
 */

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

function describeActions(actions: InboxRuleActions) {
  const out: Array<{ icon: React.ComponentType<{ className?: string }>; label: string; tone: string }> = [];
  if (actions.sendWelcomeDM) out.push({ icon: MessageCircle, label: "Welcome DM", tone: "bg-primary/10 text-primary" });
  if (actions.sendAwayDM) out.push({ icon: Send, label: "Away DM", tone: "bg-amber-500/10 text-amber-500" });
  if (actions.sendMenuDM) out.push({ icon: MessageSquareQuote, label: "Menu DM", tone: "bg-violet-500/10 text-violet-500" });
  if (actions.sendSavedReply) out.push({ icon: MessageSquareQuote, label: "Saved reply", tone: "bg-emerald-500/10 text-emerald-500" });
  if (actions.aiDraftReply) out.push({ icon: Sparkles, label: `AI draft · ${actions.aiTone}`, tone: "bg-pink-500/10 text-pink-500" });
  if (actions.assignTo) out.push({ icon: UserCheck, label: actions.assignTo, tone: "bg-cyan-500/10 text-cyan-500" });
  if (actions.label) out.push({ icon: Tag, label: `#${actions.label}`, tone: "bg-rose-500/10 text-rose-500" });
  if (actions.priority !== "normal") out.push({ icon: Flag, label: `${actions.priority} priority`, tone: "bg-amber-500/10 text-amber-600" });
  if (actions.setStatus) out.push({ icon: Inbox, label: `→ ${actions.setStatus}`, tone: "bg-slate-500/10 text-slate-500" });
  if (actions.hide) out.push({ icon: Eye, label: "Hidden as spam", tone: "bg-muted text-muted-foreground" });
  if (actions.notify) out.push({ icon: Bell, label: actions.notifyChannel || "#engage", tone: "bg-amber-500/10 text-amber-500" });
  return out;
}

const CATEGORY_META: Record<InboxRule["category"], { label: string; icon: React.ComponentType<{ className?: string }>; tone: string; description: string }> = {
  dm: { label: "Direct message", icon: MessageCircle, tone: "text-primary", description: "Greet, menu-chatbot, away replies" },
  comment: { label: "Comment", icon: Filter, tone: "text-emerald-500", description: "Keyword auto-replies" },
  triage: { label: "Inbox triage", icon: ShieldCheck, tone: "text-rose-500", description: "Label, prioritise, assign, hide" },
  "saved-reply": { label: "Saved reply", icon: MessageSquareQuote, tone: "text-cyan-500", description: "Reusable template replies" },
  custom: { label: "Custom", icon: Sparkles, tone: "text-violet-500", description: "Anything else" },
};

const STAT_TABS: Array<{ id: "all" | InboxRule["category"]; label: string }> = [
  { id: "all", label: "All" },
  { id: "dm", label: "DMs" },
  { id: "comment", label: "Comments" },
  { id: "triage", label: "Triage" },
  { id: "saved-reply", label: "Saved replies" },
  { id: "custom", label: "Custom" },
];

export function InboxAutomationPanel() {
  const { rules, add, update, remove, bumpRuns, reseedDefaults } = useInboxAutomation();
  const comments = useInboxMessages("comment");
  const dms = useInboxMessages("dm");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InboxRule | null>(null);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [category, setCategory] = useState<"all" | InboxRule["category"]>("all");

  const allItems = useMemo(() => [...comments.items, ...dms.items], [comments.items, dms.items]);
  const pending = allItems.filter((i) => i.status === "new" && !i.autoRuleId).length;
  const activeCount = rules.filter((r) => r.enabled).length;

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

  const filtered = useMemo(
    () => rules.filter((r) => category === "all" || r.category === category),
    [rules, category],
  );

  const categoryCounts = useMemo(() => {
    const out: Record<string, number> = { all: rules.length };
    rules.forEach((r) => { out[r.category] = (out[r.category] ?? 0) + 1; });
    return out;
  }, [rules]);

  return (
    <section className="mb-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Filter className="h-3.5 w-3.5" />
            </span>
            Inbox automation
            <Badge variant="secondary" className="text-[9px]">{rules.length} rules · {activeCount} live</Badge>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-respond to DMs, fire keyword comment replies, label / prioritise / assign / hide, and queue saved replies.
            {pending > 0 && <> <span className="font-medium text-foreground">{pending} unrouted</span> right now.</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={run} disabled={running || activeCount === 0}>
            {running ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />}
            Run routing
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New rule
          </Button>
        </div>
      </div>

      {/* Category pills + view toggle */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {STAT_TABS.map((tab) => {
            const count = categoryCounts[tab.id] ?? 0;
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id as typeof category)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
                  active
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/60 bg-card text-muted-foreground hover:bg-muted/50",
                )}
              >
                {tab.label}
                <span className="rounded-full bg-background/50 px-1.5 py-0.5 text-[9px] tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          {rules.length === 0 && (
            <Button size="sm" variant="ghost" onClick={() => { reseedDefaults(); toast.success("Default rules restored"); }} className="h-7 text-[10px]">
              <RefreshCw className="h-3 w-3 mr-1" /> Restore defaults
            </Button>
          )}
          <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card p-0.5">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn("grid h-6 w-6 place-items-center rounded-md text-muted-foreground", view === "grid" && "bg-muted text-foreground")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn("grid h-6 w-6 place-items-center rounded-md text-muted-foreground", view === "list" && "bg-muted text-foreground")}
              aria-label="List view"
            >
              <List className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        rules.length === 0 ? (
          <EmptyState
            variant="create-first"
            title="No inbox rules yet"
            description="We've shipped 8 defaults covering DMs, comments, triage and saved replies. Restore them or build your own from scratch."
            ctaLabel="Restore defaults"
            secondaryLabel="Create from scratch"
            onCta={() => { reseedDefaults(); toast.success(`${DEFAULT_INBOX_RULES.length} defaults restored`); }}
            onSecondaryCta={() => { setEditing(null); setOpen(true); }}
          />
        ) : (
          <EmptyState
            variant="create-first"
            title={`No ${CATEGORY_META[category]?.label.toLowerCase() ?? ""} rules yet`}
            description="Switch category or create a new rule to cover this area of your inbox."
            ctaLabel="New rule"
            onCta={() => { setEditing(null); setOpen(true); }}
          />
        )
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <RuleCard
              key={r.id}
              rule={r}
              onToggle={(v) => { update(r.id, { enabled: v }); toast(v ? "Rule enabled" : "Rule disabled"); }}
              onEdit={() => { setEditing(r); setOpen(true); }}
              onDelete={() => { remove(r.id); toast.success("Rule deleted"); }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card/50 divide-y divide-border/60">
          {filtered.map((r) => (
            <RuleListRow
              key={r.id}
              rule={r}
              onToggle={(v) => { update(r.id, { enabled: v }); toast(v ? "Rule enabled" : "Rule disabled"); }}
              onEdit={() => { setEditing(r); setOpen(true); }}
              onDelete={() => { remove(r.id); toast.success("Rule deleted"); }}
            />
          ))}
        </div>
      )}

      <InboxRuleDialog open={open} onOpenChange={setOpen} initial={editing} onSubmit={submit} />
    </section>
  );
}

function RuleCard({ rule, onToggle, onEdit, onDelete }: { rule: InboxRule; onToggle: (v: boolean) => void; onEdit: () => void; onDelete: () => void }) {
  const meta = CATEGORY_META[rule.category];
  const Icon = meta.icon;
  const actions = describeActions(rule.actions);
  return (
    <div className={cn(
      "group relative flex h-full flex-col rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
      rule.enabled ? "border-border/60" : "border-dashed border-border/50 opacity-80",
    )}>
      <div className="flex items-start gap-2.5">
        <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted/40", meta.tone)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold">{rule.name}</p>
            {rule.builtIn && <Badge variant="outline" className="text-[8px]">Default</Badge>}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">{rule.description || summarise(rule)}</p>
        </div>
        <Switch
          checked={rule.enabled}
          onCheckedChange={onToggle}
          aria-label={rule.enabled ? "Disable rule" : "Enable rule"}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {actions.length === 0 ? (
          <span className="text-[10px] text-muted-foreground">No actions yet</span>
        ) : actions.slice(0, 5).map((a) => {
          const AIcon = a.icon;
          return (
            <span key={a.label} className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium", a.tone)}>
              <AIcon className="h-2.5 w-2.5" /> {a.label}
            </span>
          );
        })}
        {actions.length > 5 && <span className="text-[9px] text-muted-foreground">+{actions.length - 5}</span>}
      </div>

      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="text-[10px] text-muted-foreground">{rule.runs.toLocaleString()} routed</span>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={onEdit}>
            <PenLine className="h-3 w-3 mr-1" /> Edit
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" aria-label="Delete rule" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function RuleListRow({ rule, onToggle, onEdit, onDelete }: { rule: InboxRule; onToggle: (v: boolean) => void; onEdit: () => void; onDelete: () => void }) {
  const meta = CATEGORY_META[rule.category];
  const Icon = meta.icon;
  return (
    <div className="flex flex-wrap items-center gap-2 p-3">
      <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted/40", meta.tone)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{rule.name}</p>
          {rule.builtIn && <Badge variant="outline" className="text-[8px]">Default</Badge>}
        </div>
        <p className="truncate text-[10px] text-muted-foreground">{summarise(rule)}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className="text-[9px]">{rule.runs.toLocaleString()} routed</Badge>
        <Switch checked={rule.enabled} onCheckedChange={onToggle} aria-label="Toggle" />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} aria-label="Edit"><PenLine className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label="Delete"><Trash2 className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}
