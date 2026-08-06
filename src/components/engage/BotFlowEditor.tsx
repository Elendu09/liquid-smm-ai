import { useState } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Zap, GitBranch, Bot, Save,
  ChevronLeft, ChevronRight, Power, MousePointerClick, MessageSquare, Heart, UserPlus, Bell, CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { BotRule, FlowNode, FlowNodeType } from "@/hooks/useAutomationRules";
import { cn } from "@/lib/utils";

interface ParamDef {
  key: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
}

interface NodeKindDef {
  kind: string;
  type: FlowNodeType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  params: ParamDef[];
  summarize: (p: Record<string, string>) => string;
}

const CATALOG: NodeKindDef[] = [
  // Triggers
  { kind: "new_follower", type: "trigger", label: "New follower", icon: UserPlus, params: [], summarize: () => "When someone follows you" },
  { kind: "new_comment", type: "trigger", label: "New comment", icon: MessageSquare, params: [], summarize: () => "When a new comment arrives" },
  { kind: "new_dm", type: "trigger", label: "New DM", icon: Bot, params: [], summarize: () => "When a direct message arrives" },
  { kind: "hashtag_match", type: "trigger", label: "Hashtag match", icon: Zap, params: [{ key: "hashtag", label: "Hashtag", placeholder: "photography", defaultValue: "photography" }], summarize: (p) => `When a post uses #${p.hashtag || "…"}` },
  { kind: "keyword_match", type: "trigger", label: "Keyword match", icon: Zap, params: [{ key: "keyword", label: "Keyword", placeholder: "price", defaultValue: "price" }], summarize: (p) => `When a message contains "${p.keyword || "…"}"` },
  { kind: "post_scheduled", type: "trigger", label: "Post scheduled", icon: CalendarClock, params: [], summarize: () => "When a post is scheduled" },
  { kind: "rss_item", type: "trigger", label: "New RSS item", icon: Bell, params: [], summarize: () => "When an RSS feed has a new item" },

  // Conditions
  { kind: "platform_is", type: "condition", label: "Platform is", icon: GitBranch, params: [{ key: "platform", label: "Platform", placeholder: "instagram", defaultValue: "instagram" }], summarize: (p) => `Platform is ${p.platform || "…"}` },
  { kind: "engagement_above", type: "condition", label: "Engagement above", icon: GitBranch, params: [{ key: "threshold", label: "Min engagement", placeholder: "50", defaultValue: "50" }], summarize: (p) => `Engagement ≥ ${p.threshold || "…"}` },
  { kind: "contains_keyword", type: "condition", label: "Contains keyword", icon: GitBranch, params: [{ key: "keyword", label: "Keyword", placeholder: "sale", defaultValue: "sale" }], summarize: (p) => `Contains "${p.keyword || "…"}"` },
  { kind: "time_window", type: "condition", label: "Time window", icon: GitBranch, params: [
    { key: "from", label: "From (24h)", placeholder: "09:00", defaultValue: "09:00" },
    { key: "to", label: "To (24h)", placeholder: "21:00", defaultValue: "21:00" },
  ], summarize: (p) => `Runs ${p.from || "…"}–${p.to || "…"}` },

  // Actions
  { kind: "send_dm", type: "action", label: "Send DM", icon: Bot, params: [{ key: "message", label: "Message", placeholder: "Thanks for following!", defaultValue: "Thanks for following!" }], summarize: (p) => `Send DM: "${(p.message || "…").slice(0, 40)}"` },
  { kind: "reply_comment", type: "action", label: "Reply to comment", icon: MessageSquare, params: [{ key: "message", label: "Reply", placeholder: "Thanks!", defaultValue: "Thanks!" }], summarize: (p) => `Reply "${(p.message || "…").slice(0, 40)}"` },
  { kind: "like_post", type: "action", label: "Like post", icon: Heart, params: [], summarize: () => "Like the post" },
  { kind: "follow_back", type: "action", label: "Follow back", icon: UserPlus, params: [], summarize: () => "Follow the account back" },
  { kind: "notify", type: "action", label: "Send notification", icon: Bell, params: [{ key: "message", label: "Note", placeholder: "New high-value lead", defaultValue: "New lead" }], summarize: (p) => `Notify: ${p.message || "…"}` },
  { kind: "schedule_post", type: "action", label: "Schedule post", icon: CalendarClock, params: [{ key: "caption", label: "Caption", placeholder: "Caption", defaultValue: "New post" }], summarize: (p) => `Schedule post "${(p.caption || "…").slice(0, 40)}"` },
];

const TYPE_META: Record<FlowNodeType, { label: string; icon: React.ComponentType<{ className?: string }>; card: string; chip: string }> = {
  trigger: { label: "Trigger", icon: Zap, card: "border-emerald-500/40", chip: "bg-emerald-500/10 text-emerald-600" },
  condition: { label: "Condition", icon: GitBranch, card: "border-amber-500/40", chip: "bg-amber-500/10 text-amber-600" },
  action: { label: "Action", icon: MousePointerClick, card: "border-primary/40", chip: "bg-primary/10 text-primary" },
};

const kindDef = (kind: string) => CATALOG.find((k) => k.kind === kind);

const uid = () => `n_${Math.random().toString(36).slice(2, 9)}`;

function defaultFlow(rule: BotRule): FlowNode[] {
  const t: FlowNode = { id: uid(), type: "trigger", kind: "new_follower", label: rule.trigger || "New follower", params: {} };
  const a: FlowNode = { id: uid(), type: "action", kind: "send_dm", label: rule.action || "Send DM", params: {} };
  return [t, a];
}

function makeNode(kind: string, label?: string): FlowNode {
  const def = kindDef(kind);
  const params: Record<string, string> = {};
  def?.params.forEach((p) => { if (p.defaultValue) params[p.key] = p.defaultValue; });
  return { id: uid(), type: def?.type ?? "action", kind, label: label ?? def?.label ?? kind, params };
}

export function BotFlowEditor({ rule, onSave }: { rule: BotRule; onSave: (ruleId: string, flow: FlowNode[]) => void }) {
  const [flow, setFlow] = useState<FlowNode[]>(rule.flow && rule.flow.length >= 2 ? rule.flow : defaultFlow(rule));
  const [editing, setEditing] = useState<FlowNode | null>(null);
  const [addingAfter, setAddingAfter] = useState<number | null>(null);
  const [enabled, setEnabled] = useState(rule.enabled);

  // Config dialog form state
  const [cfgType, setCfgType] = useState<FlowNodeType>("condition");
  const [cfgKind, setCfgKind] = useState("contains_keyword");
  const [cfgLabel, setCfgLabel] = useState("");
  const [cfgParams, setCfgParams] = useState<Record<string, string>>({});

  const openNew = (afterIndex: number | null) => {
    setAddingAfter(afterIndex);
    setCfgType("condition");
    setCfgKind("contains_keyword");
    setCfgLabel("");
    setCfgParams({});
    setEditing(null);
  };

  const openEdit = (node: FlowNode) => {
    setEditing(node);
    setAddingAfter(null);
    setCfgType(node.type);
    setCfgKind(node.kind);
    setCfgLabel(node.label);
    setCfgParams({ ...node.params });
  };

  const kindsFor = (t: FlowNodeType) => CATALOG.filter((k) => k.type === t);
  const def = kindDef(cfgKind);

  const applyKind = (kind: string) => {
    setCfgKind(kind);
    const d = kindDef(kind);
    if (d) {
      setCfgType(d.type);
      if (!cfgLabel || kindDef(cfgKind)?.label === cfgLabel) setCfgLabel(d.label);
      const next: Record<string, string> = {};
      d.params.forEach((p) => { next[p.key] = p.defaultValue ?? ""; });
      setCfgParams(next);
    }
  };

  const commitConfig = () => {
    if (!cfgLabel.trim()) { toast.error("Name the node"); return; }
    const node: FlowNode = { id: editing?.id ?? uid(), type: cfgType, kind: cfgKind, label: cfgLabel.trim(), params: cfgParams };
    let next: FlowNode[];
    if (editing) {
      next = flow.map((n) => (n.id === editing.id ? node : n));
    } else {
      const idx = addingAfter === null ? flow.length : addingAfter + 1;
      next = [...flow.slice(0, idx), node, ...flow.slice(idx)];
    }
    setFlow(next);
    setEditing(null);
    setAddingAfter(null);
  };

  const removeNode = (id: string) => {
    if (flow.length <= 2) { toast.error("A rule needs at least a trigger and an action"); return; }
    setFlow(flow.filter((n) => n.id !== id));
  };

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= flow.length) return;
    const next = [...flow];
    [next[index], next[to]] = [next[to], next[index]];
    setFlow(next);
  };

  const summary = (node: FlowNode) => kindDef(node.kind)?.summarize(node.params) ?? node.label;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input value={rule.name} readOnly disabled className="max-w-xs font-medium" />
        <span className="text-xs text-muted-foreground">· visual flow</span>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => openNew(flow.length - 1)}>
            <Plus className="h-4 w-4 mr-1" /> Add step
          </Button>
          <Button size="sm" onClick={() => { onSave(rule.id, flow); }}>
            <Save className="h-4 w-4 mr-1" /> Save flow
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/20 p-4 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max pb-2">
          {flow.map((node, i) => {
            const meta = TYPE_META[node.type];
            const Icon = node.type === "trigger" ? Zap : node.type === "condition" ? GitBranch : MousePointerClick;
            return (
              <div key={node.id} className="flex items-center gap-2">
                {i > 0 && <div className="w-8 border-t-2 border-dashed border-muted-foreground/40 shrink-0" />}
                <div className={cn("relative w-56 shrink-0 rounded-xl border bg-card p-3 shadow-sm", meta.card)}>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", meta.chip)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{meta.label}</div>
                      <div className="text-sm font-semibold truncate">{node.label}</div>
                    </div>
                    <div className="flex gap-0.5">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(node)} title="Edit">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeNode(node.id)} title="Delete">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2">{summary(node)}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => move(i, -1)} disabled={i === 0} title="Move left">
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span>step {i + 1} / {flow.length}</span>
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => move(i, 1)} disabled={i === flow.length - 1} title="Move right">
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                  {/* ports */}
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-muted-foreground/50" />
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/70" />
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 border-t-2 border-dashed border-muted-foreground/30" />
            <Button size="sm" variant="ghost" className="h-9 w-9 rounded-full border border-dashed border-border/60" onClick={() => openNew(flow.length - 1)} title="Add step">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center gap-2 text-sm">
        <Power className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Active</span>
        <Switch checked={enabled} onCheckedChange={(v) => { setEnabled(v); onSave(rule.id, flow); }} />
      </div>

      {/* Config dialog */}
      <Dialog open={!!editing || addingAfter !== null} onOpenChange={(v) => { if (!v) { setEditing(null); setAddingAfter(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit node" : "Add node"}</DialogTitle>
            <DialogDescription>Configure the trigger, condition or action for this step.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={cfgType} onValueChange={(v) => { setCfgType(v as FlowNodeType); setCfgKind(kindsFor(v as FlowNodeType)[0]?.kind ?? cfgKind); applyKind(kindsFor(v as FlowNodeType)[0]?.kind ?? cfgKind); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trigger">Trigger</SelectItem>
                  <SelectItem value="condition">Condition</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Node</Label>
              <Select value={cfgKind} onValueChange={applyKind}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {kindsFor(cfgType).map((k) => (
                    <SelectItem key={k.kind} value={k.kind}>{k.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Name</Label>
              <Input className="mt-1" value={cfgLabel} onChange={(e) => setCfgLabel(e.target.value)} placeholder="Step name" />
            </div>
            {def && def.params.map((p) => (
              <div key={p.key}>
                <Label className="text-xs">{p.label}</Label>
                <Input
                  className="mt-1"
                  value={cfgParams[p.key] ?? ""}
                  placeholder={p.placeholder}
                  onChange={(e) => setCfgParams((prev) => ({ ...prev, [p.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEditing(null); setAddingAfter(null); }}>Cancel</Button>
            <Button onClick={commitConfig}>{editing ? "Save node" : "Add node"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BotFlowEditor;
