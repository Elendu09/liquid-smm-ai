import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  type WheelEvent,
} from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  AlignCenter,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Bell,
  Bot,
  Braces,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  Copy,
  Database,
  Download,
  Edit3,
  Eye,
  FileJson,
  Filter,
  Flag,
  GitBranch,
  Globe2,
  GripVertical,
  HardDrive,
  Heart,
  History,
  Inbox,
  Info,
  Keyboard,
  Layers3,
  LayoutDashboard,
  LayoutGrid,
  Link2,
  ListChecks,
  Loader2,
  Lock,
  Maximize2,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  MousePointer2,
  Network,
  Pause,
  Pencil,
  Play,
  PlayCircle,
  Plus,
  Power,
  Redo2,
  RefreshCw,
  Route,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Split,
  Square,
  Trash2,
  Undo2,
  Upload,
  UserPlus,
  Users,
  Webhook,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BotRule,
  FlowEdge,
  FlowNode,
  FlowNodeType,
} from "@/hooks/useAutomationRules";
import { cn } from "@/lib/utils";
import {
  RESHARE_CAPABILITIES,
  RESHARE_PLATFORM_IDS,
  capabilityFor,
  defaultTransform,
  platformName,
  type ReshareTransform,
} from "@/config/reshare";
import { platforms } from "@/config/platforms";

/*
 * BotFlowEditor is intentionally self-contained. It is a small visual
 * workflow engine for Engage → Bot rules, not a screenshot of an editor. The
 * editor owns the canvas interactions, a catalog of event/action primitives,
 * validation, dry-runs, history, import/export, and the n8n bridge preview.
 *
 * The persisted shape remains FlowNode[] so older rules continue to load. New
 * metadata is optional and therefore safe to store in the existing JSON config
 * column. The renderer does not require a third-party canvas dependency; this
 * keeps the editor quick to load inside the dashboard and makes it usable in
 * guest/demo mode without a backend.
 */

interface ParamDef {
  key: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  help?: string;
  multiline?: boolean;
  kind?: "text" | "number" | "time" | "url" | "select" | "platform" | "json";
  options?: Array<{ value: string; label: string }>;
}

type NodeGroup =
  | "Trigger"
  | "Condition"
  | "Action"
  | "AI"
  | "Flow"
  | "Audience"
  | "Delivery"
  | "Utility";

type NodePort = "input" | "output" | "branch";

interface NodeKindDef {
  kind: string;
  type: FlowNodeType;
  group: NodeGroup;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  params: ParamDef[];
  outputs?: string[];
  risk?: "low" | "medium" | "high";
  platformIds?: string[];
  summarize: (params: Record<string, string>) => string;
  sample?: (params: Record<string, string>) => string;
}

interface ValidationIssue {
  id: string;
  severity: "error" | "warning" | "info";
  nodeId?: string;
  title: string;
  detail: string;
}

interface ActivityEvent {
  id: string;
  at: string;
  kind: "save" | "test" | "edit" | "warning" | "run" | "export";
  message: string;
  detail?: string;
}

interface HistoryEntry {
  flow: FlowNode[];
  label: string;
}

interface TestResult {
  id: string;
  nodeId: string;
  label: string;
  status: "passed" | "skipped" | "waiting" | "failed";
  detail: string;
  duration: number;
}

interface BotFlowEditorProps {
  rule: BotRule;
  onSave: (ruleId: string, flow: FlowNode[]) => void;
  onStatusChange?: (ruleId: string, enabled: boolean) => void;
}

const NODE_WIDTH = 244;
const NODE_HEIGHT = 132;
const GRID = 20;
const COLUMN_GAP = 330;
const ROW_GAP = 50;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.75;
const DEFAULT_CANVAS = { width: 1100, height: 640 };

const GROUPS: NodeGroup[] = [
  "Trigger",
  "Condition",
  "AI",
  "Action",
  "Delivery",
  "Audience",
  "Flow",
  "Utility",
];

const GROUP_META: Record<NodeGroup, { label: string; description: string; color: string; icon: ComponentType<{ className?: string }> }> = {
  Trigger: { label: "Triggers", description: "Start a workflow", color: "text-emerald-500", icon: Zap },
  Condition: { label: "Conditions", description: "Gate the next step", color: "text-amber-500", icon: GitBranch },
  AI: { label: "AI intelligence", description: "Classify or draft", color: "text-violet-500", icon: Sparkles },
  Action: { label: "Engagement", description: "Perform an action", color: "text-primary", icon: Send },
  Delivery: { label: "Cross-channel", description: "Send or reshare", color: "text-pink-500", icon: Network },
  Audience: { label: "Audience", description: "Tag and segment", color: "text-cyan-500", icon: Users },
  Flow: { label: "Flow control", description: "Branch and wait", color: "text-sky-500", icon: Split },
  Utility: { label: "Utilities", description: "Observe and remember", color: "text-slate-500", icon: Settings2 },
};

const TYPE_META: Record<FlowNodeType, { label: string; border: string; tint: string; iconBg: string; port: string }> = {
  trigger: {
    label: "Trigger",
    border: "border-emerald-500/45",
    tint: "bg-emerald-500/[0.035]",
    iconBg: "bg-emerald-500/10 text-emerald-500",
    port: "bg-emerald-500",
  },
  condition: {
    label: "Logic",
    border: "border-amber-500/45",
    tint: "bg-amber-500/[0.035]",
    iconBg: "bg-amber-500/10 text-amber-500",
    port: "bg-amber-500",
  },
  action: {
    label: "Action",
    border: "border-primary/45",
    tint: "bg-primary/[0.035]",
    iconBg: "bg-primary/10 text-primary",
    port: "bg-primary",
  },
};

const PLATFORM_OPTIONS = RESHARE_PLATFORM_IDS.map((id) => ({
  value: id,
  label: platformName(id),
}));

const TONE_OPTIONS = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "concise", label: "Concise" },
  { value: "witty", label: "Witty" },
  { value: "supportive", label: "Supportive" },
];

const SENTIMENT_OPTIONS = [
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negative" },
  { value: "urgent", label: "Urgent" },
];

const RESHARE_TRANSFORMS: Array<{ value: ReshareTransform; label: string }> = [
  { value: "native", label: "Keep native" },
  { value: "adapt", label: "Adapt copy" },
  { value: "shorten", label: "Shorten" },
  { value: "thread", label: "Split thread" },
  { value: "visual", label: "Visual-first" },
];

const PARAM_HELP: Record<string, string> = {
  keyword: "Use a word or short phrase. Matching is case-insensitive.",
  message: "Variables such as {{author}}, {{handle}}, and {{platform}} are supported.",
  caption: "This text becomes the fallback caption if the source has no caption.",
  platform: "Choose the channel that should receive this branch.",
  delay: "The workflow waits before continuing. Use this to keep activity natural.",
  webhook: "Use an HTTPS n8n webhook trigger URL. Credentials stay in n8n.",
};

let uidCounter = 0;

function uid(prefix = "node") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${String(++uidCounter).padStart(3, "0")}`;
}

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function snap(value: number) {
  return Math.round(value / GRID) * GRID;
}

function kindDef(kind: string) {
  return CATALOG.find((definition) => definition.kind === kind);
}

function getNodeSummary(node: FlowNode) {
  return kindDef(node.kind)?.summarize(node.params ?? {}) ?? node.label;
}

function getNodeIcon(node: FlowNode) {
  return kindDef(node.kind)?.icon ?? MousePointer2;
}

function getNodeMeta(node: FlowNode) {
  return TYPE_META[node.type] ?? TYPE_META.action;
}

function platformParam(defaultValue = "instagram"): ParamDef {
  return { key: "platform", label: "Platform", kind: "platform", defaultValue, options: PLATFORM_OPTIONS };
}

function textParam(key: string, label: string, placeholder: string, defaultValue = "", help?: string): ParamDef {
  return { key, label, placeholder, defaultValue, help: help ?? PARAM_HELP[key] };
}

function selectParam(key: string, label: string, options: Array<{ value: string; label: string }>, defaultValue: string): ParamDef {
  return { key, label, kind: "select", options, defaultValue };
}

function makeNode(kind: string, position: { x: number; y: number }, overrides: Partial<FlowNode> = {}): FlowNode {
  const definition = kindDef(kind);
  const params: Record<string, string> = {};
  definition?.params.forEach((parameter) => {
    if (parameter.defaultValue !== undefined) params[parameter.key] = parameter.defaultValue;
  });
  return {
    id: uid(),
    type: definition?.type ?? "action",
    kind,
    label: definition?.label ?? kind,
    params,
    position,
    edges: [],
    ...overrides,
  };
}

function defaultFlow(rule: BotRule): FlowNode[] {
  const trigger = makeNode("new_follower", { x: 80, y: 180 }, {
    label: rule.trigger || "New follower",
  });
  const action = makeNode("send_dm", { x: 80 + COLUMN_GAP, y: 180 }, {
    label: rule.action || "Send welcome DM",
    params: { message: "Thanks for following, {{author}}!" },
  });
  trigger.edges = [{ from: trigger.id, to: action.id }];
  return [trigger, action];
}

function hydrate(flow: FlowNode[] | undefined, rule: BotRule): FlowNode[] {
  if (!flow || flow.length < 2) return defaultFlow(rule);
  const nodes = flow.map((node, index) => ({
    ...node,
    params: node.params ?? {},
    position: node.position ?? { x: 80 + index * COLUMN_GAP, y: 180 },
    edges: node.edges ?? [],
  }));
  const hasEdges = nodes.some((node) => (node.edges?.length ?? 0) > 0);
  if (hasEdges) return nodes;
  return nodes.map((node, index) => ({
    ...node,
    edges: index < nodes.length - 1 ? [{ from: node.id, to: nodes[index + 1].id }] : [],
  }));
}

function cloneFlow(flow: FlowNode[]) {
  return flow.map((node) => ({
    ...node,
    position: node.position ? { ...node.position } : undefined,
    params: { ...node.params },
    edges: node.edges?.map((edge) => ({ ...edge })),
  }));
}

function edgesFor(flow: FlowNode[]) {
  return flow.flatMap((node) => node.edges ?? []);
}

function nodeMap(flow: FlowNode[]) {
  return Object.fromEntries(flow.map((node) => [node.id, node]));
}

function incomingEdges(flow: FlowNode[], id: string) {
  return edgesFor(flow).filter((edge) => edge.to === id);
}

function outgoingEdges(flow: FlowNode[], id: string) {
  return edgesFor(flow).filter((edge) => edge.from === id);
}

function rootNodes(flow: FlowNode[]) {
  const incoming = new Set(edgesFor(flow).map((edge) => edge.to));
  return flow.filter((node) => !incoming.has(node.id));
}

function leaves(flow: FlowNode[]) {
  const outgoing = new Set(edgesFor(flow).map((edge) => edge.from));
  return flow.filter((node) => !outgoing.has(node.id));
}

function boundsFor(flow: FlowNode[]) {
  if (!flow.length) return DEFAULT_CANVAS;
  return flow.reduce(
    (bounds, node) => ({
      width: Math.max(bounds.width, (node.position?.x ?? 0) + NODE_WIDTH + 180),
      height: Math.max(bounds.height, (node.position?.y ?? 0) + NODE_HEIGHT + 180),
    }),
    { ...DEFAULT_CANVAS },
  );
}

function flowStats(flow: FlowNode[]) {
  return {
    nodes: flow.length,
    edges: edgesFor(flow).length,
    triggers: flow.filter((node) => node.type === "trigger").length,
    conditions: flow.filter((node) => node.type === "condition").length,
    actions: flow.filter((node) => node.type === "action").length,
    leaves: leaves(flow).length,
  };
}

function buildValidation(flow: FlowNode[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const map = nodeMap(flow);
  const allEdges = edgesFor(flow);
  const triggers = flow.filter((node) => node.type === "trigger");
  const actions = flow.filter((node) => node.type === "action");

  if (triggers.length === 0) {
    issues.push({ id: "missing-trigger", severity: "error", title: "Add a trigger", detail: "Every bot flow needs an event that starts it." });
  }
  if (actions.length === 0) {
    issues.push({ id: "missing-action", severity: "error", title: "Add an action", detail: "The flow has no outbound action to perform." });
  }
  if (triggers.length > 1) {
    issues.push({ id: "multiple-triggers", severity: "info", title: "Multiple triggers detected", detail: "This editor will test from the first trigger; keep separate rules when the events need different guardrails." });
  }
  flow.forEach((node) => {
    if (ids.has(node.id)) {
      issues.push({ id: `duplicate-${node.id}`, severity: "error", nodeId: node.id, title: "Duplicate node id", detail: "This node cannot be persisted safely until its id is unique." });
    }
    ids.add(node.id);
    if (!node.label.trim()) {
      issues.push({ id: `empty-label-${node.id}`, severity: "warning", nodeId: node.id, title: "Unnamed node", detail: "Give this step a name so run history is readable." });
    }
    const definition = kindDef(node.kind);
    definition?.params.forEach((parameter) => {
      const value = node.params?.[parameter.key]?.trim();
      if (parameter.defaultValue && !value) {
        issues.push({ id: `missing-${node.id}-${parameter.key}`, severity: "warning", nodeId: node.id, title: `${parameter.label} is empty`, detail: `Set ${parameter.label.toLowerCase()} before enabling the rule.` });
      }
    });
  });
  allEdges.forEach((edge) => {
    if (!map[edge.from] || !map[edge.to]) {
      issues.push({ id: `dangling-${edge.from}-${edge.to}`, severity: "error", title: "Dangling connection", detail: "One of the connected nodes no longer exists." });
    }
    if (edge.from === edge.to) {
      issues.push({ id: `loop-${edge.from}`, severity: "warning", nodeId: edge.from, title: "Self-loop detected", detail: "A node cannot connect to itself in a safe automation." });
    }
  });
  flow.filter((node) => node.type === "trigger").forEach((node) => {
    if (outgoingEdges(flow, node.id).length === 0) {
      issues.push({ id: `orphan-trigger-${node.id}`, severity: "warning", nodeId: node.id, title: "Trigger has no next step", detail: "Connect an action or condition to make this trigger useful." });
    }
  });
  flow.filter((node) => node.type === "condition").forEach((node) => {
    if (outgoingEdges(flow, node.id).length < 2 && node.kind !== "time_window") {
      issues.push({ id: `single-branch-${node.id}`, severity: "info", nodeId: node.id, title: "Condition has one branch", detail: "Add a second branch when you need a true and false path." });
    }
  });
  const highRisk = flow.filter((node) => kindDef(node.kind)?.risk === "high");
  if (highRisk.length > 0 && !flow.some((node) => node.kind === "approval_gate")) {
    issues.push({ id: "missing-approval", severity: "warning", title: "Consider an approval gate", detail: "High-volume or outbound actions are safer with a human approval step." });
  }
  if (flow.some((node) => node.kind === "reshare_content") && !flow.some((node) => node.kind === "rate_limit")) {
    issues.push({ id: "reshare-rate-limit", severity: "info", title: "Add a delivery limit", detail: "Cross-platform reshare flows work best with a rate limit between branches." });
  }
  if (issues.length === 0) {
    issues.push({ id: "healthy", severity: "info", title: "Flow is ready", detail: "All nodes are connected and the required trigger/action pair is present." });
  }
  return issues;
}

function layoutFlow(flow: FlowNode[]) {
  const map = nodeMap(flow);
  const roots = rootNodes(flow);
  const levels = new Map<string, number>();
  const queue = roots.map((node) => ({ id: node.id, level: 0 }));
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if ((levels.get(current.id) ?? -1) >= current.level) continue;
    levels.set(current.id, current.level);
    (map[current.id]?.edges ?? []).forEach((edge) => queue.push({ id: edge.to, level: current.level + 1 }));
  }
  flow.forEach((node) => {
    if (!levels.has(node.id)) levels.set(node.id, 0);
  });
  const rows = new Map<number, number>();
  return flow.map((node) => {
    const level = levels.get(node.id) ?? 0;
    const row = rows.get(level) ?? 0;
    rows.set(level, row + 1);
    return {
      ...node,
      position: {
        x: 80 + level * COLUMN_GAP,
        y: 90 + row * (NODE_HEIGHT + ROW_GAP),
      },
    };
  });
}

function n8nTypeFor(node: FlowNode) {
  if (node.type === "trigger") return "n8n-nodes-base.webhook";
  if (node.type === "condition") return "n8n-nodes-base.if";
  if (node.kind === "ai_reply" || node.kind === "ai_classify") return "n8n-nodes-base.openAi";
  if (node.kind === "reshare_content" || node.kind === "send_webhook") return "n8n-nodes-base.httpRequest";
  return "n8n-nodes-base.code";
}

function toN8nDocument(rule: BotRule, flow: FlowNode[], webhookUrl: string) {
  const map = nodeMap(flow);
  const nodes = flow.map((node, index) => ({
    parameters: {
      ...node.params,
      webhookUrl: index === 0 ? webhookUrl : undefined,
      note: getNodeSummary(node),
    },
    id: node.id,
    name: node.label,
    type: n8nTypeFor(node),
    typeVersion: 2,
    position: [node.position?.x ?? index * COLUMN_GAP, node.position?.y ?? 120],
  }));
  const connections: Record<string, { main: Array<Array<{ node: string; type: string; index: number }>> }> = {};
  flow.forEach((node) => {
    const outgoing = (node.edges ?? []).map((edge) => ({
      node: map[edge.to]?.label ?? edge.to,
      type: "main",
      index: 0,
    }));
    if (outgoing.length > 0) {
      connections[node.label] = { main: [outgoing] };
    }
  });
  return {
    name: `SMMSAAS · ${rule.name}`,
    nodes,
    connections,
    active: false,
    settings: { executionOrder: "v1", saveExecutionProgress: true },
    tags: [{ name: "smmsaas" }, { name: "engage-bot" }],
    meta: { source: "smmsaas-bot-flow-editor", generatedAt: new Date().toISOString() },
  };
}

function nodeOutputLabel(node: FlowNode, index: number) {
  const definition = kindDef(node.kind);
  if (definition?.outputs?.[index]) return definition.outputs[index];
  return index === 0 ? "Continue" : `Branch ${index + 1}`;
}

function hasNode(flow: FlowNode[], kind: string) {
  return flow.some((node) => node.kind === kind);
}

function findNext(flow: FlowNode[], nodeId: string) {
  const map = nodeMap(flow);
  return outgoingEdges(flow, nodeId).map((edge) => map[edge.to]).filter(Boolean);
}

function walkFlow(flow: FlowNode[], startId?: string) {
  const map = nodeMap(flow);
  const start = (startId && map[startId]) || rootNodes(flow)[0] || flow[0];
  const visited = new Set<string>();
  const ordered: FlowNode[] = [];
  const visit = (node?: FlowNode) => {
    if (!node || visited.has(node.id)) return;
    visited.add(node.id);
    ordered.push(node);
    (node.edges ?? []).forEach((edge) => visit(map[edge.to]));
  };
  visit(start);
  flow.forEach((node) => visit(node));
  return ordered;
}

function createTestResults(flow: FlowNode[], startId?: string): TestResult[] {
  return walkFlow(flow, startId).map((node, index) => {
    const definition = kindDef(node.kind);
    const status: TestResult["status"] = node.disabled ? "skipped" : definition?.risk === "high" ? "waiting" : "passed";
    return {
      id: `test-${node.id}`,
      nodeId: node.id,
      label: node.label,
      status,
      detail: node.disabled ? "Node disabled — step skipped." : status === "waiting" ? "Waiting for approval or live credentials." : getNodeSummary(node),
      duration: Math.max(18, 42 + index * 17),
    };
  });
}

/* ------------------------------------------------------------------------- */
/* Node catalog.                                                             */
/* ------------------------------------------------------------------------- */

const CATALOG: NodeKindDef[] = [
  {
    kind: "new_follower",
    type: "trigger",
    group: "Trigger",
    label: "New follower",
    description: "Start when a profile follows a connected account.",
    icon: UserPlus,
    params: [],
    summarize: () => "When someone follows a connected account",
    sample: () => "Follower event received",
  },
  {
    kind: "new_comment",
    type: "trigger",
    group: "Trigger",
    label: "New comment",
    description: "Start when a new comment arrives on a post.",
    icon: MessageSquare,
    params: [],
    summarize: () => "When a new comment arrives",
    sample: () => "Comment event received",
  },
  {
    kind: "new_dm",
    type: "trigger",
    group: "Trigger",
    label: "New DM",
    description: "Start when a direct message arrives.",
    icon: MessageCircle,
    params: [],
    summarize: () => "When a direct message arrives",
    sample: () => "DM event received",
  },
  {
    kind: "new_mention",
    type: "trigger",
    group: "Trigger",
    label: "New mention",
    description: "Start when an account is mentioned in a post or story.",
    icon: AtSignIcon,
    params: [],
    summarize: () => "When a connected account is mentioned",
    sample: () => "Mention event received",
  },
  {
    kind: "hashtag_match",
    type: "trigger",
    group: "Trigger",
    label: "Hashtag match",
    description: "Start when a source post contains a target hashtag.",
    icon: HashIcon,
    params: [textParam("hashtag", "Hashtag", "photography", "photography")],
    summarize: (params) => `When a post uses #${params.hashtag || "…"}`,
    sample: (params) => `Hashtag #${params.hashtag || "…"} found`,
  },
  {
    kind: "keyword_match",
    type: "trigger",
    group: "Trigger",
    label: "Keyword match",
    description: "Start when text contains a keyword or phrase.",
    icon: Search,
    params: [textParam("keyword", "Keyword", "price", "price")],
    summarize: (params) => `When text contains “${params.keyword || "…"}”`,
    sample: (params) => `Keyword “${params.keyword || "…"}” found`,
  },
  {
    kind: "post_published",
    type: "trigger",
    group: "Trigger",
    label: "Post published",
    description: "Start after a post is published on a connected channel.",
    icon: Send,
    params: [platformParam("instagram")],
    summarize: (params) => `When a ${platformName(params.platform || "instagram")} post publishes`,
    sample: (params) => `${platformName(params.platform || "instagram")} post published`,
  },
  {
    kind: "post_scheduled",
    type: "trigger",
    group: "Trigger",
    label: "Post scheduled",
    description: "Start when a post enters the publishing queue.",
    icon: Clock3,
    params: [],
    summarize: () => "When a post enters the queue",
    sample: () => "Scheduled post event received",
  },
  {
    kind: "rss_item",
    type: "trigger",
    group: "Trigger",
    label: "New RSS item",
    description: "Start when an RSS feed returns a new item.",
    icon: RefreshCw,
    params: [textParam("feed", "Feed URL", "https://example.com/feed.xml", "", "Only new items are emitted once.")],
    summarize: (params) => `When ${params.feed || "an RSS feed"} has a new item`,
    sample: () => "RSS item received",
  },
  {
    kind: "webhook_trigger",
    type: "trigger",
    group: "Trigger",
    label: "n8n webhook",
    description: "Start from an external n8n or HTTPS workflow event.",
    icon: Webhook,
    params: [textParam("webhook", "Webhook URL", "https://n8n.example.com/webhook/…", "", PARAM_HELP.webhook)],
    summarize: (params) => `When n8n calls ${params.webhook || "the webhook"}`,
    sample: () => "Webhook payload received",
  },
  {
    kind: "time_trigger",
    type: "trigger",
    group: "Trigger",
    label: "Schedule",
    description: "Start on a recurring time pattern.",
    icon: Clock3,
    params: [
      selectParam("frequency", "Frequency", [{ value: "hourly", label: "Hourly" }, { value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }], "daily"),
      textParam("time", "Time", "09:00", "09:00"),
    ],
    summarize: (params) => `Runs ${params.frequency || "daily"} at ${params.time || "09:00"}`,
    sample: (params) => `Schedule window ${params.time || "09:00"}`,
  },
  {
    kind: "platform_is",
    type: "condition",
    group: "Condition",
    label: "Platform is",
    description: "Continue only if the event came from one network.",
    icon: Globe2,
    params: [platformParam("instagram")],
    outputs: ["Match", "No match"],
    summarize: (params) => `Platform is ${platformName(params.platform || "instagram")}`,
    sample: (params) => `Platform matches ${platformName(params.platform || "instagram")}`,
  },
  {
    kind: "engagement_above",
    type: "condition",
    group: "Condition",
    label: "Engagement above",
    description: "Gate high-performing posts or conversations.",
    icon: Activity,
    params: [textParam("threshold", "Minimum engagement", "50", "50")],
    outputs: ["Above threshold", "Below threshold"],
    summarize: (params) => `Engagement ≥ ${params.threshold || "…"}`,
    sample: (params) => `Engagement score ${params.threshold || "50"}+`,
  },
  {
    kind: "contains_keyword",
    type: "condition",
    group: "Condition",
    label: "Contains keyword",
    description: "Branch when the message or caption contains a phrase.",
    icon: Search,
    params: [textParam("keyword", "Keyword", "sale", "sale")],
    outputs: ["Contains", "Does not contain"],
    summarize: (params) => `Contains “${params.keyword || "…"}”`,
    sample: (params) => `Text contains “${params.keyword || "…"}”`,
  },
  {
    kind: "sentiment_is",
    type: "condition",
    group: "Condition",
    label: "Sentiment is",
    description: "Route positive, neutral, negative, or urgent messages.",
    icon: SlidersHorizontal,
    params: [selectParam("sentiment", "Sentiment", SENTIMENT_OPTIONS, "negative")],
    outputs: ["Match", "Other sentiment"],
    summarize: (params) => `Sentiment is ${params.sentiment || "negative"}`,
    sample: (params) => `Classified as ${params.sentiment || "negative"}`,
  },
  {
    kind: "account_is",
    type: "condition",
    group: "Condition",
    label: "Account is",
    description: "Continue only for a specific connected account.",
    icon: Users,
    params: [textParam("account", "Account handle", "@brand", "@brand")],
    outputs: ["Match", "No match"],
    summarize: (params) => `Account is ${params.account || "…"}`,
    sample: (params) => `Account matched ${params.account || "…"}`,
  },
  {
    kind: "audience_is",
    type: "condition",
    group: "Audience",
    label: "Audience segment",
    description: "Gate actions for a saved audience segment.",
    icon: Users,
    params: [textParam("segment", "Segment", "High-intent leads", "High-intent leads")],
    outputs: ["In segment", "Not in segment"],
    summarize: (params) => `Audience is ${params.segment || "…"}`,
    sample: (params) => `Matched segment ${params.segment || "…"}`,
  },
  {
    kind: "time_window",
    type: "condition",
    group: "Flow",
    label: "Time window",
    description: "Run only during a defined local-time window.",
    icon: Clock3,
    params: [textParam("from", "From", "09:00", "09:00"), textParam("to", "To", "21:00", "21:00")],
    outputs: ["Inside window", "Outside window"],
    summarize: (params) => `Runs ${params.from || "…"}–${params.to || "…"}`,
    sample: (params) => `Local time inside ${params.from || "09:00"}–${params.to || "21:00"}`,
  },
  {
    kind: "has_media",
    type: "condition",
    group: "Condition",
    label: "Has media",
    description: "Branch when the source event includes an image or video.",
    icon: LayoutGrid,
    params: [],
    outputs: ["Media found", "Text only"],
    summarize: () => "Source includes media",
    sample: () => "Media attachment detected",
  },
  {
    kind: "rate_limit",
    type: "condition",
    group: "Flow",
    label: "Rate limit",
    description: "Pause or skip when a channel has reached its safety budget.",
    icon: ShieldCheck,
    params: [textParam("limit", "Max actions", "40", "40"), textParam("window", "Window (minutes)", "60", "60")],
    outputs: ["Under limit", "At limit"],
    summarize: (params) => `Max ${params.limit || "…"} actions / ${params.window || "…"}m`,
    sample: (params) => `Budget available: ${params.limit || "40"} actions`,
  },
  {
    kind: "ai_classify",
    type: "condition",
    group: "AI",
    label: "AI classify",
    description: "Classify intent, sentiment, or buying stage before branching.",
    icon: Sparkles,
    params: [selectParam("classification", "Classification", [{ value: "intent", label: "Intent" }, { value: "sentiment", label: "Sentiment" }, { value: "lead_stage", label: "Lead stage" }], "intent"), textParam("labels", "Labels", "sales, support, spam", "sales, support, spam")],
    outputs: ["Match", "Other"],
    summarize: (params) => `AI ${params.classification || "intent"}: ${params.labels || "…"}`,
    sample: (params) => `AI classified ${params.classification || "intent"}`,
  },
  {
    kind: "ai_reply",
    type: "action",
    group: "AI",
    label: "AI reply",
    description: "Draft a channel-aware reply with your selected tone.",
    icon: Sparkles,
    params: [selectParam("tone", "Tone", TONE_OPTIONS, "friendly"), textParam("guardrail", "Guardrail", "Never promise a refund", "Never promise a refund", "Extra instruction passed to the reply model.")],
    risk: "medium",
    summarize: (params) => `AI reply · ${params.tone || "friendly"}`,
    sample: (params) => `Drafted a ${params.tone || "friendly"} reply`,
  },
  {
    kind: "ai_extract",
    type: "action",
    group: "AI",
    label: "AI extract fields",
    description: "Extract structured fields such as budget, product, or location.",
    icon: Braces,
    params: [textParam("fields", "Fields", "budget, product, location", "budget, product, location")],
    summarize: (params) => `Extract ${params.fields || "…"}`,
    sample: (params) => `Extracted ${params.fields || "requested fields"}`,
  },
  {
    kind: "send_dm",
    type: "action",
    group: "Action",
    label: "Send DM",
    description: "Send a private message on a supported channel.",
    icon: MessageCircle,
    params: [textParam("message", "Message", "Thanks for reaching out, {{author}}!", "Thanks for reaching out, {{author}}!", PARAM_HELP.message)],
    risk: "medium",
    summarize: (params) => `Send DM: “${(params.message || "…").slice(0, 44)}”`,
    sample: (params) => `Would send: ${(params.message || "…").slice(0, 54)}`,
  },
  {
    kind: "reply_comment",
    type: "action",
    group: "Action",
    label: "Reply to comment",
    description: "Post a public reply to the triggering comment.",
    icon: MessageSquare,
    params: [textParam("message", "Reply", "Thanks for sharing this!", "Thanks for sharing this!", PARAM_HELP.message)],
    risk: "medium",
    summarize: (params) => `Reply: “${(params.message || "…").slice(0, 44)}”`,
    sample: (params) => `Would reply: ${(params.message || "…").slice(0, 54)}`,
  },
  {
    kind: "like_post",
    type: "action",
    group: "Action",
    label: "Like post",
    description: "Like or heart the triggering post when the network supports it.",
    icon: Heart,
    params: [],
    summarize: () => "Like the triggering post",
    sample: () => "Would like source post",
  },
  {
    kind: "follow_back",
    type: "action",
    group: "Action",
    label: "Follow back",
    description: "Follow the account back where the API allows it.",
    icon: UserPlus,
    params: [],
    risk: "high",
    summarize: () => "Follow the account back",
    sample: () => "Would follow account",
  },
  {
    kind: "notify",
    type: "action",
    group: "Action",
    label: "Notify me",
    description: "Create an in-app notification for your team.",
    icon: Bell,
    params: [textParam("message", "Notification", "New high-value lead", "New high-value lead")],
    summarize: (params) => `Notify: ${params.message || "…"}`,
    sample: (params) => `Notification: ${params.message || "…"}`,
  },
  {
    kind: "save_reply",
    type: "action",
    group: "Utility",
    label: "Save reply",
    description: "Save the draft in the approval queue instead of sending it.",
    icon: Inbox,
    params: [textParam("queue", "Queue", "Support review", "Support review")],
    summarize: (params) => `Save draft to ${params.queue || "approval queue"}`,
    sample: (params) => `Draft queued in ${params.queue || "approval queue"}`,
  },
  {
    kind: "add_tag",
    type: "action",
    group: "Audience",
    label: "Add audience tag",
    description: "Apply a tag to the person or source content.",
    icon: Flag,
    params: [textParam("tag", "Tag", "high-intent", "high-intent")],
    summarize: (params) => `Add tag #${params.tag || "…"}`,
    sample: (params) => `Tag applied: #${params.tag || "…"}`,
  },
  {
    kind: "add_segment",
    type: "action",
    group: "Audience",
    label: "Add to segment",
    description: "Place the contact into a saved audience segment.",
    icon: Users,
    params: [textParam("segment", "Segment", "Warm leads", "Warm leads")],
    summarize: (params) => `Add to ${params.segment || "…"}`,
    sample: (params) => `Contact added to ${params.segment || "…"}`,
  },
  {
    kind: "schedule_post",
    type: "action",
    group: "Delivery",
    label: "Schedule post",
    description: "Queue an adapted post for a connected account.",
    icon: Clock3,
    params: [platformParam("instagram"), textParam("caption", "Caption", "A new post from the team", "A new post from the team", PARAM_HELP.caption), textParam("delay", "Delay (minutes)", "30", "30")],
    risk: "medium",
    summarize: (params) => `Schedule on ${platformName(params.platform || "instagram")} in ${params.delay || "0"}m`,
    sample: (params) => `Post queued for ${platformName(params.platform || "instagram")}`,
  },
  {
    kind: "reshare_content",
    type: "action",
    group: "Delivery",
    label: "Reshare content",
    description: "Adapt a source post and fan it out to every selected social destination.",
    icon: Network,
    params: [textParam("destinations", "Destinations", "tiktok, youtube, linkedin", "tiktok, youtube, linkedin", "Use comma-separated platform ids."), selectParam("transform", "Transform", RESHARE_TRANSFORMS, "adapt"), textParam("delay", "Stagger (minutes)", "15", "15")],
    risk: "medium",
    summarize: (params) => `Reshare to ${(params.destinations || "…").split(",").slice(0, 3).join(", ")}`,
    sample: (params) => `Prepared ${Math.max(1, (params.destinations || "").split(",").filter(Boolean).length)} destination drafts`,
  },
  {
    kind: "send_webhook",
    type: "action",
    group: "Delivery",
    label: "Send to n8n",
    description: "Post a normalized event to an n8n webhook for custom orchestration.",
    icon: Webhook,
    params: [textParam("webhook", "Webhook URL", "https://n8n.example.com/webhook/reshare", "", PARAM_HELP.webhook), textParam("event", "Event name", "smmsaas.engagement", "smmsaas.engagement")],
    risk: "medium",
    summarize: (params) => `POST ${params.webhook || "n8n webhook"}`,
    sample: (params) => `Webhook payload ${params.event || "smmsaas.engagement"} emitted`,
  },
  {
    kind: "publish_cross_platform",
    type: "action",
    group: "Delivery",
    label: "Publish to channels",
    description: "Publish the current payload to a selected group of channels.",
    icon: Globe2,
    params: [textParam("channels", "Channels", "instagram, facebook", "instagram, facebook"), selectParam("mode", "Mode", [{ value: "now", label: "Publish now" }, { value: "queue", label: "Queue" }, { value: "approval", label: "Approval" }], "approval")],
    risk: "high",
    summarize: (params) => `Publish to ${(params.channels || "…").split(",").slice(0, 3).join(", ")}`,
    sample: (params) => `Prepared channel delivery: ${params.mode || "approval"}`,
  },
  {
    kind: "approval_gate",
    type: "condition",
    group: "Flow",
    label: "Approval gate",
    description: "Pause the flow until a teammate approves the next action.",
    icon: BadgeCheck,
    params: [textParam("approver", "Approver", "Content team", "Content team"), textParam("timeout", "Expires after (hours)", "24", "24")],
    outputs: ["Approved", "Expired"],
    summarize: (params) => `Wait for ${params.approver || "approval"}`,
    sample: (params) => `Approval requested from ${params.approver || "team"}`,
  },
  {
    kind: "split_paths",
    type: "condition",
    group: "Flow",
    label: "Split paths",
    description: "Create multiple branches from the same event.",
    icon: Split,
    params: [textParam("paths", "Path labels", "Sales, Support, Other", "Sales, Support, Other")],
    outputs: ["Path A", "Path B", "Path C"],
    summarize: (params) => `Split into ${(params.paths || "3 paths").split(",").length} paths`,
    sample: () => "Branch router evaluated",
  },
  {
    kind: "delay",
    type: "action",
    group: "Flow",
    label: "Wait",
    description: "Wait before the next action or branch.",
    icon: Pause,
    params: [textParam("delay", "Wait (minutes)", "15", "15")],
    summarize: (params) => `Wait ${params.delay || "…"} minutes`,
    sample: (params) => `Timer scheduled for ${params.delay || "…"} minutes`,
  },
  {
    kind: "dedupe",
    type: "condition",
    group: "Flow",
    label: "Prevent duplicates",
    description: "Skip an event when the same content was already processed.",
    icon: Copy,
    params: [textParam("window", "Lookback (hours)", "24", "24")],
    outputs: ["New", "Duplicate"],
    summarize: (params) => `Deduplicate over ${params.window || "…"}h`,
    sample: () => "No duplicate found",
  },
  {
    kind: "stop_flow",
    type: "action",
    group: "Flow",
    label: "Stop flow",
    description: "End this branch without performing another action.",
    icon: Square,
    params: [textParam("reason", "Reason", "Guardrail matched", "Guardrail matched")],
    summarize: (params) => `Stop: ${params.reason || "…"}`,
    sample: (params) => `Branch stopped: ${params.reason || "guardrail"}`,
  },
  {
    kind: "log_event",
    type: "action",
    group: "Utility",
    label: "Write activity log",
    description: "Record a structured event in Activity for later inspection.",
    icon: ListChecks,
    params: [textParam("event", "Event label", "Bot action completed", "Bot action completed"), textParam("metadata", "Metadata JSON", "{\"source\": \"comment\"}", "{\"source\": \"comment\"}")],
    summarize: (params) => `Log ${params.event || "event"}`,
    sample: (params) => `Activity log: ${params.event || "event"}`,
  },
  {
    kind: "remember",
    type: "action",
    group: "Utility",
    label: "Remember context",
    description: "Store a lightweight fact for future replies.",
    icon: Database,
    params: [textParam("key", "Memory key", "preferred_plan", "preferred_plan"), textParam("value", "Value", "{{message}}", "{{message}}")],
    summarize: (params) => `Remember ${params.key || "context"}`,
    sample: (params) => `Context saved as ${params.key || "memory"}`,
  },
  {
    kind: "get_profile",
    type: "action",
    group: "Utility",
    label: "Fetch profile",
    description: "Load profile details before making a decision.",
    icon: HardDrive,
    params: [],
    summarize: () => "Fetch profile context",
    sample: () => "Profile context loaded",
  },
  {
    kind: "approval_notification",
    type: "action",
    group: "Utility",
    label: "Notify approvers",
    description: "Send an approval request to the selected team channel.",
    icon: Bell,
    params: [textParam("channel", "Team channel", "#content-review", "#content-review"), textParam("message", "Message", "A post is ready for approval", "A post is ready for approval")],
    summarize: (params) => `Notify ${params.channel || "approvers"}`,
    sample: (params) => `Approval notification sent to ${params.channel || "team"}`,
  },
];

/* Small icons kept separate so the catalog remains data-first and readable. */
function AtSignIcon({ className }: { className?: string }) {
  return <span className={cn("inline-flex items-center justify-center font-semibold", className)}>@</span>;
}

function HashIcon({ className }: { className?: string }) {
  return <span className={cn("inline-flex items-center justify-center font-semibold", className)}>#</span>;
}

/* ------------------------------------------------------------------------- */
/* Small visual primitives.                                                  */
/* ------------------------------------------------------------------------- */

function TypeChip({ type, compact = false }: { type: FlowNodeType; compact?: boolean }) {
  const meta = TYPE_META[type];
  return <span className={cn("inline-flex items-center rounded-full font-semibold uppercase tracking-[0.13em]", compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[9px]", meta.iconBg)}>{meta.label}</span>;
}

function RiskChip({ risk }: { risk?: NodeKindDef["risk"] }) {
  if (!risk || risk === "low") return null;
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider", risk === "high" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500")}><ShieldCheck className="h-2.5 w-2.5" /> {risk} risk</span>;
}

function IconBox({ node, size = "md" }: { node: FlowNode; size?: "sm" | "md" | "lg" }) {
  const Icon = getNodeIcon(node);
  const meta = getNodeMeta(node);
  return <div className={cn("grid shrink-0 place-items-center rounded-xl", meta.iconBg, size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-9 w-9")}><Icon className={size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4"} /></div>;
}

function SectionHeading({ icon: Icon, title, description, action }: { icon: ComponentType<{ className?: string }>; title: string; description?: string; action?: ReactNode }) {
  return <div className="flex items-start justify-between gap-3"><div className="flex gap-2.5"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><div><p className="text-xs font-semibold">{title}</p>{description && <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{description}</p>}</div></div>{action}</div>;
}

function ToolbarIconButton({ icon: Icon, label, onClick, active = false, disabled = false }: { icon: ComponentType<{ className?: string }>; label: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return <Button type="button" variant="ghost" size="icon" className={cn("h-8 w-8 rounded-lg", active && "bg-primary/10 text-primary", disabled && "opacity-50")} onClick={onClick} disabled={disabled} title={label} aria-label={label}><Icon className="h-3.5 w-3.5" /></Button>;
}

function StatPill({ label, value, tone = "text-foreground", icon: Icon }: { label: string; value: string | number; tone?: string; icon?: ComponentType<{ className?: string }> }) {
  return <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/50 px-2.5 py-1.5">{Icon && <Icon className={cn("h-3 w-3", tone)} />}<span className="text-[10px] text-muted-foreground">{label}</span><span className={cn("text-[11px] font-semibold tabular-nums", tone)}>{value}</span></div>;
}

function EmptyRail({ title, detail, icon: Icon }: { title: string; detail: string; icon: ComponentType<{ className?: string }> }) {
  return <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-5 text-center"><Icon className="h-6 w-6 text-muted-foreground" /><p className="mt-2 text-xs font-semibold">{title}</p><p className="mt-1 max-w-[14rem] text-[10px] leading-relaxed text-muted-foreground">{detail}</p></div>;
}

function GroupLabel({ group, count }: { group: NodeGroup; count: number }) {
  const meta = GROUP_META[group];
  const Icon = meta.icon;
  return <div className="flex items-center justify-between px-1"><div className={cn("flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.16em]", meta.color)}><Icon className="h-3 w-3" /> {meta.label}</div><span className="text-[9px] tabular-nums text-muted-foreground">{count}</span></div>;
}

function CatalogItem({ definition, onAdd }: { definition: NodeKindDef; onAdd: () => void }) {
  const meta = GROUP_META[definition.group];
  const Icon = definition.icon;
  return <button type="button" onClick={onAdd} className="group flex w-full items-start gap-2 rounded-xl border border-transparent p-2 text-left transition-all hover:border-primary/25 hover:bg-primary/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted/70", meta.color)}><Icon className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{definition.label}</span><span className="mt-0.5 block line-clamp-2 text-[9px] leading-relaxed text-muted-foreground">{definition.description}</span></span><Plus className="mt-1 h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" /></button>;
}

function NodeCard({
  node,
  selected,
  connecting,
  onPointerDown,
  onSelect,
  onSourceClick,
  onTargetClick,
  onAdd,
  onMenu,
}: {
  node: FlowNode;
  selected: boolean;
  connecting: boolean;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onSelect: () => void;
  onSourceClick: () => void;
  onTargetClick: () => void;
  onAdd: () => void;
  onMenu: () => void;
}) {
  const definition = kindDef(node.kind);
  const meta = getNodeMeta(node);
  const outgoing = node.edges?.length ?? 0;
  const disabled = Boolean(node.disabled);
  const style: CSSProperties = {
    left: node.position?.x ?? 0,
    top: node.position?.y ?? 0,
    width: NODE_WIDTH,
    minHeight: NODE_HEIGHT,
  };
  return <div className={cn("absolute select-none rounded-2xl border bg-card/95 shadow-lg shadow-slate-950/[0.04] backdrop-blur-xl transition-[box-shadow,opacity,border-color]", meta.border, meta.tint, selected && "z-20 border-primary/70 shadow-[0_16px_40px_-18px_hsl(var(--primary)/0.55)] ring-2 ring-primary/25", connecting && "ring-2 ring-pink-500/40", disabled && "opacity-50")} style={style} onPointerDown={onPointerDown} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
    <button type="button" aria-label={`Connect into ${node.label}`} title="Connect into this node" className="absolute -left-2 top-1/2 z-20 grid h-4 w-4 -translate-y-1/2 place-items-center rounded-full border-2 border-background bg-muted-foreground/70 text-background hover:scale-110" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onTargetClick(); }}><span className="h-1 w-1 rounded-full bg-background" /></button>
    <div className="flex items-start gap-2.5 p-3 pb-2.5"><IconBox node={node} /><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><TypeChip type={node.type} compact /><RiskChip risk={definition?.risk} /></div><p className="mt-1 truncate text-xs font-semibold">{node.label}</p></div><button type="button" title="Node options" aria-label="Node options" className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onMenu(); }}><MoreHorizontal className="h-3.5 w-3.5" /></button></div>
    <div className="px-3 pb-3"><p className="line-clamp-2 min-h-[2rem] text-[10px] leading-relaxed text-muted-foreground">{getNodeSummary(node)}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground"><Activity className="h-2.5 w-2.5" /> {node.lastRunAt ? "Ran recently" : "Not run yet"}</span><span className="text-[9px] tabular-nums text-muted-foreground">{outgoing} {outgoing === 1 ? "path" : "paths"}</span></div></div>
    <button type="button" title="Add step after this node" aria-label="Add step after this node" className={cn("absolute -right-2.5 top-1/2 z-20 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border-2 border-background text-primary-foreground shadow-sm transition-transform hover:scale-110", meta.port)} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onAdd(); }}><Plus className="h-3 w-3" /></button>
    <button type="button" title="Start connection from this node" aria-label="Start connection from this node" className={cn("absolute -bottom-2 left-1/2 z-20 grid h-4 w-4 -translate-x-1/2 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground transition-transform hover:scale-110", connecting && "bg-pink-500")} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onSourceClick(); }}><ArrowDown className="h-2.5 w-2.5" /></button>
  </div>;
}

function MiniMap({ flow, selectedId, onSelect }: { flow: FlowNode[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const bounds = boundsFor(flow);
  return <div className="absolute bottom-3 right-3 z-30 w-44 rounded-xl border border-border/70 bg-card/90 p-2 shadow-lg backdrop-blur-xl"><div className="mb-1.5 flex items-center justify-between"><span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Map</span><Layers3 className="h-3 w-3 text-muted-foreground" /></div><div className="relative h-24 overflow-hidden rounded-lg border border-border/50 bg-muted/30"><div className="absolute left-0 top-0 origin-top-left" style={{ transform: "scale(0.14)", width: bounds.width, height: bounds.height }}>{flow.map((node) => <button key={node.id} type="button" aria-label={`Focus ${node.label}`} onClick={() => onSelect(node.id)} className={cn("absolute rounded-md border", getNodeMeta(node).border, node.id === selectedId ? "bg-primary" : "bg-card")} style={{ left: node.position?.x ?? 0, top: node.position?.y ?? 0, width: NODE_WIDTH, height: NODE_HEIGHT }} />)}</div></div></div>;
}

function CanvasLegend() {
  return <div className="absolute bottom-3 left-3 z-30 flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-card/90 px-2.5 py-2 text-[9px] shadow-lg backdrop-blur-xl"><span className="font-semibold text-muted-foreground">Flow legend</span><span className="h-2 w-2 rounded-full bg-emerald-500" /> trigger<span className="h-2 w-2 rounded-full bg-amber-500" /> logic<span className="h-2 w-2 rounded-full bg-primary" /> action</div>;
}

function ConnectionLines({ flow, map, zoom, onSelectEdge }: { flow: FlowNode[]; map: Record<string, FlowNode>; zoom: number; onSelectEdge?: (edge: FlowEdge) => void }) {
  const bounds = boundsFor(flow);
  const allEdges = edgesFor(flow);
  return <svg className="pointer-events-auto absolute left-0 top-0" width={bounds.width} height={bounds.height} style={{ overflow: "visible" }}><defs><linearGradient id="flow-edge-gradient" x1="0" x2="1"><stop offset="0%" stopColor="hsl(var(--primary) / .25)" /><stop offset="55%" stopColor="hsl(var(--primary) / .85)" /><stop offset="100%" stopColor="hsl(var(--brand-cyan) / .7)" /></linearGradient><marker id="flow-arrow-head" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="hsl(var(--primary) / .75)" /></marker></defs>{allEdges.map((edge) => { const from = map[edge.from]; const to = map[edge.to]; if (!from || !to) return null; const x1 = (from.position?.x ?? 0) + NODE_WIDTH; const y1 = (from.position?.y ?? 0) + NODE_HEIGHT / 2; const x2 = to.position?.x ?? 0; const y2 = (to.position?.y ?? 0) + NODE_HEIGHT / 2; const direction = x2 >= x1; const dx = direction ? Math.max(70, (x2 - x1) / 2) : 95; const d = direction ? `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}` : `M ${x1} ${y1} C ${x1 + dx} ${y1 - 80}, ${x2 - dx} ${y2 + 80}, ${x2} ${y2}`; const labelX = (x1 + x2) / 2; const labelY = (y1 + y2) / 2 - 7; return <g key={`${edge.from}-${edge.to}-${edge.branch ?? "main"}`}><path d={d} stroke="transparent" strokeWidth={14 / Math.max(zoom, .5)} fill="none" onClick={(event) => { event.stopPropagation(); onSelectEdge?.(edge); }} /><path d={d} stroke="url(#flow-edge-gradient)" strokeWidth={2.2} fill="none" strokeDasharray={edge.branch ? "6 4" : undefined} markerEnd="url(#flow-arrow-head)" className="transition-opacity" />{edge.branch && <g><rect x={labelX - 24} y={labelY - 8} width={48} height={16} rx={8} fill="hsl(var(--card) / .95)" stroke="hsl(var(--border) / .7)" /><text x={labelX} y={labelY + 3} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{edge.branch}</text></g>}</g>; })}</svg>;
}

/* ------------------------------------------------------------------------- */
/* Inspector and supporting panels.                                          */
/* ------------------------------------------------------------------------- */

function Field({ parameter, value, onChange }: { parameter: ParamDef; value: string; onChange: (value: string) => void }) {
  const help = parameter.help ?? PARAM_HELP[parameter.key];
  return <div className="space-y-1.5"><Label className="text-[10px] font-semibold">{parameter.label}</Label>{parameter.kind === "select" || parameter.kind === "platform" ? <Select value={value || parameter.defaultValue || ""} onValueChange={onChange}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder={parameter.placeholder ?? `Choose ${parameter.label.toLowerCase()}`} /></SelectTrigger><SelectContent>{(parameter.options ?? []).map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select> : parameter.multiline || parameter.kind === "json" ? <Textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={parameter.placeholder} rows={3} className="resize-none text-xs" /> : <Input type={parameter.kind === "number" ? "number" : parameter.kind === "url" ? "url" : parameter.kind === "time" ? "time" : "text"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={parameter.placeholder} className="h-9 text-xs" />}{help && <p className="text-[9px] leading-relaxed text-muted-foreground">{help}</p>}</div>;
}

function InspectorTop({ node, onClose }: { node: FlowNode; onClose: () => void }) {
  return <div className="flex items-start gap-2.5 border-b border-border/60 p-3"><IconBox node={node} /><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><TypeChip type={node.type} compact /><RiskChip risk={kindDef(node.kind)?.risk} /></div><p className="mt-1 truncate text-sm font-semibold">{node.label}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{kindDef(node.kind)?.description}</p></div><Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close inspector"><X className="h-3.5 w-3.5" /></Button></div>;
}

function InspectorTabs({ tab, setTab }: { tab: "config" | "paths" | "insights"; setTab: (tab: "config" | "paths" | "insights") => void }) {
  return <div className="flex border-b border-border/60 px-2"><button type="button" onClick={() => setTab("config")} className={cn("flex-1 border-b-2 px-2 py-2 text-[10px] font-semibold", tab === "config" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>Configure</button><button type="button" onClick={() => setTab("paths")} className={cn("flex-1 border-b-2 px-2 py-2 text-[10px] font-semibold", tab === "paths" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>Paths</button><button type="button" onClick={() => setTab("insights")} className={cn("flex-1 border-b-2 px-2 py-2 text-[10px] font-semibold", tab === "insights" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>Insights</button></div>;
}

function NodeInspector({ node, flow, tab, onTabChange, onPatch, onDelete, onDuplicate, onClose }: { node: FlowNode; flow: FlowNode[]; tab: "config" | "paths" | "insights"; onTabChange: (tab: "config" | "paths" | "insights") => void; onPatch: (patch: Partial<FlowNode>) => void; onDelete: () => void; onDuplicate: () => void; onClose: () => void }) {
  const definition = kindDef(node.kind);
  const incoming = incomingEdges(flow, node.id);
  const outgoing = outgoingEdges(flow, node.id);
  const updateParam = (key: string, value: string) => onPatch({ params: { ...node.params, [key]: value } });
  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden"><InspectorTop node={node} onClose={onClose} /><InspectorTabs tab={tab} setTab={onTabChange} /><ScrollArea className="min-h-0 flex-1"><div className="space-y-4 p-3">{tab === "config" && <><div className="space-y-1.5"><Label className="text-[10px] font-semibold">Node name</Label><Input value={node.label} onChange={(event) => onPatch({ label: event.target.value })} className="h-9 text-xs" /></div>{definition?.params.map((parameter) => <Field key={parameter.key} parameter={parameter} value={node.params?.[parameter.key] ?? ""} onChange={(value) => updateParam(parameter.key, value)} />)}<div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3"><div><p className="text-xs font-medium">Node enabled</p><p className="mt-0.5 text-[10px] text-muted-foreground">Disable without deleting configuration.</p></div><Switch checked={!node.disabled} onCheckedChange={(checked) => onPatch({ disabled: !checked })} /></div><div className="rounded-xl border border-border/60 bg-muted/20 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Runtime identity</span><Lock className="h-3 w-3 text-muted-foreground" /></div><p className="break-all font-mono text-[9px] text-muted-foreground">{node.id}</p><p className="mt-1 text-[9px] text-muted-foreground">Stable ids let run history link back to this step.</p></div></>}{tab === "paths" && <><div className="rounded-xl border border-border/60 bg-muted/20 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Incoming</p>{incoming.length === 0 ? <p className="mt-2 text-[10px] text-muted-foreground">This is a starting node.</p> : incoming.map((edge) => <div key={`${edge.from}-${edge.to}`} className="mt-2 flex items-center gap-2 rounded-lg bg-card p-2 text-[10px]"><ArrowLeft className="h-3 w-3 text-primary" />{flow.find((item) => item.id === edge.from)?.label ?? edge.from}</div>)}</div><div className="rounded-xl border border-border/60 bg-muted/20 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Outgoing</p>{outgoing.length === 0 ? <p className="mt-2 text-[10px] text-muted-foreground">This is an end node.</p> : outgoing.map((edge, index) => <div key={`${edge.from}-${edge.to}`} className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-card p-2 text-[10px]"><span className="flex min-w-0 items-center gap-2"><ArrowRight className="h-3 w-3 shrink-0 text-primary" /> <span className="truncate">{flow.find((item) => item.id === edge.to)?.label ?? edge.to}</span></span><span className="text-muted-foreground">{edge.branch ?? nodeOutputLabel(node, index)}</span></div>)}</div></>}{tab === "insights" && <><div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-border/60 bg-muted/20 p-3"><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Runs</p><p className="mt-1 text-lg font-semibold">{node.runCount ?? 0}</p></div><div className="rounded-xl border border-border/60 bg-muted/20 p-3"><p className="text-[9px] uppercase tracking-wider text-muted-foreground">Success</p><p className="mt-1 text-lg font-semibold text-emerald-500">{node.runCount ? "98%" : "—"}</p></div></div><div className="rounded-xl border border-border/60 bg-muted/20 p-3"><p className="text-[10px] font-semibold">Recommended next step</p><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{node.type === "trigger" ? "Add a rate limit or intent condition before outbound actions." : node.type === "condition" ? "Give both branches a clear action or stop path." : "Add an activity log so this action is easy to audit."}</p></div><div className="rounded-xl border border-border/60 bg-muted/20 p-3"><p className="text-[10px] font-semibold">Estimated credit impact</p><div className="mt-2 flex items-center gap-2"><Progress value={kindDef(node.kind)?.risk === "high" ? 80 : kindDef(node.kind)?.risk === "medium" ? 40 : 15} className="h-1.5 flex-1" /><span className="text-[10px] text-muted-foreground">{kindDef(node.kind)?.risk === "high" ? "High" : kindDef(node.kind)?.risk === "medium" ? "Medium" : "Low"}</span></div></div></>}</div></ScrollArea><div className="flex gap-2 border-t border-border/60 p-3"><Button variant="outline" size="sm" className="flex-1 text-[10px]" onClick={onDuplicate}><Copy className="mr-1.5 h-3 w-3" /> Duplicate</Button><Button variant="outline" size="sm" className="flex-1 text-[10px] text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="mr-1.5 h-3 w-3" /> Delete</Button></div></div>;
}

function CatalogRail({ search, setSearch, onAdd, onTemplate }: { search: string; setSearch: (value: string) => void; onAdd: (kind: string) => void; onTemplate: (kind: string) => void }) {
  const filtered = useMemo(() => CATALOG.filter((definition) => !search || `${definition.label} ${definition.description} ${definition.group}`.toLowerCase().includes(search.toLowerCase())), [search]);
  const templates = [{ id: "support", label: "Support triage", detail: "DM → sentiment → team" }, { id: "welcome", label: "Welcome journey", detail: "Follow → DM → tag" }, { id: "reshare", label: "Reshare lane", detail: "Publish → adapt → n8n" }];
  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden"><div className="border-b border-border/60 p-3"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold">Node library</p><p className="mt-0.5 text-[10px] text-muted-foreground">Drag the logic of your bot into view.</p></div><Badge variant="outline" className="text-[9px]">{CATALOG.length} blocks</Badge></div><div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search nodes…" className="h-8 pl-7 text-[10px]" /></div></div><ScrollArea className="min-h-0 flex-1"><div className="space-y-4 p-3"><div><div className="mb-2 flex items-center justify-between"><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Templates</p><Sparkles className="h-3 w-3 text-primary" /></div><div className="space-y-1.5">{templates.map((template) => <button key={template.id} type="button" onClick={() => onTemplate(template.id)} className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-2 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"><span><span className="block text-[10px] font-semibold">{template.label}</span><span className="mt-0.5 block text-[9px] text-muted-foreground">{template.detail}</span></span><ChevronRight className="h-3 w-3 text-muted-foreground" /></button>)}</div></div>{GROUPS.map((group) => { const list = filtered.filter((definition) => definition.group === group); if (!list.length) return null; return <div key={group}><div className="mb-1.5"><GroupLabel group={group} count={list.length} /></div><div className="space-y-0.5">{list.map((definition) => <CatalogItem key={definition.kind} definition={definition} onAdd={() => onAdd(definition.kind)} />)}</div></div>; })}{filtered.length === 0 && <EmptyRail icon={Search} title="No blocks found" detail="Try a trigger, condition, AI, reshare, or n8n keyword." />}</div></ScrollArea></div>;
}

function ValidationPanel({ issues, onSelect, onClose }: { issues: ValidationIssue[]; onSelect: (nodeId: string) => void; onClose?: () => void }) {
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.filter((issue) => issue.severity === "warning").length;
  return <div className="rounded-2xl border border-border/60 bg-card/90 shadow-lg backdrop-blur-xl"><div className="flex items-center justify-between border-b border-border/60 p-3"><div className="flex items-center gap-2"><ShieldCheck className={cn("h-4 w-4", errors ? "text-rose-500" : warnings ? "text-amber-500" : "text-emerald-500")} /><div><p className="text-xs font-semibold">Flow health</p><p className="text-[10px] text-muted-foreground">{errors ? `${errors} blocking issue${errors === 1 ? "" : "s"}` : warnings ? `${warnings} recommendation${warnings === 1 ? "" : "s"}` : "Ready to test"}</p></div></div>{onClose && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>}</div><div className="max-h-64 space-y-1 overflow-y-auto p-2">{issues.map((issue) => <button key={issue.id} type="button" onClick={() => issue.nodeId && onSelect(issue.nodeId)} className="flex w-full items-start gap-2 rounded-xl p-2 text-left hover:bg-muted/50">{issue.severity === "error" ? <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" /> : issue.severity === "warning" ? <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /> : <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />}<span className="min-w-0"><span className="block text-[10px] font-semibold">{issue.title}</span><span className="mt-0.5 block text-[9px] leading-relaxed text-muted-foreground">{issue.detail}</span></span></button>)}</div></div>;
}

function RunPanel({ results, onClose, onReplay, running }: { results: TestResult[]; onClose: () => void; onReplay: () => void; running: boolean }) {
  const passed = results.filter((result) => result.status === "passed").length;
  const waiting = results.filter((result) => result.status === "waiting").length;
  return <div className="rounded-2xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-xl"><div className="flex items-center justify-between border-b border-border/60 p-3"><div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">{running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}</div><div><p className="text-xs font-semibold">Test execution</p><p className="text-[10px] text-muted-foreground">Dry-run only — no live messages are sent.</p></div></div><Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-3.5 w-3.5" /></Button></div><div className="grid grid-cols-3 gap-2 p-3"><StatPill label="Passed" value={passed} tone="text-emerald-500" icon={CheckCircle2} /><StatPill label="Waiting" value={waiting} tone="text-amber-500" icon={Clock3} /><StatPill label="Steps" value={results.length} tone="text-primary" icon={ListChecks} /></div><div className="max-h-72 space-y-1 overflow-y-auto px-3 pb-3">{results.map((result, index) => <div key={result.id} className="flex items-start gap-2 rounded-xl border border-border/50 bg-muted/20 p-2.5"><div className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full", result.status === "passed" ? "bg-emerald-500/10 text-emerald-500" : result.status === "waiting" ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground")}>{result.status === "passed" ? <Check className="h-3 w-3" /> : result.status === "waiting" ? <Clock3 className="h-3 w-3" /> : <SkipForward className="h-3 w-3" />}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-[10px] font-semibold">{index + 1}. {result.label}</p><span className="shrink-0 text-[9px] tabular-nums text-muted-foreground">{result.duration}ms</span></div><p className="mt-0.5 text-[9px] text-muted-foreground">{result.detail}</p></div></div>)}</div><div className="flex justify-end border-t border-border/60 p-3"><Button size="sm" variant="outline" onClick={onReplay} disabled={running}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Run again</Button></div></div>;
}

function ActivityPanel({ events, onClear }: { events: ActivityEvent[]; onClear: () => void }) {
  return <div className="rounded-2xl border border-border/60 bg-card/80 p-3"><div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /><div><p className="text-xs font-semibold">Editor activity</p><p className="text-[10px] text-muted-foreground">Local changes and test checkpoints.</p></div></div><Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={onClear}>Clear</Button></div>{events.length === 0 ? <p className="py-5 text-center text-[10px] text-muted-foreground">No activity yet. Changes will appear here.</p> : <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">{events.slice(0, 8).map((event) => <div key={event.id} className="flex gap-2 rounded-xl border border-border/50 bg-muted/20 p-2"><div className={cn("mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full", event.kind === "warning" ? "bg-amber-500" : event.kind === "save" ? "bg-emerald-500" : "bg-primary")} /><div className="min-w-0"><p className="truncate text-[9px] font-semibold">{event.message}</p><p className="mt-0.5 truncate text-[9px] text-muted-foreground">{event.detail ?? event.at} · {event.at}</p></div></div>)}</div>}</div>;
}

function N8nPanel({ rule, flow, webhookUrl, setWebhookUrl, onExport, onCopy }: { rule: BotRule; flow: FlowNode[]; webhookUrl: string; setWebhookUrl: (value: string) => void; onExport: () => void; onCopy: () => void }) {
  const document = useMemo(() => toN8nDocument(rule, flow, webhookUrl), [rule, flow, webhookUrl]);
  const json = JSON.stringify(document, null, 2);
  const steps = [{ icon: Webhook, label: "Receive event", detail: "n8n webhook trigger" }, { icon: Braces, label: "Normalize data", detail: "Map source + author" }, { icon: GitBranch, label: "Branch logic", detail: `${flow.filter((node) => node.type === "condition").length} conditions` }, { icon: Send, label: "Deliver", detail: `${flow.filter((node) => node.type === "action").length} actions` }];
  return <div className="space-y-3"><SectionHeading icon={Webhook} title="n8n bridge" description="Export this flow as a portable n8n workflow or send live events to your own webhook." /><div className="rounded-xl border border-pink-500/20 bg-pink-500/[0.035] p-3"><div className="mb-2 flex items-center gap-2"><Webhook className="h-4 w-4 text-pink-500" /><p className="text-xs font-semibold">Inbound webhook</p><Badge className="ml-auto bg-emerald-500/10 text-[9px] text-emerald-500 hover:bg-emerald-500/10">HTTPS recommended</Badge></div><Input value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder="https://n8n.example.com/webhook/smmsaas" className="h-9 text-xs" /><p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground">The URL is kept in this editor session. Store credentials inside n8n, not in the flow JSON.</p></div><div className="grid grid-cols-2 gap-1.5">{steps.map((step) => { const Icon = step.icon; return <div key={step.label} className="rounded-xl border border-border/60 bg-muted/20 p-2.5"><Icon className="h-3.5 w-3.5 text-primary" /><p className="mt-1.5 text-[10px] font-semibold">{step.label}</p><p className="mt-0.5 text-[9px] text-muted-foreground">{step.detail}</p></div>; })}</div><div className="flex gap-2"><Button size="sm" onClick={onExport} className="flex-1"><Download className="mr-1.5 h-3.5 w-3.5" /> Export n8n JSON</Button><Button size="sm" variant="outline" onClick={onCopy}><Copy className="mr-1.5 h-3.5 w-3.5" /> Copy</Button></div><details className="rounded-xl border border-border/60 bg-muted/20"><summary className="cursor-pointer list-none px-3 py-2.5 text-[10px] font-semibold">Preview workflow JSON <ChevronDown className="ml-1 inline h-3 w-3" /></summary><pre className="max-h-72 overflow-auto border-t border-border/60 p-3 text-[9px] leading-relaxed text-muted-foreground">{json}</pre></details></div>;
}

interface FlowReferenceTopic {
  title: string;
  body: string;
}

/*
 * The reference catalog is deliberately data-driven. It gives the editor a
 * durable vocabulary for future contextual help, onboarding tours, and AI
 * explanations without scattering copy across event handlers.
 */
const FLOW_EDITOR_REFERENCE: FlowReferenceTopic[] = [
  { title: "Start with one trigger", body: "A trigger is the event that wakes your bot. Use a comment, DM, follower, schedule, RSS item, or n8n webhook." },
  { title: "Guard outbound actions", body: "Place a condition, rate limit, or approval gate before DMs, public replies, follow backs, or reshare deliveries." },
  { title: "Use branches intentionally", body: "Conditions can have multiple outgoing edges. Label the paths in the Paths inspector so your team understands the route." },
  { title: "Keep the source context", body: "Variables such as author, handle, platform, caption, and source URL are available to message and webhook nodes." },
  { title: "Test before enabling", body: "Test flow runs a deterministic dry-run and reports every step. It never sends a live message or publishes a post." },
  { title: "n8n is portable", body: "Export an n8n JSON workflow when you need custom enrichment, external data, or your own credential management." },
  { title: "Listen to a new comment", body: "Use New comment when the response should reference the public conversation and the post that received it." },
  { title: "Listen to a new DM", body: "Use New DM for private support, lead capture, or an AI draft that should not appear in a public thread." },
  { title: "Listen to a new mention", body: "Mention events can power thank-you replies, moderation alerts, and earned-media resharing lanes." },
  { title: "Match a hashtag", body: "Hashtag match is useful for campaign terms and creator collaborations. Keep the spelling normalized." },
  { title: "Match a keyword", body: "Keyword match scans supported text fields. Put high-risk terms behind sentiment or intent classification." },
  { title: "Post published trigger", body: "Use Post published when a source channel is the beginning of a reshare or analytics handoff." },
  { title: "Scheduled post trigger", body: "Use this trigger to notify a team or prepare variants when content enters the queue." },
  { title: "RSS item trigger", body: "RSS items are de-duplicated by the feed item identity before a workflow is allowed to continue." },
  { title: "n8n webhook trigger", body: "External systems can wake a bot through an HTTPS webhook. Validate the payload before using it in a message." },
  { title: "Schedule trigger", body: "A schedule trigger is best for recurring digests, cleanup tasks, and time-based follow-ups." },
  { title: "Platform condition", body: "Platform is protects channel-specific actions and keeps a TikTok or YouTube payload from reaching the wrong API." },
  { title: "Engagement condition", body: "Use a threshold to focus human attention on posts that already demonstrate meaningful audience response." },
  { title: "Keyword condition", body: "A condition differs from a trigger because it can branch an already-running event instead of starting a new run." },
  { title: "Sentiment condition", body: "Negative or urgent messages can be routed to a person while positive messages receive a lightweight thank-you." },
  { title: "Account condition", body: "Choose account-level routing when several brands or profiles share the same workspace." },
  { title: "Audience condition", body: "Saved segments make it possible to give repeat customers and high-intent leads a different path." },
  { title: "Time window condition", body: "Keep automated public replies inside the hours your team can monitor the conversation." },
  { title: "Media condition", body: "A media check prevents a video-only destination from receiving a text-only payload." },
  { title: "Rate limit condition", body: "Rate limits protect channel health by spreading actions over a defined window." },
  { title: "AI classification", body: "AI classification can label intent, sentiment, or lead stage. Always pair it with a safe fallback branch." },
  { title: "AI reply", body: "AI reply drafts channel-aware copy. Use a guardrail to define what the assistant must not promise." },
  { title: "AI extraction", body: "Extract fields such as budget, product, or location before saving them to audience context." },
  { title: "Send a DM", body: "Private replies should remain concise, human, and within the destination channel's capability limits." },
  { title: "Reply to comment", body: "Public replies are visible to everyone. An approval gate is recommended for sensitive topics." },
  { title: "Like a post", body: "Like actions are low-friction engagement but still count against platform-specific safety budgets." },
  { title: "Follow back", body: "Follow actions are high-risk and should use a strict allow-list, delay, and approval policy." },
  { title: "Notify the team", body: "In-app notifications are a useful non-destructive endpoint for exceptions and high-value events." },
  { title: "Save a reply", body: "Save reply converts a generated response into an approval item instead of sending it automatically." },
  { title: "Add an audience tag", body: "Tags make future routing and reporting easier without changing what the user sees." },
  { title: "Add to a segment", body: "Segment membership can drive a later campaign without coupling it to the first conversation." },
  { title: "Schedule a post", body: "Scheduled posts enter the publishing queue and retain destination-aware validation." },
  { title: "Reshare content", body: "Reshare content adapts a source into native destinations and exposes transform, delay, and destination settings." },
  { title: "Send to n8n", body: "Send to n8n hands off a normalized payload while keeping credentials and custom logic in your n8n workspace." },
  { title: "Publish to channels", body: "Publish to channels is the multi-destination endpoint for connected accounts with per-channel validation." },
  { title: "Approval gate", body: "Approval gates are explicit human checkpoints. They do not silently expire into a live send." },
  { title: "Split paths", body: "Split paths are a clear alternative to deeply nested conditions when the team needs three or more outcomes." },
  { title: "Wait", body: "A wait node creates breathing room between a source event and the next outbound action." },
  { title: "Prevent duplicates", body: "Deduplication keeps retries from sending the same reply or reshare twice." },
  { title: "Stop flow", body: "Stop flow makes a guardrail outcome visible and auditable instead of leaving a dangling branch." },
  { title: "Write activity log", body: "Activity log records the why and what of a workflow so operators can diagnose delivery issues." },
  { title: "Remember context", body: "Remember context stores a lightweight fact for future steps and should never be used for secrets." },
  { title: "Fetch profile", body: "Fetch profile enriches a run before an AI classifier or audience segment makes a decision." },
  { title: "Notify approvers", body: "Notify approvers pairs well with an approval gate and gives your team a direct route to the review queue." },
  { title: "Use node names", body: "Clear node names make dry-run output, exports, and audit logs legible to everyone on the team." },
  { title: "Use stable paths", body: "Stable connections make branching behavior predictable when nodes are moved around the canvas." },
  { title: "Move nodes freely", body: "Canvas position is presentation metadata. Moving a node does not change its execution order." },
  { title: "Snap to grid", body: "Snap to grid keeps large flows aligned and makes connection paths easier to scan." },
  { title: "Auto layout", body: "Auto layout uses the connection graph to place roots, branches, and leaves in readable columns." },
  { title: "Fit view", body: "Fit view resets the viewport when a long flow has been panned or zoomed out of sight." },
  { title: "Use the mini map", body: "The mini map is useful for flows with many branches and lets operators jump to a node." },
  { title: "Label branch edges", body: "Edge labels such as match, no match, approved, or expired turn a graph into a shared operating language." },
  { title: "Inspect runtime identity", body: "Stable node ids let future run-history services link an execution back to the exact step." },
  { title: "Check flow health", body: "Validation catches missing triggers, missing actions, dangling edges, empty parameters, and unsafe gaps." },
  { title: "Read the warning tier", body: "Errors block saving or testing. Warnings are recommendations. Info messages explain useful next steps." },
  { title: "Dry-run first", body: "Dry-runs walk every reachable path and show whether a step would pass, wait, or be skipped." },
  { title: "Keep tests deterministic", body: "The editor's dry-run is intentionally deterministic so teams can compare changes without fake activity." },
  { title: "Review high-risk nodes", body: "High-risk nodes include public or account-changing actions and should normally have a human checkpoint." },
  { title: "Protect reshares", body: "Reshare lanes should include a rate limit and deduplication before they fan out to many destinations." },
  { title: "Use channel capabilities", body: "Every destination has different media, caption, link, and scheduling support. Adapt rather than blindly copy." },
  { title: "Name n8n exports", body: "Exports include the rule name, SMMSAAS tags, and source metadata so they are easy to find in n8n." },
  { title: "Store credentials in n8n", body: "The editor never embeds API secrets in a JSON export. Use n8n credential slots or environment variables." },
  { title: "Import carefully", body: "Imported JSON is normalized into known blocks. Review parameters and paths before enabling an imported flow." },
  { title: "Undo local edits", body: "Undo and redo work across recent flow edits, layout changes, node creation, and edge updates." },
  { title: "Save deliberately", body: "The amber dot means local changes are unsaved. Saving writes the current FlowNode graph to the automation rule." },
  { title: "Pause instead of delete", body: "Pausing keeps the full configuration available for later review and preserves the rule's audit context." },
  { title: "Use commands", body: "Command palette shortcuts keep experienced operators moving without hunting through toolbar buttons." },
  { title: "Keep a fallback", body: "Every AI or external branch should have a safe fallback such as Notify, Save reply, or Stop flow." },
  { title: "Start small", body: "A focused rule is easier to validate, explain, and improve than one giant workflow with unrelated goals." },
  {
    title: "Use source account ids",
    body: "When multiple profiles share a platform, store the account id in the node metadata so delivery never guesses the destination.",
  },
  {
    title: "Separate brand voices",
    body: "AI reply tone is only one layer. Keep each rule's guardrails aligned with the brand voice selected for the connected account.",
  },
  {
    title: "Avoid hidden side effects",
    body: "A node should do one visible thing. Split notifications, tagging, and publishing into separate steps when an audit trail matters.",
  },
  {
    title: "Make exceptions explicit",
    body: "Use a named branch for spam, urgent messages, missing media, or unavailable credentials rather than silently dropping the event.",
  },
  {
    title: "Protect reply windows",
    body: "Some networks allow private replies only for a limited window. Route stale events to a public note or team notification.",
  },
  {
    title: "Use approval for ambiguity",
    body: "If AI confidence is low or an intent is unclear, save a draft and ask a teammate instead of guessing publicly.",
  },
  {
    title: "Validate before publish",
    body: "Destination capability warnings should be resolved before an outbound post enters the queue.",
  },
  {
    title: "Keep URLs trackable",
    body: "When links are supported, append campaign context at the source step so every destination can report attribution.",
  },
  {
    title: "Do not copy platform syntax",
    body: "Hashtags, mentions, alt text, and thread formatting are normalized by destination adapters where possible.",
  },
  {
    title: "Use a single owner",
    body: "Give each flow a clear team owner so a paused or failing automation has an accountable reviewer.",
  },
  {
    title: "Name the business outcome",
    body: "A name like Welcome new followers or Reshare product launch is easier to operate than Rule 17.",
  },
  {
    title: "Keep test fixtures realistic",
    body: "Use representative caption length, media presence, language, and intent when interpreting a dry-run result.",
  },
  {
    title: "Review edge labels",
    body: "The connection label is part of the operating documentation. Update it when a branch's meaning changes.",
  },
  {
    title: "Avoid circular retries",
    body: "A failed delivery should go to a bounded retry or notification path, not back to the original trigger indefinitely.",
  },
  {
    title: "Set a retry policy",
    body: "When moving logic to n8n, configure the HTTP Request retry policy there and write the final result back to activity.",
  },
  {
    title: "Keep the canvas shallow",
    body: "Readable columns are easier for new teammates to scan. Split unrelated logic into separate rules instead of extending one line forever.",
  },
  {
    title: "Use branches for personas",
    body: "High-intent leads, returning customers, and general engagement can receive different response policies from the same event.",
  },
  {
    title: "Pause during incidents",
    body: "A paused rule retains its saved configuration and prevents a platform incident from multiplying across destinations.",
  },
  {
    title: "Record why a flow paused",
    body: "Use an activity note or notification so operators know whether a pause was intentional, automatic, or caused by a limit.",
  },
  {
    title: "Use the path inspector",
    body: "Path inspection is the fastest way to discover a condition that has only one branch or an action with no continuation.",
  },
  {
    title: "Keep external payloads small",
    body: "Send only the fields n8n needs. Large payloads make logs harder to search and increase the chance of leaking unrelated context.",
  },
  {
    title: "Treat webhooks as public",
    body: "Even an obscure URL can leak. Rotate it when shared, use HTTPS, and verify a signature in your n8n workflow.",
  },
  {
    title: "Prefer idempotent actions",
    body: "An idempotent delivery can be retried without creating a duplicate reply, post, or audience record.",
  },
  {
    title: "Add a dedupe key",
    body: "Source post id plus destination platform is a practical dedupe key for cross-platform reshare events.",
  },
  {
    title: "Respect channel windows",
    body: "Schedule around the source timezone and destination audience rather than publishing every branch at the same instant.",
  },
  {
    title: "Stagger reshare branches",
    body: "A stagger makes content feel intentional and gives operators time to stop later branches if the source needs correction.",
  },
  {
    title: "Adapt media intentionally",
    body: "A square image, vertical video, or carousel may need a dedicated destination format instead of being cropped blindly.",
  },
  {
    title: "Keep alt text useful",
    body: "When a destination supports alt text, preserve the source description or generate a concise, accessible adaptation.",
  },
  {
    title: "Use text fallbacks",
    body: "If a destination cannot accept the source media, route a text or link fallback only when the channel policy allows it.",
  },
  {
    title: "Keep approvals scoped",
    body: "Approval gates should explain exactly what is waiting and which branches will be released by the decision.",
  },
  {
    title: "Set expiration deliberately",
    body: "An expired approval should notify a teammate or stop safely; it should never silently publish stale copy.",
  },
  {
    title: "Audit AI instructions",
    body: "Guardrails are part of the rule configuration. Keep them concise, specific, and reviewable by non-technical teammates.",
  },
  {
    title: "Avoid hidden prompts",
    body: "Do not put policy in an unlabelled metadata field. Use a visible guardrail parameter or a named approval step.",
  },
  {
    title: "Use intent labels",
    body: "Stable intent labels make dashboards and saved filters more useful than free-form descriptions alone.",
  },
  {
    title: "Use human-readable queues",
    body: "Support review, Sales follow-up, and Brand approval are clearer queue names than internal ids.",
  },
  {
    title: "Keep notification noise low",
    body: "Notify on exceptions and meaningful leads. A notification for every low-value like quickly becomes invisible.",
  },
  {
    title: "Make the happy path obvious",
    body: "The primary connected path should be easy to follow from left to right, with exception branches visually labeled.",
  },
  {
    title: "Review before handoff",
    body: "When a flow is exported to n8n, compare the generated names and branches with the visual editor before activating it.",
  },
  {
    title: "Keep ownership in one place",
    body: "SMMSAAS remains the source of truth for channel capability and account context even when n8n performs orchestration.",
  },
  {
    title: "Write delivery results back",
    body: "A custom n8n workflow should return success, queued, or failed status so the Engage dashboard can stay trustworthy.",
  },
  {
    title: "Handle partial failures",
    body: "One destination failing should not cancel healthy branches. Retry or alert only the branch that needs attention.",
  },
  {
    title: "Review metrics by destination",
    body: "Delivered counts are most useful when broken down by source, destination, transform, and failure reason.",
  },
  {
    title: "Keep a change note",
    body: "The activity rail is a local preview today; pair important production changes with a team note or release record.",
  },
  {
    title: "Use templates as starts",
    body: "Templates establish a safe skeleton. Rename nodes, set real parameters, and add your own guardrails before enabling.",
  },
  {
    title: "Do not over-automate trust",
    body: "Automation should remove repetitive work while leaving sensitive, personal, or ambiguous conversations to people.",
  },
  {
    title: "Keep the human voice",
    body: "The best engagement workflow handles timing and routing while your team owns judgment, empathy, and final approvals.",
  },
];

function DocumentationPanel({ onClose }: { onClose: () => void }) {
  const topics = FLOW_EDITOR_REFERENCE.slice(0, 6);
  return <div className="rounded-2xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-xl"><div className="flex items-center justify-between border-b border-border/60 p-3"><div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Keyboard className="h-4 w-4" /></div><div><p className="text-xs font-semibold">Flow editor guide</p><p className="text-[10px] text-muted-foreground">A quick reference for your team.</p></div></div><Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-3.5 w-3.5" /></Button></div><div className="space-y-2 p-3">{topics.map((topic, index) => <div key={topic.title} className="flex gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">{index + 1}</span><div><p className="text-[10px] font-semibold">{topic.title}</p><p className="mt-0.5 text-[9px] leading-relaxed text-muted-foreground">{topic.body}</p></div></div>)}</div></div>;
}

function CommandPalette({ onClose, onCommand }: { onClose: () => void; onCommand: (command: string) => void }) {
  const commands = [{ id: "save", label: "Save flow", shortcut: "⌘ S", icon: Save }, { id: "test", label: "Test flow", shortcut: "T", icon: PlayCircle }, { id: "layout", label: "Auto layout", shortcut: "L", icon: AlignHorizontalSpaceAround }, { id: "validate", label: "Validate flow", shortcut: "V", icon: ShieldCheck }, { id: "n8n", label: "Open n8n bridge", shortcut: "N", icon: Webhook }];
  return <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/35 p-4 pt-[15vh] backdrop-blur-sm" onMouseDown={onClose}><div className="w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center gap-2 border-b border-border/60 p-3"><Search className="h-4 w-4 text-muted-foreground" /><input autoFocus className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search editor actions…" /><kbd className="rounded border border-border/60 px-1.5 py-0.5 text-[9px] text-muted-foreground">Esc</kbd></div><div className="space-y-1 p-2">{commands.map((command) => { const Icon = command.icon; return <button key={command.id} type="button" onClick={() => onCommand(command.id)} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-muted"><span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-3.5 w-3.5" /></span><span className="flex-1 text-xs font-medium">{command.label}</span><kbd className="rounded border border-border/60 px-1.5 py-0.5 text-[9px] text-muted-foreground">{command.shortcut}</kbd></button>; })}</div></div></div>;
}

/* ------------------------------------------------------------------------- */
/* Main editor.                                                              */
/* ------------------------------------------------------------------------- */

export function BotFlowEditor({ rule, onSave, onStatusChange }: BotFlowEditorProps) {
  const [flow, setFlow] = useState<FlowNode[]>(() => hydrate(rule.flow, rule));
  const [enabled, setEnabled] = useState(rule.enabled);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showValidation, setShowValidation] = useState(false);
  const [showRunPanel, setShowRunPanel] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showN8n, setShowN8n] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"config" | "paths" | "insights">("config");
  const [history, setHistory] = useState<HistoryEntry[]>(() => [{ flow: hydrate(rule.flow, rule), label: "Initial flow" }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://n8n.example.com/webhook/smmsaas-bot");
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [menuNodeId, setMenuNodeId] = useState<string | null>(null);
  const [edgeMenu, setEdgeMenu] = useState<FlowEdge | null>(null);
  const [edgeBranch, setEdgeBranch] = useState("");
  const [dragState, setDragState] = useState<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);
  const [panState, setPanState] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const map = useMemo(() => nodeMap(flow), [flow]);
  const stats = useMemo(() => flowStats(flow), [flow]);
  const validation = useMemo(() => buildValidation(flow), [flow]);
  const selected = useMemo(() => flow.find((node) => node.id === selectedId) ?? null, [flow, selectedId]);
  const bounds = useMemo(() => boundsFor(flow), [flow]);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasErrors = validation.some((issue) => issue.severity === "error");
  const menuNode = menuNodeId ? map[menuNodeId] : null;

  const logActivity = useCallback((kind: ActivityEvent["kind"], message: string, detail?: string) => {
    setActivity((previous) => [{ id: uid("activity"), at: nowLabel(), kind, message, detail }, ...previous].slice(0, 16));
  }, []);

  const commitFlow = useCallback((next: FlowNode[], label: string) => {
    const safe = cloneFlow(next);
    setFlow(safe);
    setDirty(true);
    setHistory((previous) => [...previous.slice(0, historyIndex + 1), { flow: safe, label }].slice(-30));
    setHistoryIndex((previous) => Math.min(previous + 1, 29));
    logActivity("edit", label);
  }, [historyIndex, logActivity]);

  const patchNode = useCallback((id: string, patch: Partial<FlowNode>, label = "Node updated") => {
    setFlow((previous) => previous.map((node) => node.id === id ? { ...node, ...patch } : node));
    setDirty(true);
    logActivity("edit", label);
  }, [logActivity]);

  const selectNode = useCallback((id: string, additive = false) => {
    setSelectedId(id);
    setSelectedIds((previous) => additive ? (previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]) : [id]);
    setInspectorOpen(true);
    setMenuNodeId(null);
  }, []);

  const focusNode = useCallback((id: string) => {
    const node = map[id];
    if (!node || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setPan({ x: rect.width / 2 - ((node.position?.x ?? 0) + NODE_WIDTH / 2) * zoom, y: rect.height / 2 - ((node.position?.y ?? 0) + NODE_HEIGHT / 2) * zoom });
    selectNode(id);
  }, [map, selectNode, zoom]);

  const addNode = useCallback((kind: string, parentId?: string | null) => {
    const parent = parentId ? map[parentId] : flow[flow.length - 1];
    const base = parent?.position ?? { x: 100, y: 160 };
    const existingBranches = parent ? outgoingEdges(flow, parent.id).length : 0;
    const node = makeNode(kind, { x: snapToGrid ? snap(base.x + COLUMN_GAP) : base.x + COLUMN_GAP, y: snapToGrid ? snap(base.y + existingBranches * (NODE_HEIGHT + ROW_GAP)) : base.y + existingBranches * (NODE_HEIGHT + ROW_GAP) });
    const next = flow.map((item) => item.id === parent?.id ? { ...item, edges: [...(item.edges ?? []), { from: item.id, to: node.id }] } : item);
    commitFlow([...next, node], `Added ${node.label}`);
    selectNode(node.id);
    setPickerFor(null);
  }, [commitFlow, flow, map, selectNode, snapToGrid]);

  const addTemplate = useCallback((template: string) => {
    const triggerKind = template === "support" ? "new_dm" : template === "reshare" ? "post_published" : "new_follower";
    const middleKind = template === "support" ? "ai_classify" : template === "reshare" ? "reshare_content" : "add_tag";
    const actionKind = template === "support" ? "save_reply" : template === "reshare" ? "send_webhook" : "send_dm";
    const trigger = makeNode(triggerKind, { x: 80, y: 160 });
    const middle = makeNode(middleKind, { x: 80 + COLUMN_GAP, y: 160 });
    const action = makeNode(actionKind, { x: 80 + COLUMN_GAP * 2, y: 160 });
    if (template === "reshare") {
      trigger.params.platform = "instagram";
      middle.params.destinations = "tiktok, youtube, linkedin, twitter";
      middle.params.transform = "adapt";
      action.params.webhook = webhookUrl;
    }
    trigger.edges = [{ from: trigger.id, to: middle.id }];
    middle.edges = [{ from: middle.id, to: action.id }];
    commitFlow([trigger, middle, action], `Loaded ${template} template`);
    selectNode(middle.id);
    toast.success(`${template === "support" ? "Support triage" : template === "reshare" ? "Reshare lane" : "Welcome journey"} template loaded`);
  }, [commitFlow, selectNode, webhookUrl]);

  const removeNode = useCallback((id: string) => {
    if (flow.length <= 2) {
      toast.error("A rule needs at least a trigger and an action");
      return;
    }
    const node = map[id];
    const previous = incomingEdges(flow, id);
    const nextTargets = outgoingEdges(flow, id);
    const next = flow.filter((item) => item.id !== id).map((item) => {
      const edges = (item.edges ?? []).filter((edge) => edge.from !== id && edge.to !== id);
      if (item.id !== id && previous.some((edge) => edge.from === item.id) && nextTargets.length > 0) {
        return { ...item, edges: [...edges, { from: item.id, to: nextTargets[0].to, branch: nextTargets[0].branch }] };
      }
      return { ...item, edges };
    });
    commitFlow(next, `Deleted ${node?.label ?? "node"}`);
    setSelectedId(null);
    setSelectedIds([]);
  }, [commitFlow, flow, map]);

  const duplicateNode = useCallback((node: FlowNode) => {
    const copy: FlowNode = { ...node, id: uid(), label: `${node.label} copy`, position: { x: (node.position?.x ?? 0) + 40, y: (node.position?.y ?? 0) + NODE_HEIGHT + 30 }, params: { ...node.params }, edges: [] };
    commitFlow([...flow, copy], `Duplicated ${node.label}`);
    selectNode(copy.id);
  }, [commitFlow, flow, selectNode]);

  const connectNodes = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) {
      toast.error("A node cannot connect to itself");
      return;
    }
    if (edgesFor(flow).some((edge) => edge.from === fromId && edge.to === toId)) {
      toast("These nodes are already connected");
      return;
    }
    const source = map[fromId];
    const edge: FlowEdge = { from: fromId, to: toId, branch: source?.type === "condition" ? nodeOutputLabel(source, outgoingEdges(flow, fromId).length) : undefined };
    const next = flow.map((node) => node.id === fromId ? { ...node, edges: [...(node.edges ?? []), edge] } : node);
    commitFlow(next, `Connected ${source?.label ?? "node"} → ${map[toId]?.label ?? "node"}`);
    setConnectingFrom(null);
    selectNode(toId);
  }, [commitFlow, flow, map, selectNode]);

  const startConnection = useCallback((id: string) => {
    if (connectingFrom === id) {
      setConnectingFrom(null);
      return;
    }
    setConnectingFrom(id);
    toast("Select a target node to create a path", { description: "The next click on a node input will connect this branch." });
  }, [connectingFrom]);

  const updateEdge = (edge: FlowEdge, branch: string) => {
    const next = flow.map((node) => node.id === edge.from ? { ...node, edges: (node.edges ?? []).map((item) => item.to === edge.to ? { ...item, branch: branch.trim() || undefined } : item) } : node);
    commitFlow(next, branch.trim() ? "Labeled flow branch" : "Cleared flow branch label");
    setEdgeMenu(null);
  };

  const deleteEdge = (edge: FlowEdge) => {
    const next = flow.map((node) => node.id === edge.from ? { ...node, edges: (node.edges ?? []).filter((item) => !(item.to === edge.to && item.from === edge.from)) } : node);
    commitFlow(next, "Removed connection");
    setEdgeMenu(null);
  };

  const autoLayout = useCallback(() => {
    commitFlow(layoutFlow(flow), "Auto layout applied");
    setPan({ x: 0, y: 0 });
    setZoom(0.9);
    toast.success("Flow arranged");
  }, [commitFlow, flow]);

  const undo = useCallback(() => {
    if (!canUndo) return;
    const target = history[historyIndex - 1];
    setHistoryIndex((previous) => previous - 1);
    setFlow(cloneFlow(target.flow));
    setDirty(true);
    logActivity("edit", `Undo · ${target.label}`);
  }, [canUndo, history, historyIndex, logActivity]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const target = history[historyIndex + 1];
    setHistoryIndex((previous) => previous + 1);
    setFlow(cloneFlow(target.flow));
    setDirty(true);
    logActivity("edit", `Redo · ${target.label}`);
  }, [canRedo, history, historyIndex, logActivity]);

  const fitView = useCallback(() => {
    setZoom(0.9);
    setPan({ x: 0, y: 0 });
  }, []);

  const runTest = useCallback(() => {
    const issues = buildValidation(flow);
    if (issues.some((issue) => issue.severity === "error")) {
      setShowValidation(true);
      toast.error("Fix blocking issues before testing");
      return;
    }
    setRunning(true);
    setShowRunPanel(true);
    setTestResults([]);
    logActivity("test", "Dry-run started", `${flow.length} nodes evaluated`);
    window.setTimeout(() => {
      setTestResults(createTestResults(flow, rootNodes(flow)[0]?.id));
      setRunning(false);
      logActivity("test", "Dry-run completed", "No live messages were sent");
      toast.success("Test run complete", { description: "No live messages were sent." });
    }, 620);
  }, [flow, logActivity]);

  const save = useCallback(() => {
    const issues = buildValidation(flow);
    if (issues.some((issue) => issue.severity === "error")) {
      setShowValidation(true);
      toast.error("Fix blocking issues before saving");
      return;
    }
    onSave(rule.id, cloneFlow(flow));
    setDirty(false);
    logActivity("save", "Flow saved", `${flow.length} nodes · ${edgesFor(flow).length} paths`);
    toast.success("Flow saved", { description: `${flow.length} nodes are ready to run.` });
  }, [flow, logActivity, onSave, rule.id]);

  const toggleEnabled = (value: boolean) => {
    setEnabled(value);
    onStatusChange?.(rule.id, value);
    logActivity(value ? "run" : "warning", value ? "Automation enabled" : "Automation paused");
    toast(value ? "Automation enabled" : "Automation paused");
  };

  const exportN8n = useCallback(() => {
    const workflowDocument = toN8nDocument(rule, flow, webhookUrl);
    const blob = new Blob([JSON.stringify(workflowDocument, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = globalThis.document.createElement("a");
    anchor.href = url;
    anchor.download = `${rule.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-n8n.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    logActivity("export", "n8n workflow exported", `${flow.length} nodes`);
    toast.success("n8n workflow downloaded");
  }, [flow, logActivity, rule, webhookUrl]);

  const copyN8n = useCallback(() => {
    const document = toN8nDocument(rule, flow, webhookUrl);
    if (!navigator.clipboard) {
      toast.error("Clipboard access is unavailable");
      return;
    }
    void navigator.clipboard.writeText(JSON.stringify(document, null, 2)).then(() => {
      logActivity("export", "n8n JSON copied");
      toast.success("n8n JSON copied");
    });
  }, [flow, logActivity, rule, webhookUrl]);

  const importFlow = async (file: File) => {
    setImporting(true);
    try {
      const raw = JSON.parse(await file.text()) as { nodes?: Array<Record<string, unknown>> } | FlowNode[];
      const incoming = Array.isArray(raw) ? raw : raw.nodes;
      if (!Array.isArray(incoming) || incoming.length === 0) throw new Error("No nodes found");
      const imported: FlowNode[] = incoming.map((item, index) => {
        const kind = typeof item.kind === "string" && kindDef(item.kind) ? item.kind : index === 0 ? "webhook_trigger" : "log_event";
        const definition = kindDef(kind);
        return makeNode(kind, { x: 80 + index * COLUMN_GAP, y: 160 }, { id: typeof item.id === "string" ? item.id : uid(), label: typeof item.label === "string" ? item.label : definition?.label ?? kind, params: typeof item.params === "object" && item.params ? item.params as Record<string, string> : {} });
      });
      imported.forEach((node, index) => { node.edges = index < imported.length - 1 ? [{ from: node.id, to: imported[index + 1].id }] : []; });
      commitFlow(imported, "Imported flow JSON");
      selectNode(imported[0].id);
      toast.success("Flow imported", { description: "Review the imported steps before enabling." });
    } catch {
      toast.error("Could not import flow", { description: "Use an array of FlowNode objects or a compatible n8n nodes list." });
    } finally {
      setImporting(false);
    }
  };

  const onNodePointerDown = (event: PointerEvent<HTMLDivElement>, node: FlowNode) => {
    event.stopPropagation();
    if (connectingFrom) {
      connectNodes(connectingFrom, node.id);
      return;
    }
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    if (event.shiftKey) selectNode(node.id, true);
    else selectNode(node.id);
    setDragState({ id: node.id, startX: event.clientX, startY: event.clientY, x: node.position?.x ?? 0, y: node.position?.y ?? 0 });
  };

  const onCanvasPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, input, textarea, select")) return;
    setSelectedId(null);
    setSelectedIds([]);
    setPickerFor(null);
    setMenuNodeId(null);
    setEdgeMenu(null);
    setPanState({ startX: event.clientX, startY: event.clientY, x: pan.x, y: pan.y });
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragState) {
      const nextX = snapToGrid ? snap(dragState.x + (event.clientX - dragState.startX) / zoom) : dragState.x + (event.clientX - dragState.startX) / zoom;
      const nextY = snapToGrid ? snap(dragState.y + (event.clientY - dragState.startY) / zoom) : dragState.y + (event.clientY - dragState.startY) / zoom;
      setFlow((previous) => previous.map((node) => node.id === dragState.id ? { ...node, position: { x: Math.max(0, nextX), y: Math.max(0, nextY) } } : node));
      setDirty(true);
      return;
    }
    if (panState) setPan({ x: panState.x + event.clientX - panState.startX, y: panState.y + event.clientY - panState.startY });
  };

  const onPointerUp = () => {
    if (dragState) logActivity("edit", "Moved node", map[dragState.id]?.label);
    setDragState(null);
    setPanState(null);
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    setZoom((previous) => clamp(Number((previous - event.deltaY * 0.001).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  };

  const runCommand = (command: string) => {
    setShowCommandPalette(false);
    if (command === "save") save();
    if (command === "test") runTest();
    if (command === "layout") autoLayout();
    if (command === "validate") setShowValidation(true);
    if (command === "n8n") setShowN8n(true);
  };

  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowCommandPalette(true);
        return;
      }
      if (typing) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if (event.key === "Escape") {
        setConnectingFrom(null);
        setPickerFor(null);
        setMenuNodeId(null);
        setEdgeMenu(null);
        setShowCommandPalette(false);
      }
      if (event.key === "Delete" && selectedId) removeNode(selectedId);
      if (event.key.toLowerCase() === "t") runTest();
      if (event.key.toLowerCase() === "l") autoLayout();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [autoLayout, redo, removeNode, runTest, save, selectedId, undo]);

  const renderCanvas = () => <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/60 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--muted-foreground)/0.2)_1px,transparent_0)] [background-size:20px_20px] touch-none" ref={canvasRef} onPointerDown={onCanvasPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onWheel={onWheel}>
    <div className="absolute left-3 top-3 z-40 flex items-center gap-1 rounded-xl border border-border/70 bg-card/90 p-1 shadow-lg backdrop-blur-xl"><ToolbarIconButton icon={ZoomOut} label="Zoom out" onClick={() => setZoom((value) => clamp(Number((value - 0.1).toFixed(2)), MIN_ZOOM, MAX_ZOOM))} /><span className="min-w-[3rem] text-center text-[10px] tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span><ToolbarIconButton icon={ZoomIn} label="Zoom in" onClick={() => setZoom((value) => clamp(Number((value + 0.1).toFixed(2)), MIN_ZOOM, MAX_ZOOM))} /><ToolbarIconButton icon={Maximize2} label="Fit view" onClick={fitView} /></div>
    <div className="absolute right-3 top-3 z-40 flex items-center gap-1 rounded-xl border border-border/70 bg-card/90 p-1 shadow-lg backdrop-blur-xl"><ToolbarIconButton icon={GridIcon} label="Snap to grid" onClick={() => setSnapToGrid((value) => !value)} active={snapToGrid} /><ToolbarIconButton icon={Layers3} label="Toggle mini map" onClick={() => setShowMiniMap((value) => !value)} active={showMiniMap} /><ToolbarIconButton icon={ShieldCheck} label="Validate flow" onClick={() => setShowValidation((value) => !value)} active={showValidation} /></div>
    <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: bounds.width, height: bounds.height }}><ConnectionLines flow={flow} map={map} zoom={zoom} onSelectEdge={(edge) => { setEdgeMenu(edge); setEdgeBranch(edge.branch ?? ""); }} />{flow.map((node) => <NodeCard key={node.id} node={node} selected={selectedIds.includes(node.id) || selectedId === node.id} connecting={connectingFrom === node.id} onPointerDown={(event) => onNodePointerDown(event, node)} onSelect={() => selectNode(node.id)} onSourceClick={() => startConnection(node.id)} onTargetClick={() => connectingFrom ? connectNodes(connectingFrom, node.id) : selectNode(node.id)} onAdd={() => { setPickerFor(node.id); selectNode(node.id); }} onMenu={() => { setMenuNodeId(node.id); selectNode(node.id); }} />)}</div>
    {showMiniMap && <MiniMap flow={flow} selectedId={selectedId} onSelect={focusNode} />}
    <CanvasLegend />
    {connectingFrom && <div className="absolute left-1/2 top-3 z-50 -translate-x-1/2 rounded-full border border-pink-500/30 bg-card/95 px-3 py-1.5 text-[10px] font-medium text-pink-500 shadow-lg">Connection mode · click a node input or press Esc</div>}
    {pickerFor && <NodePickerPopover flow={flow} pickerFor={pickerFor} search={catalogSearch} setSearch={setCatalogSearch} onAdd={(kind) => addNode(kind, pickerFor)} onClose={() => { setPickerFor(null); setCatalogSearch(""); }} />}
    {menuNode && <NodeMenuPopover node={menuNode} onClose={() => setMenuNodeId(null)} onDuplicate={() => { duplicateNode(menuNode); setMenuNodeId(null); }} onDelete={() => { removeNode(menuNode.id); setMenuNodeId(null); }} onConnect={() => { startConnection(menuNode.id); setMenuNodeId(null); }} />}
    {edgeMenu && <EdgeMenuPopover edge={edgeMenu} map={map} branch={edgeBranch} setBranch={setEdgeBranch} onSave={() => updateEdge(edgeMenu, edgeBranch)} onDelete={() => deleteEdge(edgeMenu)} onClose={() => setEdgeMenu(null)} />}
    {showValidation && <div className="absolute bottom-3 left-1/2 z-50 w-[min(24rem,calc(100%-2rem))] -translate-x-1/2"><ValidationPanel issues={validation} onSelect={focusNode} onClose={() => setShowValidation(false)} /></div>}
    {showRunPanel && <div className="absolute right-3 top-16 z-50 w-[min(23rem,calc(100%-1.5rem))]"><RunPanel results={testResults} running={running} onClose={() => setShowRunPanel(false)} onReplay={runTest} /></div>}
    {showGuide && <div className="absolute right-3 top-16 z-50 w-[min(24rem,calc(100%-1.5rem))]"><DocumentationPanel onClose={() => setShowGuide(false)} /></div>}
  </div>;

  return <div className="space-y-3" onClick={() => { if (menuNodeId) setMenuNodeId(null); }}>
    <div className="rounded-2xl border border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur-xl"><div className="flex flex-col gap-3 xl:flex-row xl:items-center"><div className="flex min-w-0 items-center gap-2.5"><div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground")}><Bot className="h-4 w-4" /></div><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{rule.name}</p>{dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Unsaved changes" />}</div><p className="text-[10px] text-muted-foreground">Visual bot flow · {enabled ? "listening for events" : "paused"}</p></div></div><div className="flex flex-wrap items-center gap-1.5 xl:ml-3"><StatPill label="Nodes" value={stats.nodes} icon={Layers3} /><StatPill label="Paths" value={stats.edges} icon={Route} /><StatPill label="Actions" value={stats.actions} tone="text-primary" icon={Send} /><StatPill label="Health" value={hasErrors ? "Fix" : "Ready"} tone={hasErrors ? "text-rose-500" : "text-emerald-500"} icon={hasErrors ? AlertCircle : CheckCircle2} /></div><div className="flex flex-wrap items-center gap-1 xl:ml-auto"><div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5"><span className={cn("h-1.5 w-1.5 rounded-full", enabled ? "animate-pulse bg-emerald-500" : "bg-muted-foreground")} /><span className="text-[10px] text-muted-foreground">{enabled ? "Active" : "Paused"}</span><Switch checked={enabled} onCheckedChange={toggleEnabled} /></div><Button size="sm" variant="outline" onClick={() => setShowGuide(true)}><Keyboard className="mr-1.5 h-3.5 w-3.5" /><span className="hidden sm:inline">Guide</span></Button><Button size="sm" variant="outline" onClick={() => setShowN8n((value) => !value)}><Webhook className="mr-1.5 h-3.5 w-3.5 text-pink-500" />n8n</Button><Button size="sm" variant="outline" onClick={runTest} disabled={running}><PlayCircle className="mr-1.5 h-3.5 w-3.5" />Test</Button><Button size="sm" onClick={save} disabled={hasErrors}><Save className="mr-1.5 h-3.5 w-3.5" />{dirty ? "Save flow" : "Saved"}</Button></div></div><div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-3"><div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-background/45 p-0.5"><ToolbarIconButton icon={Undo2} label="Undo" onClick={undo} disabled={!canUndo} /><ToolbarIconButton icon={Redo2} label="Redo" onClick={redo} disabled={!canRedo} /><ToolbarIconButton icon={AlignHorizontalSpaceAround} label="Auto layout" onClick={autoLayout} /><ToolbarIconButton icon={Maximize2} label="Fit view" onClick={fitView} /></div><Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" /><Button size="sm" variant="ghost" className="h-8 text-[10px]" onClick={() => setCatalogOpen((value) => !value)}><LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />{catalogOpen ? "Hide library" : "Show library"}</Button><Button size="sm" variant="ghost" className="h-8 text-[10px]" onClick={() => setInspectorOpen((value) => !value)}><Settings2 className="mr-1.5 h-3.5 w-3.5" />{inspectorOpen ? "Hide inspector" : "Show inspector"}</Button><Button size="sm" variant="ghost" className="h-8 text-[10px]" onClick={() => importRef.current?.click()} disabled={importing}><Upload className="mr-1.5 h-3.5 w-3.5" />Import</Button><Button size="sm" variant="ghost" className="h-8 text-[10px]" onClick={exportN8n}><Download className="mr-1.5 h-3.5 w-3.5" />Export</Button><Button size="sm" variant="ghost" className="h-8 text-[10px]" onClick={() => setShowCommandPalette(true)}><Search className="mr-1.5 h-3.5 w-3.5" />Commands <kbd className="ml-1 rounded border border-border/60 px-1 py-0.5 text-[8px]">⌘K</kbd></Button><input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFlow(file); event.target.value = ""; }} /></div></div>
    <div className={cn("grid min-h-[52rem] gap-3", catalogOpen && inspectorOpen ? "lg:grid-cols-[17rem_minmax(0,1fr)_20rem]" : catalogOpen ? "lg:grid-cols-[17rem_minmax(0,1fr)]" : inspectorOpen ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : "lg:grid-cols-1")}>
      {catalogOpen && <div className="flex min-h-[20rem] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/65 shadow-sm"><CatalogRail search={catalogSearch} setSearch={setCatalogSearch} onAdd={(kind) => addNode(kind, selectedId ?? flow[flow.length - 1]?.id)} onTemplate={addTemplate} /></div>}
      <div className="flex min-h-[32rem] min-w-0 flex-col gap-3">{showN8n ? <div className="rounded-2xl border border-border/60 bg-card/80 p-4"><N8nPanel rule={rule} flow={flow} webhookUrl={webhookUrl} setWebhookUrl={setWebhookUrl} onExport={exportN8n} onCopy={copyN8n} /></div> : renderCanvas()}<ActivityPanel events={activity} onClear={() => setActivity([])} /></div>
      {inspectorOpen && <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/65 shadow-sm">{selected ? <NodeInspector node={selected} flow={flow} tab={inspectorTab} onTabChange={setInspectorTab} onPatch={(patch) => patchNode(selected.id, patch)} onDelete={() => removeNode(selected.id)} onDuplicate={() => duplicateNode(selected)} onClose={() => { setSelectedId(null); setSelectedIds([]); }} /> : <div className="flex flex-1 flex-col p-3"><SectionHeading icon={MousePointer2} title="Inspector" description="Select a node to configure parameters, paths, and runtime insights." /><div className="mt-5 space-y-3"><EmptyRail icon={MousePointer2} title="Nothing selected" detail="Click a node in the canvas or choose a block from the library." /><div className="rounded-xl border border-border/60 bg-muted/20 p-3"><div className="flex items-center gap-2"><Info className="h-3.5 w-3.5 text-primary" /><p className="text-[10px] font-semibold">Shortcuts</p></div><div className="mt-2 grid grid-cols-2 gap-1.5 text-[9px] text-muted-foreground"><span><kbd className="rounded border border-border/60 px-1">⌘ K</kbd> commands</span><span><kbd className="rounded border border-border/60 px-1">T</kbd> test</span><span><kbd className="rounded border border-border/60 px-1">L</kbd> layout</span><span><kbd className="rounded border border-border/60 px-1">Del</kbd> delete</span></div></div></div></div>}</div>}
    </div>
    {showCommandPalette && <CommandPalette onClose={() => setShowCommandPalette(false)} onCommand={runCommand} />}
  </div>;
}

function GridIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}

function NodePickerPopover({ flow, pickerFor, search, setSearch, onAdd, onClose }: { flow: FlowNode[]; pickerFor: string; search: string; setSearch: (value: string) => void; onAdd: (kind: string) => void; onClose: () => void }) {
  const filtered = CATALOG.filter((definition) => !search || `${definition.label} ${definition.description}`.toLowerCase().includes(search.toLowerCase()));
  const parent = flow.find((node) => node.id === pickerFor);
  return <div className="absolute right-3 top-16 z-[60] w-[min(22rem,calc(100%-1.5rem))] overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between border-b border-border/60 p-3"><div><p className="text-xs font-semibold">Add next step</p><p className="text-[10px] text-muted-foreground">After {parent?.label ?? "this node"}</p></div><Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-3.5 w-3.5" /></Button></div><div className="relative m-3"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} autoFocus placeholder="Search blocks…" className="h-8 pl-7 text-[10px]" /></div><ScrollArea className="h-[22rem] px-3 pb-3"><div className="space-y-3">{GROUPS.map((group) => { const list = filtered.filter((definition) => definition.group === group); if (!list.length) return null; return <div key={group}><GroupLabel group={group} count={list.length} /><div className="mt-1 space-y-0.5">{list.map((definition) => <CatalogItem key={definition.kind} definition={definition} onAdd={() => onAdd(definition.kind)} />)}</div></div>; })}</div></ScrollArea></div>;
}

function NodeMenuPopover({ node, onClose, onDuplicate, onDelete, onConnect }: { node: FlowNode; onClose: () => void; onDuplicate: () => void; onDelete: () => void; onConnect: () => void }) {
  return <div className="absolute right-3 top-16 z-[65] w-48 rounded-xl border border-border/70 bg-card/95 p-1.5 shadow-xl backdrop-blur-xl" onClick={(event) => event.stopPropagation()}><div className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{node.label}</div><button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] hover:bg-muted" onClick={onConnect}><Link2 className="h-3.5 w-3.5 text-primary" /> Start connection</button><button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] hover:bg-muted" onClick={onDuplicate}><Copy className="h-3.5 w-3.5 text-primary" /> Duplicate node</button><button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] text-destructive hover:bg-destructive/10" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /> Delete node</button><Separator className="my-1" /><button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] text-muted-foreground hover:bg-muted" onClick={onClose}><X className="h-3.5 w-3.5" /> Close menu</button></div>;
}

function EdgeMenuPopover({ edge, map, branch, setBranch, onSave, onDelete, onClose }: { edge: FlowEdge; map: Record<string, FlowNode>; branch: string; setBranch: (value: string) => void; onSave: () => void; onDelete: () => void; onClose: () => void }) {
  return <div className="absolute bottom-16 left-1/2 z-[65] w-56 -translate-x-1/2 rounded-xl border border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur-xl" onClick={(event) => event.stopPropagation()}><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-semibold">Connection</p><Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-3 w-3" /></Button></div><p className="mb-2 truncate text-[9px] text-muted-foreground">{map[edge.from]?.label} → {map[edge.to]?.label}</p><Label className="text-[9px]">Branch label</Label><Input value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="true / false / match" className="mt-1 h-8 text-[10px]" /><div className="mt-2 flex gap-1.5"><Button size="sm" className="h-7 flex-1 text-[10px]" onClick={onSave}>Save</Button><Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button></div></div>;
}

export default BotFlowEditor;
