import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Copy,
  GitBranch,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  Plus,
  Power,
  Search,
  Settings2,
  Share2,
  Sparkles,
  Trash2,
  Workflow,
  Zap,
} from "lucide-react";
import {
  ToolbarBar,
  ViewToggle,
  useViewMode,
  ListView,
} from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAutomationRules, type BotRule } from "@/hooks/useAutomationRules";
import { isGuestSession } from "@/hooks/useGuest";
import { cn } from "@/lib/utils";
import { NewRuleDialog, type RuleDraft } from "@/components/engage/NewRuleDialog";
import { TestRuleDialog } from "@/components/engage/TestRuleDialog";
import { RunAutomationDialog } from "@/components/engage/RunAutomationDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAccounts } from "@/contexts/AccountContext";
import { InboxAutomationPanel } from "@/components/engage/InboxAutomationPanel";
import { BotFlowEditor } from "@/components/engage/BotFlowEditor";
import { BotHistoryLogs } from "@/components/engage/BotHistoryLogs";
import { PanelSection } from "@/components/shared/PanelSection";
import { useReshareFlows } from "@/hooks/useReshareFlows";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Bot rules view — concise shell. The visual flow editor (BotFlowEditor) is
 * the heart of the page; surrounding chrome is kept minimal so the focus
 * stays on rules rather than on marketing surfaces.
 */

const seed: BotRule[] = [
  { id: "r1", name: "Welcome new followers", trigger: "New follower", action: "Send welcome DM", enabled: true, runs: 128 },
  { id: "r2", name: "Auto-like niche hashtags", trigger: 'Hashtag match "photography"', action: "Like recent posts", enabled: true, runs: 542 },
  { id: "r3", name: "Reply to keywords", trigger: 'Comment contains keyword "price"', action: "Reply to comment", enabled: false, runs: 34 },
];

export default function BotRulesView() {
  const [view, setView] = useViewMode("engage-bot", "grid");
  const { items, setItems, add, update, remove } = useAutomationRules();
  const { items: reshareFlows } = useReshareFlows();
  const { accounts } = useAccounts();
  const [search, setSearch] = useState("");
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BotRule | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testing, setTesting] = useState<BotRule | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [flowRuleId, setFlowRuleId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0 && isGuestSession()) setItems(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => items.filter((rule) => !search || `${rule.name} ${rule.trigger} ${rule.action}`.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  const flowRule = useMemo(
    () => items.find((rule) => rule.id === flowRuleId) ?? items[0] ?? null,
    [items, flowRuleId],
  );

  const totals = useMemo(() => ({
    active: items.filter((rule) => rule.enabled).length,
    runs: items.reduce((sum, rule) => sum + rule.runs, 0),
    nodes: items.reduce((sum, rule) => sum + (rule.flow?.length ?? 2), 0),
  }), [items]);

  const handleSubmit = (draft: RuleDraft) => {
    if (draft.id) {
      update(draft.id, { name: draft.name, trigger: draft.trigger, action: draft.action, enabled: draft.enabled });
      toast.success("Rule updated");
    } else {
      add({ id: crypto.randomUUID(), name: draft.name, trigger: draft.trigger, action: draft.action, enabled: draft.enabled, runs: 0 });
      toast.success("Rule created");
    }
    setEditing(null);
  };

  const duplicate = (rule: BotRule) => {
    add({ ...rule, id: crypto.randomUUID(), name: `${rule.name} (copy)`, enabled: false, runs: 0 });
    toast.success("Rule duplicated");
  };

  const RuleCard = ({ rule, dense = false }: { rule: BotRule; dense?: boolean }) => {
    const nodeCount = rule.flow?.length ?? 2;
    return (
      <div className={cn("flex items-start gap-3", dense ? "p-3" : "p-4")}>
        <div className={cn(
          "relative flex shrink-0 items-center justify-center rounded-xl",
          rule.enabled ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          dense ? "h-9 w-9" : "h-10 w-10",
        )}>
          <Bot className="h-4 w-4" />
          {rule.enabled && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold">{rule.name}</h3>
            <Switch
              checked={rule.enabled}
              onCheckedChange={(value) => { update(rule.id, { enabled: value }); toast(value ? "Rule enabled" : "Rule disabled"); }}
              aria-label={rule.enabled ? "Disable rule" : "Enable rule"}
            />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">When</span> {rule.trigger} · <span className="font-medium text-foreground/80">then</span> {rule.action}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="gap-1 text-[9px]"><GitBranch className="h-2.5 w-2.5" /> {nodeCount} nodes</Badge>
            <Badge variant="secondary" className="gap-1 text-[9px]"><Power className="h-2.5 w-2.5" /> {rule.runs.toLocaleString()} runs</Badge>
            {rule.flow && <Badge variant="secondary" className="gap-1 text-[9px]"><CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> visualized</Badge>}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Last run 4m ago · 98% success</span>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Test rule" onClick={() => { setTesting(rule); setTestOpen(true); }}><PlayCircle className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit rule" onClick={() => { setEditing(rule); setRuleDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Duplicate rule" onClick={() => duplicate(rule)}><Copy className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" aria-label="Delete rule" onClick={() => { remove(rule.id); toast.success("Rule deleted"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 pb-8 sm:px-6 lg:px-8">
      <BotHistoryLogs />
      {/* Compact header */}
      <section className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/10"><Sparkles className="h-3 w-3" /></span>
            Automation control plane
          </div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Engagement rules & inbox automation</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Visual event-driven bots, plus ready-to-use inbox routing for DMs, comment keywords, triage and saved replies.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="gap-1 text-[10px]"><Activity className="h-2.5 w-2.5 text-emerald-500" /> {totals.active} live</Badge>
            <Badge variant="secondary" className="gap-1 text-[10px]"><Power className="h-2.5 w-2.5" /> {totals.runs.toLocaleString()} runs</Badge>
            <Badge variant="secondary" className="gap-1 text-[10px]"><GitBranch className="h-2.5 w-2.5" /> {totals.nodes} nodes</Badge>
            <Badge variant="secondary" className="gap-1 text-[10px]"><Share2 className="h-2.5 w-2.5" /> {reshareFlows.length} reshare routes</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/dashboard/engage/reshare">
              <Share2 className="mr-1 h-4 w-4" /> Reshare engine <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setRuleDialogOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> New rule
          </Button>
        </div>
      </section>

      {/* Inbox automation (this is the headlining feature for "engage" in social media) */}
      <InboxAutomationPanel />

      {/* Bot rules */}
      <PanelSection
        icon={Bot}
        title="Engagement rules"
        description="Outbound automation: welcome DMs, keyword replies, AI branches, and safe actions."
        accent="from-emerald-500 via-emerald-500/50 to-transparent"
        action={
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-600 sm:inline-flex">
            <Activity className="h-3 w-3" /> Live event monitor connected
          </span>
        }
      >
      <ToolbarBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search rules, triggers, or actions…"
        viewToggle={
          <ViewToggle
            value={view}
            onChange={setView}
            options={[
              { value: "grid", label: "Cards", icon: (props) => <LayoutGrid {...props} /> },
              { value: "list", label: "List", icon: (props) => <List {...props} /> },
              { value: "flow", label: "Flow", icon: (props) => <Workflow {...props} /> },
            ]}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setRunOpen(true)}>
              <Zap className="mr-1 h-4 w-4" /><span className="hidden sm:inline">Run automation</span>
            </Button>
            <Button size="sm" onClick={() => { setEditing(null); setRuleDialogOpen(true); }}>
              <Plus className="mr-1 h-4 w-4" /><span className="hidden sm:inline">New rule</span>
            </Button>
          </div>
        }
      />

      {items.length === 0 && !isGuestSession() ? (
        accounts.length === 0 ? (
          <EmptyState variant="connect-account" description="Connect an account so automations have somewhere to run." />
        ) : (
          <EmptyState
            variant="create-first"
            title="No automation rules yet"
            description="Automate welcome DMs, keyword replies, and more. Create your first rule to start saving hours every week."
            ctaLabel="New rule"
            onCta={() => { setEditing(null); setRuleDialogOpen(true); }}
          />
        )
      ) : view === "flow" ? (
        flowRule ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={flowRule.id} onValueChange={setFlowRuleId}>
                <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
                <SelectContent>{items.map((rule) => <SelectItem key={rule.id} value={rule.id}>{rule.name}</SelectItem>)}</SelectContent>
              </Select>
              <span className="hidden text-xs text-muted-foreground sm:inline">Build trigger → logic → action → delivery flows.</span>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => { setEditing(flowRule); setRuleDialogOpen(true); }}>
                <Pencil className="mr-1 h-4 w-4" /> Edit details
              </Button>
            </div>
            <BotFlowEditor
              key={flowRule.id}
              rule={flowRule}
              onSave={(id, flow) => { update(id, { flow }); toast.success("Flow saved"); }}
              onStatusChange={(id, enabled) => update(id, { enabled })}
            />
          </div>
        ) : (
          <EmptyState
            variant="create-first"
            title="No rules yet"
            description="Create a rule to open the visual flow editor."
            ctaLabel="New rule"
            onCta={() => setRuleDialogOpen(true)}
          />
        )
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((rule) => (
            <div key={rule.id} className="rounded-2xl border border-border/60 bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <RuleCard rule={rule} />
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">No rules match your search.</div>}
        </div>
      ) : (
        <ListView items={filtered} getKey={(rule) => rule.id} renderItem={(rule) => <RuleCard rule={rule} dense />} />
      )}
      </PanelSection>

      <NewRuleDialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen} initial={editing} onSubmit={handleSubmit} />
      <TestRuleDialog open={testOpen} onOpenChange={setTestOpen} rule={testing} />
      <RunAutomationDialog open={runOpen} onOpenChange={setRunOpen} />
    </div>
  );
}
