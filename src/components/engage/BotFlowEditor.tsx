import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, Zap, GitBranch, Bot, Save, Search, Copy, X,
  Power, MousePointerClick, MessageSquare, Heart, UserPlus, Bell, CalendarClock,
  ZoomIn, ZoomOut, Maximize2, PlayCircle, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BotRule, FlowEdge, FlowNode, FlowNodeType } from "@/hooks/useAutomationRules";
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
  group: "Trigger" | "Condition" | "Action" | "AI" | "Flow";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  params: ParamDef[];
  summarize: (p: Record<string, string>) => string;
}

const CATALOG: NodeKindDef[] = [
  // Triggers
  { kind: "new_follower", type: "trigger", group: "Trigger", label: "New follower", description: "Fires when someone follows you", icon: UserPlus, params: [], summarize: () => "When someone follows you" },
  { kind: "new_comment", type: "trigger", group: "Trigger", label: "New comment", description: "Fires on every new comment", icon: MessageSquare, params: [], summarize: () => "When a new comment arrives" },
  { kind: "new_dm", type: "trigger", group: "Trigger", label: "New DM", description: "Fires on every new direct message", icon: Bot, params: [], summarize: () => "When a direct message arrives" },
  { kind: "hashtag_match", type: "trigger", group: "Trigger", label: "Hashtag match", description: "Fires when a post uses a hashtag", icon: Zap, params: [{ key: "hashtag", label: "Hashtag", placeholder: "photography", defaultValue: "photography" }], summarize: (p) => `When a post uses #${p.hashtag || "…"}` },
  { kind: "keyword_match", type: "trigger", group: "Trigger", label: "Keyword match", description: "Fires on a keyword in a message", icon: Zap, params: [{ key: "keyword", label: "Keyword", placeholder: "price", defaultValue: "price" }], summarize: (p) => `When a message contains "${p.keyword || "…"}"` },
  { kind: "post_scheduled", type: "trigger", group: "Trigger", label: "Post scheduled", description: "Fires when a post is scheduled", icon: CalendarClock, params: [], summarize: () => "When a post is scheduled" },
  { kind: "rss_item", type: "trigger", group: "Trigger", label: "New RSS item", description: "Fires on a new feed item", icon: Bell, params: [], summarize: () => "When an RSS feed has a new item" },

  // Conditions
  { kind: "platform_is", type: "condition", group: "Condition", label: "Platform is", description: "Continue only for one network", icon: GitBranch, params: [{ key: "platform", label: "Platform", placeholder: "instagram", defaultValue: "instagram" }], summarize: (p) => `Platform is ${p.platform || "…"}` },
  { kind: "engagement_above", type: "condition", group: "Condition", label: "Engagement above", description: "Continue past a threshold", icon: GitBranch, params: [{ key: "threshold", label: "Min engagement", placeholder: "50", defaultValue: "50" }], summarize: (p) => `Engagement ≥ ${p.threshold || "…"}` },
  { kind: "contains_keyword", type: "condition", group: "Condition", label: "Contains keyword", description: "Continue on a matching keyword", icon: GitBranch, params: [{ key: "keyword", label: "Keyword", placeholder: "sale", defaultValue: "sale" }], summarize: (p) => `Contains "${p.keyword || "…"}"` },
  { kind: "time_window", type: "condition", group: "Flow", label: "Time window", description: "Only run between two times", icon: CalendarClock, params: [
    { key: "from", label: "From (24h)", placeholder: "09:00", defaultValue: "09:00" },
    { key: "to", label: "To (24h)", placeholder: "21:00", defaultValue: "21:00" },
  ], summarize: (p) => `Runs ${p.from || "…"}–${p.to || "…"}` },

  // AI
  { kind: "ai_reply", type: "action", group: "AI", label: "AI reply", description: "Draft a reply with AI", icon: Sparkles, params: [{ key: "tone", label: "Tone", placeholder: "friendly", defaultValue: "friendly" }], summarize: (p) => `AI reply (${p.tone || "friendly"})` },
  { kind: "ai_classify", type: "condition", group: "AI", label: "AI sentiment", description: "Branch on message sentiment", icon: Sparkles, params: [{ key: "sentiment", label: "Sentiment", placeholder: "negative", defaultValue: "negative" }], summarize: (p) => `Sentiment is ${p.sentiment || "…"}` },

  // Actions
  { kind: "send_dm", type: "action", group: "Action", label: "Send DM", description: "Send a direct message", icon: Bot, params: [{ key: "message", label: "Message", placeholder: "Thanks for following!", defaultValue: "Thanks for following!" }], summarize: (p) => `Send DM: "${(p.message || "…").slice(0, 40)}"` },
  { kind: "reply_comment", type: "action", group: "Action", label: "Reply to comment", description: "Post a public reply", icon: MessageSquare, params: [{ key: "message", label: "Reply", placeholder: "Thanks!", defaultValue: "Thanks!" }], summarize: (p) => `Reply "${(p.message || "…").slice(0, 40)}"` },
  { kind: "like_post", type: "action", group: "Action", label: "Like post", description: "Like the triggering post", icon: Heart, params: [], summarize: () => "Like the post" },
  { kind: "follow_back", type: "action", group: "Action", label: "Follow back", description: "Follow the account back", icon: UserPlus, params: [], summarize: () => "Follow the account back" },
  { kind: "notify", type: "action", group: "Action", label: "Send notification", description: "Notify yourself in-app", icon: Bell, params: [{ key: "message", label: "Note", placeholder: "New high-value lead", defaultValue: "New lead" }], summarize: (p) => `Notify: ${p.message || "…"}` },
  { kind: "schedule_post", type: "action", group: "Action", label: "Schedule post", description: "Queue a new post", icon: CalendarClock, params: [{ key: "caption", label: "Caption", placeholder: "Caption", defaultValue: "New post" }], summarize: (p) => `Schedule post "${(p.caption || "…").slice(0, 40)}"` },
];

const GROUPS: NodeKindDef["group"][] = ["Trigger", "Condition", "AI", "Action", "Flow"];

const TYPE_META: Record<FlowNodeType, { label: string; card: string; chip: string; port: string }> = {
  trigger: { label: "Trigger", card: "border-emerald-500/50", chip: "bg-emerald-500/10 text-emerald-600", port: "bg-emerald-500" },
  condition: { label: "Condition", card: "border-amber-500/50", chip: "bg-amber-500/10 text-amber-600", port: "bg-amber-500" },
  action: { label: "Action", card: "border-primary/50", chip: "bg-primary/10 text-primary", port: "bg-primary" },
};

const NODE_W = 224;
const NODE_H = 104;
const GAP_X = 300;

const kindDef = (kind: string) => CATALOG.find((k) => k.kind === kind);
const uid = () => `n_${Math.random().toString(36).slice(2, 9)}`;

function makeNode(kind: string, position: { x: number; y: number }): FlowNode {
  const def = kindDef(kind);
  const params: Record<string, string> = {};
  def?.params.forEach((p) => { if (p.defaultValue) params[p.key] = p.defaultValue; });
  return { id: uid(), type: def?.type ?? "action", kind, label: def?.label ?? kind, params, position };
}

function defaultFlow(rule: BotRule): FlowNode[] {
  return [
    { id: uid(), type: "trigger", kind: "new_follower", label: rule.trigger || "New follower", params: {}, position: { x: 40, y: 60 } },
    { id: uid(), type: "action", kind: "send_dm", label: rule.action || "Send DM", params: {}, position: { x: 40 + GAP_X, y: 60 } },
  ];
}

/** Give legacy (position-less, edge-less) flows a canvas layout + linear edges. */
function hydrate(flow: FlowNode[]): FlowNode[] {
  const positioned = flow.map((n, i) => ({
    ...n,
    position: n.position ?? { x: 40 + i * GAP_X, y: 60 },
  }));
  const hasEdges = positioned.some((n) => (n.edges?.length ?? 0) > 0);
  if (hasEdges) return positioned;
  return positioned.map((n, i) => ({
    ...n,
    edges: i < positioned.length - 1 ? [{ from: n.id, to: positioned[i + 1].id }] : [],
  }));
}

export function BotFlowEditor({ rule, onSave }: { rule: BotRule; onSave: (ruleId: string, flow: FlowNode[]) => void }) {
  const [flow, setFlow] = useState<FlowNode[]>(() =>
    hydrate(rule.flow && rule.flow.length >= 2 ? rule.flow : defaultFlow(rule)),
  );
  const [enabled, setEnabled] = useState(rule.enabled);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [testLog, setTestLog] = useState<string[] | null>(null);

  // Canvas viewport
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ id: string | null; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const selected = flow.find((n) => n.id === selectedId) ?? null;
  const edges = useMemo(() => flow.flatMap((n) => n.edges ?? []), [flow]);
  const byId = useMemo(() => Object.fromEntries(flow.map((n) => [n.id, n])), [flow]);

  const patchNode = useCallback((id: string, patch: Partial<FlowNode>) => {
    setFlow((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  /* ---------------------------------------------------------------- dragging */
  const onNodePointerDown = (e: React.PointerEvent, node: FlowNode) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setSelectedId(node.id);
    dragRef.current = {
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: node.position?.x ?? 0,
      origY: node.position?.y ?? 0,
    };
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    panRef.current = { startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d?.id) {
      patchNode(d.id, {
        position: {
          x: Math.max(0, d.origX + (e.clientX - d.startX) / zoom),
          y: Math.max(0, d.origY + (e.clientY - d.startY) / zoom),
        },
      });
      return;
    }
    const p = panRef.current;
    if (p) setPan({ x: p.origX + (e.clientX - p.startX), y: p.origY + (e.clientY - p.startY) });
  };

  const endPointer = () => {
    dragRef.current = null;
    panRef.current = null;
  };

  /* ------------------------------------------------------------ node actions */
  const addNode = (kind: string) => {
    const parent = pickerFor ? byId[pickerFor] : flow[flow.length - 1];
    const base = parent?.position ?? { x: 40, y: 60 };
    const siblings = (parent?.edges ?? []).length;
    const node = makeNode(kind, { x: base.x + GAP_X, y: base.y + siblings * (NODE_H + 40) });
    setFlow((prev) => {
      const next = prev.map((n) =>
        n.id === parent?.id
          ? { ...n, edges: [...(n.edges ?? []), { from: n.id, to: node.id } as FlowEdge] }
          : n,
      );
      return [...next, { ...node, edges: [] }];
    });
    setSelectedId(node.id);
    setPickerFor(null);
    setPickerSearch("");
  };

  const removeNode = (id: string) => {
    if (flow.length <= 2) { toast.error("A rule needs at least a trigger and an action"); return; }
    setFlow((prev) =>
      prev
        .filter((n) => n.id !== id)
        .map((n) => ({ ...n, edges: (n.edges ?? []).filter((e) => e.to !== id) })),
    );
    setSelectedId(null);
  };

  const duplicateNode = (node: FlowNode) => {
    const copy: FlowNode = {
      ...node,
      id: uid(),
      label: `${node.label} copy`,
      position: { x: (node.position?.x ?? 0) + 40, y: (node.position?.y ?? 0) + NODE_H + 40 },
      edges: [],
    };
    setFlow((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  };

  const runTest = () => {
    const start = flow.find((n) => n.type === "trigger") ?? flow[0];
    const log: string[] = [];
    const seen = new Set<string>();
    const walk = (id: string, depth: number) => {
      const n = byId[id];
      if (!n || seen.has(id)) return;
      seen.add(id);
      const summary = kindDef(n.kind)?.summarize(n.params) ?? n.label;
      log.push(`${"  ".repeat(depth)}${n.disabled ? "skipped" : "would fire"} · ${n.label} — ${summary}`);
      if (n.disabled) return;
      (n.edges ?? []).forEach((e) => walk(e.to, depth + 1));
    };
    if (start) walk(start.id, 0);
    setTestLog(log.length ? log : ["Nothing to run — the flow has no trigger."]);
  };

  const fit = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const bounds = flow.reduce(
    (acc, n) => ({
      w: Math.max(acc.w, (n.position?.x ?? 0) + NODE_W + 200),
      h: Math.max(acc.h, (n.position?.y ?? 0) + NODE_H + 160),
    }),
    { w: 900, h: 420 },
  );

  const filteredCatalog = CATALOG.filter((k) =>
    pickerSearch
      ? (k.label + k.description).toLowerCase().includes(pickerSearch.toLowerCase())
      : true,
  );

  const summary = (node: FlowNode) => kindDef(node.kind)?.summarize(node.params) ?? node.label;
  const def = selected ? kindDef(selected.kind) : null;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold truncate max-w-[16rem]">{rule.name}</span>
        <span className="text-xs text-muted-foreground">· visual flow</span>
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/60 p-0.5">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} title="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="px-1 text-[11px] tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))} title="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={fit} title="Reset view">
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-2.5 py-1.5">
            <Power className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{enabled ? "Active" : "Inactive"}</span>
            <Switch checked={enabled} onCheckedChange={(v) => { setEnabled(v); onSave(rule.id, flow); }} />
          </div>
          <Button size="sm" variant="outline" onClick={runTest}>
            <PlayCircle className="h-4 w-4 mr-1" /> Test flow
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPickerFor(selectedId ?? flow[flow.length - 1]?.id ?? null)}>
            <Plus className="h-4 w-4 mr-1" /> Add node
          </Button>
          <Button size="sm" onClick={() => onSave(rule.id, flow)}>
            <Save className="h-4 w-4 mr-1" /> Save flow
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_20rem]">
        {/* Canvas */}
        <div
          className="relative h-[26rem] overflow-hidden rounded-2xl border border-border/60 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--muted-foreground)/0.25)_1px,transparent_0)] [background-size:20px_20px] bg-card/40 touch-none"
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerLeave={endPointer}
        >
          <div
            className="absolute inset-0 origin-top-left"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: bounds.w, height: bounds.h }}
          >
            {/* Edges */}
            <svg className="pointer-events-none absolute inset-0" width={bounds.w} height={bounds.h}>
              <defs>
                <marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 z" className="fill-primary/70" />
                </marker>
              </defs>
              {edges.map((e) => {
                const a = byId[e.from];
                const b = byId[e.to];
                if (!a || !b) return null;
                const x1 = (a.position?.x ?? 0) + NODE_W;
                const y1 = (a.position?.y ?? 0) + NODE_H / 2;
                const x2 = b.position?.x ?? 0;
                const y2 = (b.position?.y ?? 0) + NODE_H / 2;
                const dx = Math.max(40, (x2 - x1) / 2);
                return (
                  <path
                    key={`${e.from}-${e.to}`}
                    d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                    className="stroke-primary/50"
                    strokeWidth={2}
                    fill="none"
                    markerEnd="url(#flow-arrow)"
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {flow.map((node) => {
              const meta = TYPE_META[node.type];
              const Icon = kindDef(node.kind)?.icon ?? MousePointerClick;
              const active = node.id === selectedId;
              return (
                <div
                  key={node.id}
                  onPointerDown={(e) => onNodePointerDown(e, node)}
                  style={{ left: node.position?.x ?? 0, top: node.position?.y ?? 0, width: NODE_W, height: NODE_H }}
                  className={cn(
                    "absolute cursor-grab select-none rounded-xl border bg-card p-3 shadow-sm transition-shadow active:cursor-grabbing",
                    meta.card,
                    active && "ring-2 ring-primary/60 shadow-lg",
                    node.disabled && "opacity-50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", meta.chip)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{meta.label}</div>
                      <div className="truncate text-sm font-semibold">{node.label}</div>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">{summary(node)}</p>

                  {/* Ports */}
                  <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-background bg-muted-foreground/60" />
                  <button
                    type="button"
                    title="Add next step"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => { setPickerFor(node.id); setSelectedId(node.id); }}
                    className={cn(
                      "absolute -right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border-2 border-background text-[10px] text-primary-foreground",
                      meta.port,
                    )}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel: node picker or node config */}
        <div className="rounded-2xl border border-border/60 bg-card/60 p-3">
          {pickerFor ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">What happens next?</h4>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => setPickerFor(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-8"
                  placeholder="Search nodes…"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-[19rem] pr-2">
                <div className="space-y-3">
                  {GROUPS.map((g) => {
                    const list = filteredCatalog.filter((k) => k.group === g);
                    if (!list.length) return null;
                    return (
                      <div key={g}>
                        <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{g}</div>
                        <div className="space-y-1">
                          {list.map((k) => (
                            <button
                              key={k.kind}
                              type="button"
                              onClick={() => addNode(k.kind)}
                              className="flex w-full items-start gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                            >
                              <k.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span className="min-w-0">
                                <span className="block text-sm font-medium leading-tight">{k.label}</span>
                                <span className="block truncate text-[11px] text-muted-foreground">{k.description}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          ) : selected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold truncate">{selected.label}</h4>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => setSelectedId(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">{kindDef(selected.kind)?.description}</p>
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  className="mt-1 h-9"
                  value={selected.label}
                  onChange={(e) => patchNode(selected.id, { label: e.target.value })}
                />
              </div>
              {def?.params.map((p) => (
                <div key={p.key}>
                  <Label className="text-xs">{p.label}</Label>
                  <Input
                    className="mt-1 h-9"
                    placeholder={p.placeholder}
                    value={selected.params[p.key] ?? ""}
                    onChange={(e) =>
                      patchNode(selected.id, { params: { ...selected.params, [p.key]: e.target.value } })
                    }
                  />
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-border/60 px-2.5 py-2">
                <span className="text-xs text-muted-foreground">Node enabled</span>
                <Switch
                  checked={!selected.disabled}
                  onCheckedChange={(v) => patchNode(selected.id, { disabled: !v })}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => duplicateNode(selected)}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Duplicate
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-destructive" onClick={() => removeNode(selected.id)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
              <Bot className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">Select a node</p>
              <p className="max-w-[14rem] text-xs text-muted-foreground">
                Click a node to configure it, or use the + port on a node to add the next step.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dry-run output */}
      {testLog && (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold">Test run (dry)</span>
            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => setTestLog(null)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-[11px] text-muted-foreground">{testLog.join("\n")}</pre>
        </div>
      )}
    </div>
  );
}

export default BotFlowEditor;
