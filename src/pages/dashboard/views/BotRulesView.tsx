import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bot, Plus, Trash2, Power, LayoutGrid, List, PlayCircle, Pencil, Copy, Zap } from "lucide-react";
import {
  ToolbarBar,
  ViewToggle,
  useViewMode,
  ListView,
} from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAutomationRules, type BotRule } from "@/hooks/useAutomationRules";
import { isGuestSession } from "@/hooks/useGuest";
import { cn } from "@/lib/utils";
import { NewRuleDialog, type RuleDraft } from "@/components/engage/NewRuleDialog";
import { TestRuleDialog } from "@/components/engage/TestRuleDialog";
import { RunAutomationDialog } from "@/components/engage/RunAutomationDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAccounts } from "@/contexts/AccountContext";

const seed: BotRule[] = [
  { id: "r1", name: "Welcome new followers", trigger: "New follower", action: "Send welcome DM", enabled: true, runs: 128 },
  { id: "r2", name: "Auto-like niche hashtags", trigger: 'Hashtag match "photography"', action: "Like recent posts", enabled: true, runs: 542 },
  { id: "r3", name: "Reply to keywords", trigger: 'Comment contains keyword "price"', action: "Reply to comment", enabled: false, runs: 34 },
];

export default function BotRulesView() {
  const [view, setView] = useViewMode("engage-bot", "grid");
  const { items, setItems, add, update, remove } = useAutomationRules();
  const { accounts } = useAccounts();
  const [search, setSearch] = useState("");
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BotRule | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testing, setTesting] = useState<BotRule | null>(null);
  const [runOpen, setRunOpen] = useState(false);

  // Guests get a seeded demo so the board isn't blank; authenticated users start clean.
  useEffect(() => {
    if (items.length === 0 && isGuestSession()) setItems(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => items.filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

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

  const duplicate = (r: BotRule) => {
    add({ ...r, id: crypto.randomUUID(), name: `${r.name} (copy)`, enabled: false, runs: 0 });
    toast.success("Rule duplicated");
  };

  const RuleCard = ({ r, dense = false }: { r: BotRule; dense?: boolean }) => (
    <div className={cn("flex items-start gap-3", dense ? "p-3" : "p-4")}>
      <div className={cn(
        "rounded-lg flex items-center justify-center flex-shrink-0",
        r.enabled ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        dense ? "w-9 h-9" : "w-10 h-10",
      )}>
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold truncate">{r.name}</h3>
          <Switch
            checked={r.enabled}
            onCheckedChange={(v) => { update(r.id, { enabled: v }); toast(v ? "Rule enabled" : "Rule disabled"); }}
            aria-label={r.enabled ? "Disable rule" : "Enable rule"}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className="font-medium text-foreground/80">When</span> {r.trigger} · <span className="font-medium text-foreground/80">then</span> {r.action}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Power className="h-3 w-3" /> {r.runs.toLocaleString()} runs
          </span>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Test rule"
              onClick={() => { setTesting(r); setTestOpen(true); }}>
              <PlayCircle className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit rule"
              onClick={() => { setEditing(r); setRuleDialogOpen(true); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Duplicate rule"
              onClick={() => duplicate(r)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
              aria-label="Delete rule" onClick={() => { remove(r.id); toast.success("Rule deleted"); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      <ToolbarBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search rules…"
        viewToggle={
          <ViewToggle
            value={view}
            onChange={setView}
            options={[
              { value: "grid", label: "Cards", icon: (p) => <LayoutGrid {...p} /> },
              { value: "list", label: "List", icon: (p) => <List {...p} /> },
            ]}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setRunOpen(true)}>
              <Zap className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Run automation</span>
            </Button>
            <Button size="sm" onClick={() => { setEditing(null); setRuleDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> New rule
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
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-border/60 bg-card hover:shadow-md transition-shadow">
              <RuleCard r={r} />
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-sm text-muted-foreground border border-dashed border-border/60 rounded-xl">
              No rules match your search.
            </div>
          )}
        </div>
      ) : (
        <ListView items={filtered} getKey={(r) => r.id} renderItem={(r) => <RuleCard r={r} dense />} />
      )}

      <NewRuleDialog
        open={ruleDialogOpen}
        onOpenChange={setRuleDialogOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />
      <TestRuleDialog open={testOpen} onOpenChange={setTestOpen} rule={testing} />
      <RunAutomationDialog open={runOpen} onOpenChange={setRunOpen} />
    </div>
  );
}
