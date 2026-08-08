import { useCallback, useMemo, useState, type ComponentType } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  Bell,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Flag,
  GitBranch,
  Globe2,
  Heart,
  Inbox,
  Info,
  Layers3,
  MessageCircle,
  MessageSquare,
  MessageSquareQuote,
  Plus,
  Route,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { platforms } from "@/config/platforms";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useSavedReplies } from "@/hooks/useSavedReplies";
import {
  emptyRule,
  DEFAULT_TONES,
  DEFAULT_PRIORITIES,
  type InboxRule,
  type InboxRuleMatch,
  type InboxRuleActions,
} from "@/hooks/useInboxAutomation";

/**
 * InboxFlowEditor — A compact, n8n-style visual flow editor for the *new
 * inbox automation rule* dialog. It mirrors the match+actions shape used by
 * the rest of the app, so changing the visual flow always changes the rule
 * that gets saved.
 *
 * The editor is intentionally lighter than BotFlowEditor: it's sized for a
 * dialog, lays out blocks in a single horizontal lane on desktop and a
 * vertical lane on mobile/tablet, and is fully keyboard- and touch-friendly.
 */

type NodeKind =
  | "trigger_dm"
  | "trigger_comment"
  | "trigger_any"
  | "match_platform"
  | "match_keyword"
  | "match_sentiment"
  | "match_intent"
  | "branch"
  | "action_welcome_dm"
  | "action_away_dm"
  | "action_menu_dm"
  | "action_saved_reply"
  | "action_ai_draft"
  | "action_assign"
  | "action_label"
  | "action_priority"
  | "action_status"
  | "action_hide"
  | "action_notify"
  | "rate_limit"
  | "human_handoff";

type NodeGroup = "Trigger" | "Match" | "Branch" | "Action" | "Guardrail" | "Handoff";

interface NodeKindDef {
  kind: NodeKind;
  group: NodeGroup;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  /** "match" nodes narrow the audience. "action" nodes do something. */
  role: "trigger" | "match" | "branch" | "action" | "guardrail" | "handoff";
  params: ParamDef[];
  summarize: (params: Record<string, string>, rule: InboxRule) => string;
  /** Update the rule (match/actions) given this node's parameters. */
  apply?: (rule: InboxRule, params: Record<string, string>) => InboxRule;
  /** Read this node's parameters back out of the rule. */
  read?: (rule: InboxRule) => Record<string, string>;
  /** Free-form tag for chip rendering. */
  tone: "violet" | "amber" | "primary" | "emerald" | "cyan" | "rose" | "slate" | "sky";
}

interface ParamDef {
  key: string;
  label: string;
  kind: "text" | "textarea" | "select" | "platform" | "tone" | "priority" | "team" | "saved-reply";
  placeholder?: string;
  help?: string;
  defaultValue?: string;
  options?: Array<{ value: string; label: string }>;
}

interface FlowNode {
  id: string;
  kind: NodeKind;
  label: string;
  params: Record<string, string>;
}

interface InboxFlowEditorProps {
  rule: InboxRule;
  onChange: (rule: InboxRule) => void;
}

const PLATFORM_OPTIONS = platforms.map((p) => ({ value: p.id, label: p.name }));
const SENTIMENT_OPTIONS = [
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negative" },
];
const INTENT_OPTIONS = [
  { value: "question", label: "Question" },
  { value: "info", label: "Info request" },
  { value: "support", label: "Support" },
  { value: "complaint", label: "Complaint" },
  { value: "purchase", label: "Purchase" },
  { value: "demo", label: "Demo" },
  { value: "feedback", label: "Feedback" },
  { value: "spam", label: "Spam" },
  { value: "promotion", label: "Promotion" },
  { value: "chitchat", label: "Chitchat" },
];

const GROUP_META: Record<NodeGroup, { label: string; description: string; color: string; icon: ComponentType<{ className?: string }> }> = {
  Trigger: { label: "Triggers", description: "When this rule starts", color: "text-emerald-500", icon: Zap },
  Match: { label: "Match", description: "Narrow who qualifies", color: "text-violet-500", icon: Filter },
  Branch: { label: "Branches", description: "If / else paths", color: "text-amber-500", icon: GitBranch },
  Action: { label: "Actions", description: "What the rule does", color: "text-primary", icon: Send },
  Guardrail: { label: "Guardrails", description: "Stay safe and quiet", color: "text-cyan-500", icon: ShieldCheck },
  Handoff: { label: "Hand-off", description: "Pass to a person", color: "text-rose-500", icon: UserCheck },
};

const TONE_STYLES: Record<NodeKindDef["tone"], string> = {
  violet: "border-violet-500/40 bg-violet-500/[0.04] text-violet-700 dark:text-violet-300",
  amber: "border-amber-500/40 bg-amber-500/[0.04] text-amber-700 dark:text-amber-300",
  primary: "border-primary/40 bg-primary/[0.04] text-primary",
  emerald: "border-emerald-500/40 bg-emerald-500/[0.04] text-emerald-700 dark:text-emerald-300",
  cyan: "border-cyan-500/40 bg-cyan-500/[0.04] text-cyan-700 dark:text-cyan-300",
  rose: "border-rose-500/40 bg-rose-500/[0.04] text-rose-700 dark:text-rose-300",
  slate: "border-slate-500/40 bg-slate-500/[0.04] text-slate-700 dark:text-slate-300",
  sky: "border-sky-500/40 bg-sky-500/[0.04] text-sky-700 dark:text-sky-300",
};

const NODE_PALETTE: NodeKindDef[] = [
  /* ---------------- triggers ---------------- */
  {
    kind: "trigger_dm",
    group: "Trigger",
    role: "trigger",
    label: "Inbound DM",
    description: "Rule starts when a direct message arrives.",
    icon: MessageCircle,
    tone: "emerald",
    params: [],
    summarize: () => "When an inbound DM arrives",
    apply: (rule) => ({ ...rule, match: { ...rule.match, kinds: Array.from(new Set([...rule.match.kinds, "dm"])) } }),
    read: (rule) => ({}),
  },
  {
    kind: "trigger_comment",
    group: "Trigger",
    role: "trigger",
    label: "New comment",
    description: "Rule starts when a comment is posted on a post you control.",
    icon: MessageSquare,
    tone: "emerald",
    params: [],
    summarize: () => "When a new comment arrives",
    apply: (rule) => ({ ...rule, match: { ...rule.match, kinds: Array.from(new Set([...rule.match.kinds, "comment"])) } }),
    read: (rule) => ({}),
  },
  {
    kind: "trigger_any",
    group: "Trigger",
    role: "trigger",
    label: "Any inbound",
    description: "Rule applies to every DM and comment (use sparingly).",
    icon: Inbox,
    tone: "emerald",
    params: [],
    summarize: () => "Any inbound message",
    apply: (rule) => ({ ...rule, match: { ...rule.match, kinds: ["comment", "dm"] } }),
    read: (rule) => ({}),
  },
  /* ---------------- match ---------------- */
  {
    kind: "match_platform",
    group: "Match",
    role: "match",
    label: "Platform is",
    description: "Restrict to one connected network.",
    icon: Globe2,
    tone: "violet",
    params: [{ key: "platform", label: "Platform", kind: "platform", defaultValue: platforms[0]?.id ?? "instagram" }],
    summarize: (p) => `Only on ${p.platform || "any platform"}`,
    apply: (rule, p) => ({ ...rule, match: { ...rule.match, platforms: p.platform ? [p.platform] : [] } }),
    read: (rule) => ({ platform: rule.match.platforms[0] ?? "" }),
  },
  {
    kind: "match_keyword",
    group: "Match",
    role: "match",
    label: "Mentions keyword",
    description: "Match when the message contains a keyword or phrase.",
    icon: Tag,
    tone: "violet",
    params: [{ key: "keywords", label: "Keywords", kind: "text", placeholder: "refund, broken, cancel", help: "Comma-separated. Match is case-insensitive." }],
    summarize: (p) => `Mentions “${(p.keywords || "").split(",").slice(0, 3).join(", ")}”`,
    apply: (rule, p) => ({ ...rule, match: { ...rule.match, keywords: (p.keywords || "").split(",").map((s) => s.trim()).filter(Boolean) } }),
    read: (rule) => ({ keywords: rule.match.keywords.join(", ") }),
  },
  {
    kind: "match_sentiment",
    group: "Match",
    role: "match",
    label: "Sentiment is",
    description: "Only positive, neutral, or negative messages.",
    icon: Heart,
    tone: "violet",
    params: [{ key: "sentiment", label: "Sentiment", kind: "select", defaultValue: "positive", options: SENTIMENT_OPTIONS }],
    summarize: (p) => `Sentiment is ${p.sentiment || "any"}`,
    apply: (rule, p) => ({ ...rule, match: { ...rule.match, sentiments: p.sentiment ? [p.sentiment as InboxRuleMatch["sentiments"][number]] : [] } }),
    read: (rule) => ({ sentiment: rule.match.sentiments[0] ?? "" }),
  },
  {
    kind: "match_intent",
    group: "Match",
    role: "match",
    label: "Intent is",
    description: "Filter by detected intent (purchase, support, spam…).",
    icon: SlidersHorizontal,
    tone: "violet",
    params: [{ key: "intent", label: "Intent", kind: "select", defaultValue: "question", options: INTENT_OPTIONS }],
    summarize: (p) => `Intent is ${p.intent || "any"}`,
    apply: (rule, p) => ({ ...rule, match: { ...rule.match, intents: p.intent ? [p.intent as InboxRuleMatch["intents"][number]] : [] } }),
    read: (rule) => ({ intent: rule.match.intents[0] ?? "" }),
  },
  /* ---------------- branch ---------------- */
  {
    kind: "branch",
    group: "Branch",
    role: "branch",
    label: "If / else",
    description: "Run the rest of the flow only when this check passes.",
    icon: GitBranch,
    tone: "amber",
    params: [{ key: "condition", label: "Condition label", kind: "text", placeholder: "Customer is angry" }],
    summarize: (p) => `If: ${p.condition || "always"}`,
  },
  /* ---------------- actions ---------------- */
  {
    kind: "action_welcome_dm",
    group: "Action",
    role: "action",
    label: "Send welcome DM",
    description: "Reply instantly with a friendly welcome message.",
    icon: MessageCircle,
    tone: "primary",
    params: [{ key: "template", label: "Welcome message", kind: "textarea", defaultValue: "Hey {{author}} 👋 thanks for reaching out! How can we help today?" }],
    summarize: (p) => `Send welcome: “${truncate(p.template, 32)}”`,
    apply: (rule, p) => ({ ...rule, actions: { ...rule.actions, sendWelcomeDM: true, welcomeTemplate: p.template || rule.actions.welcomeTemplate } }),
    read: (rule) => ({ template: rule.actions.welcomeTemplate }),
  },
  {
    kind: "action_away_dm",
    group: "Action",
    role: "action",
    label: "Send away DM",
    description: "Out-of-office style reply for late-night messages.",
    icon: Clock3,
    tone: "primary",
    params: [{ key: "template", label: "Away message", kind: "textarea", defaultValue: "Thanks for the message — we're away right now. We'll get back within a few hours." }],
    summarize: (p) => `Send away: “${truncate(p.template, 32)}”`,
    apply: (rule, p) => ({ ...rule, actions: { ...rule.actions, sendAwayDM: true, awayTemplate: p.template || rule.actions.awayTemplate } }),
    read: (rule) => ({ template: rule.actions.awayTemplate }),
  },
  {
    kind: "action_menu_dm",
    group: "Action",
    role: "action",
    label: "Send menu DM",
    description: "Reply with a numbered menu so users can self-serve.",
    icon: MessageSquareQuote,
    tone: "primary",
    params: [{ key: "menu", label: "Menu options (one per line)", kind: "textarea", defaultValue: "1) Pricing\n2) Demo\n3) Support" }],
    summarize: (p) => `Send menu (${(p.menu || "").split("\n").filter(Boolean).length} choices)`,
    apply: (rule, p) => ({ ...rule, actions: { ...rule.actions, sendMenuDM: true, menuChoices: p.menu || rule.actions.menuChoices } }),
    read: (rule) => ({ menu: rule.actions.menuChoices }),
  },
  {
    kind: "action_saved_reply",
    group: "Action",
    role: "action",
    label: "Send saved reply",
    description: "Reply with a pre-built snippet from the library.",
    icon: MessageSquareQuote,
    tone: "primary",
    params: [
      { key: "savedReplyId", label: "Saved reply", kind: "saved-reply" },
      { key: "body", label: "Or type a custom snippet", kind: "textarea", placeholder: "Hey {{author}}! …" },
    ],
    summarize: (p) => `Saved reply${p.body ? ` · “${truncate(p.body, 24)}”` : ""}`,
    apply: (rule, p) => ({ ...rule, actions: { ...rule.actions, sendSavedReply: true, savedReplyId: p.savedReplyId || null, savedReplyBody: p.body || rule.actions.savedReplyBody } }),
    read: (rule) => ({ savedReplyId: rule.actions.savedReplyId ?? "", body: rule.actions.savedReplyBody }),
  },
  {
    kind: "action_ai_draft",
    group: "Action",
    role: "action",
    label: "AI-draft a reply",
    description: "Queue a tone-aware AI reply for human approval.",
    icon: Sparkles,
    tone: "primary",
    params: [
      { key: "tone", label: "Tone", kind: "tone", defaultValue: "friendly" },
      { key: "useAi", label: "Use AI classifier for accuracy", kind: "select", defaultValue: "true", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
    ],
    summarize: (p) => `AI draft · ${p.tone || "friendly"} tone`,
    apply: (rule, p) => ({ ...rule, actions: { ...rule.actions, aiDraftReply: true, aiTone: p.tone || "friendly", aiClassify: p.useAi !== "false" } }),
    read: (rule) => ({ tone: rule.actions.aiTone, useAi: rule.actions.aiClassify ? "true" : "false" }),
  },
  {
    kind: "action_assign",
    group: "Action",
    role: "action",
    label: "Assign teammate",
    description: "Route the conversation to a teammate's inbox.",
    icon: UserCheck,
    tone: "primary",
    params: [{ key: "assignTo", label: "Assign to", kind: "team" }],
    summarize: (p) => `Assign to ${p.assignTo || "nobody"}`,
    apply: (rule, p) => ({ ...rule, actions: { ...rule.actions, assignTo: p.assignTo || null } }),
    read: (rule) => ({ assignTo: rule.actions.assignTo ?? "" }),
  },
  {
    kind: "action_label",
    group: "Action",
    role: "action",
    label: "Add label",
    description: "Tag the conversation so it can be filtered later.",
    icon: Tag,
    tone: "primary",
    params: [{ key: "label", label: "Label", kind: "text", placeholder: "angry-customer" }],
    summarize: (p) => `Add label #${p.label || "?"}`,
    apply: (rule, p) => ({ ...rule, actions: { ...rule.actions, label: p.label || null } }),
    read: (rule) => ({ label: rule.actions.label ?? "" }),
  },
  {
    kind: "action_priority",
    group: "Action",
    role: "action",
    label: "Set priority",
    description: "Flag the conversation as low, normal, high or urgent.",
    icon: Flag,
    tone: "primary",
    params: [{ key: "priority", label: "Priority", kind: "priority", defaultValue: "high" }],
    summarize: (p) => `Set priority: ${p.priority || "normal"}`,
    apply: (rule, p) => ({ ...rule, actions: { ...rule.actions, priority: (p.priority as InboxRuleActions["priority"]) || "normal" } }),
    read: (rule) => ({ priority: rule.actions.priority }),
  },
  {
    kind: "action_status",
    group: "Action",
    role: "action",
    label: "Move to status",
    description: "Move the conversation to a new triage column.",
    icon: Route,
    tone: "primary",
    params: [{ key: "status", label: "Status", kind: "select", defaultValue: "replied", options: [
      { value: "new", label: "New" },
      { value: "replied", label: "Replied" },
      { value: "snoozed", label: "Snoozed" },
      { value: "resolved", label: "Resolved" },
    ] }],
    summarize: (p) => `Move to ${p.status || "new"}`,
    apply: (rule, p) => ({ ...rule, actions: { ...rule.actions, setStatus: (p.status as InboxRuleActions["setStatus"]) || null } }),
    read: (rule) => ({ status: rule.actions.setStatus ?? "new" }),
  },
  {
    kind: "action_hide",
    group: "Action",
    role: "action",
    label: "Hide as spam",
    description: "Hide obvious spam from the main triage board.",
    icon: X,
    tone: "rose",
    params: [],
    summarize: () => "Hide from the main board",
    apply: (rule) => ({ ...rule, actions: { ...rule.actions, hide: true, setStatus: rule.actions.setStatus ?? "resolved" } }),
    read: () => ({}),
  },
  {
    kind: "action_notify",
    group: "Action",
    role: "action",
    label: "Notify channel",
    description: "Ping a Slack-style channel about the conversation.",
    icon: Bell,
    tone: "primary",
    params: [{ key: "channel", label: "Channel", kind: "text", defaultValue: "#engage" }],
    summarize: (p) => `Notify ${p.channel || "#engage"}`,
    apply: (rule, p) => ({ ...rule, actions: { ...rule.actions, notify: true, notifyChannel: p.channel || rule.actions.notifyChannel } }),
    read: (rule) => ({ channel: rule.actions.notifyChannel }),
  },
  /* ---------------- guardrail ---------------- */
  {
    kind: "rate_limit",
    group: "Guardrail",
    role: "guardrail",
    label: "Rate limit",
    description: "Skip if the channel already hit its reply budget.",
    icon: ShieldCheck,
    tone: "cyan",
    params: [
      { key: "maxPerHour", label: "Max replies per hour", kind: "text", defaultValue: "40" },
      { key: "quietHours", label: "Quiet hours (e.g. 22-08)", kind: "text", placeholder: "22-08" },
    ],
    summarize: (p) => `Cap ${p.maxPerHour || "40"}/h${p.quietHours ? ` · quiet ${p.quietHours}` : ""}`,
  },
  /* ---------------- handoff ---------------- */
  {
    kind: "human_handoff",
    group: "Handoff",
    role: "handoff",
    label: "Human handoff",
    description: "Mark the conversation for a human to take over.",
    icon: UserCheck,
    tone: "rose",
    params: [{ key: "note", label: "Note for the teammate", kind: "textarea", placeholder: "Sensitive topic — please review." }],
    summarize: (p) => `Hand off to human${p.note ? ` · “${truncate(p.note, 24)}”` : ""}`,
  },
];

const KIND_BY_KEY = Object.fromEntries(NODE_PALETTE.map((n) => [n.kind, n])) as Record<NodeKind, NodeKindDef>;

function truncate(s: string | undefined, n: number) {
  const value = (s ?? "").trim();
  return value.length > n ? `${value.slice(0, n - 1)}…` : value;
}

let nodeIdCounter = 0;
function nodeId(prefix = "n") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}_${Date.now()}_${String(++nodeIdCounter).padStart(3, "0")}`;
}

function defaultParamsFor(kind: NodeKind): Record<string, string> {
  const def = KIND_BY_KEY[kind];
  const out: Record<string, string> = {};
  def.params.forEach((p) => {
    if (p.defaultValue !== undefined) out[p.key] = p.defaultValue;
  });
  return out;
}

function detectRuleFlow(rule: InboxRule): FlowNode[] {
  // Try to read the persisted flow first; otherwise infer from match+actions.
  const persisted = Array.isArray(rule.flow) ? (rule.flow as FlowNode[]) : [];
  if (persisted.length) return persisted;
  const nodes: FlowNode[] = [];
  // Triggers
  if (rule.match.kinds.includes("dm") && !rule.match.kinds.includes("comment")) {
    nodes.push({ id: nodeId("trig"), kind: "trigger_dm", label: "Inbound DM", params: {} });
  } else if (rule.match.kinds.includes("comment") && !rule.match.kinds.includes("dm")) {
    nodes.push({ id: nodeId("trig"), kind: "trigger_comment", label: "New comment", params: {} });
  } else {
    nodes.push({ id: nodeId("trig"), kind: "trigger_any", label: "Any inbound", params: {} });
  }
  // Match
  if (rule.match.platforms[0]) {
    nodes.push({ id: nodeId("m"), kind: "match_platform", label: "Platform is", params: { platform: rule.match.platforms[0] } });
  }
  if (rule.match.keywords.length) {
    nodes.push({ id: nodeId("m"), kind: "match_keyword", label: "Mentions keyword", params: { keywords: rule.match.keywords.join(", ") } });
  }
  if (rule.match.sentiments[0]) {
    nodes.push({ id: nodeId("m"), kind: "match_sentiment", label: "Sentiment is", params: { sentiment: rule.match.sentiments[0] } });
  }
  if (rule.match.intents[0]) {
    nodes.push({ id: nodeId("m"), kind: "match_intent", label: "Intent is", params: { intent: rule.match.intents[0] } });
  }
  // Actions
  const a = rule.actions;
  if (a.sendWelcomeDM) nodes.push({ id: nodeId("a"), kind: "action_welcome_dm", label: "Send welcome DM", params: { template: a.welcomeTemplate } });
  if (a.sendAwayDM) nodes.push({ id: nodeId("a"), kind: "action_away_dm", label: "Send away DM", params: { template: a.awayTemplate } });
  if (a.sendMenuDM) nodes.push({ id: nodeId("a"), kind: "action_menu_dm", label: "Send menu DM", params: { menu: a.menuChoices } });
  if (a.sendSavedReply) nodes.push({ id: nodeId("a"), kind: "action_saved_reply", label: "Send saved reply", params: { savedReplyId: a.savedReplyId ?? "", body: a.savedReplyBody } });
  if (a.aiDraftReply) nodes.push({ id: nodeId("a"), kind: "action_ai_draft", label: "AI-draft a reply", params: { tone: a.aiTone, useAi: a.aiClassify ? "true" : "false" } });
  if (a.assignTo) nodes.push({ id: nodeId("a"), kind: "action_assign", label: "Assign teammate", params: { assignTo: a.assignTo } });
  if (a.label) nodes.push({ id: nodeId("a"), kind: "action_label", label: "Add label", params: { label: a.label } });
  if (a.priority !== "normal") nodes.push({ id: nodeId("a"), kind: "action_priority", label: "Set priority", params: { priority: a.priority } });
  if (a.setStatus) nodes.push({ id: nodeId("a"), kind: "action_status", label: "Move to status", params: { status: a.setStatus } });
  if (a.hide) nodes.push({ id: nodeId("a"), kind: "action_hide", label: "Hide as spam", params: {} });
  if (a.notify) nodes.push({ id: nodeId("a"), kind: "action_notify", label: "Notify channel", params: { channel: a.notifyChannel } });
  return nodes;
}

function flowToRule(baseRule: InboxRule, nodes: FlowNode[]): InboxRule {
  // Reset match/actions to defaults, then re-apply from nodes.
  const reset = emptyRule();
  let next: InboxRule = { ...baseRule, match: { ...reset.match }, actions: { ...reset.actions } };
  nodes.forEach((node) => {
    const def = KIND_BY_KEY[node.kind];
    if (def?.apply) {
      next = def.apply(next, node.params);
    }
  });
  return { ...next, flow: nodes };
}

function summarizeRule(rule: InboxRule): string {
  const m = rule.match;
  const when: string[] = [];
  when.push(m.kinds.length ? m.kinds.map((k) => (k === "dm" ? "DMs" : "comments")).join(" / ") : "inbound");
  if (m.platforms.length) when.push(`on ${m.platforms.map((p) => platforms.find((x) => x.id === p)?.name ?? p).join(", ")}`);
  if (m.sentiments.length) when.push(`when ${m.sentiments.join("/")}`);
  if (m.intents.length) when.push(`intent = ${m.intents.join("/")}`);
  if (m.keywords.length) when.push(`mentions “${m.keywords.slice(0, 3).join(", ")}”`);
  const then: string[] = [];
  const a = rule.actions;
  if (a.sendWelcomeDM) then.push("welcome DM");
  if (a.sendAwayDM) then.push("away DM");
  if (a.sendMenuDM) then.push("menu DM");
  if (a.sendSavedReply) then.push("saved reply");
  if (a.aiDraftReply) then.push("AI draft");
  if (a.assignTo) then.push(`assign ${a.assignTo}`);
  if (a.label) then.push(`label ${a.label}`);
  if (a.priority !== "normal") then.push(`${a.priority} priority`);
  if (a.setStatus) then.push(`move to ${a.setStatus}`);
  if (a.hide) then.push("hide spam");
  if (a.notify) then.push(`notify ${a.notifyChannel}`);
  return `${when.join(" · ")} → ${then.join(" · ") || "no action yet"}`;
}

/* --------------------- compact primitives --------------------- */

function NodeCard({ node, selected, onSelect, onAdd, onRemove, onPatch }: {
  node: FlowNode;
  selected: boolean;
  onSelect: () => void;
  onAdd: () => void;
  onRemove: () => void;
  onPatch: (params: Record<string, string>) => void;
}) {
  const def = KIND_BY_KEY[node.kind];
  const Icon = def.icon;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(); }}
      className={cn(
        "group relative w-[200px] sm:w-[208px] shrink-0 cursor-pointer select-none rounded-2xl border bg-card/95 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        TONE_STYLES[def.tone],
        selected && "ring-2 ring-primary border-primary shadow-md",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-background/70 shadow-inner">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold leading-tight">{def.label}</p>
          <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-muted-foreground">{def.summarize(node.params, emptyRule())}</p>
        </div>
        <button
          type="button"
          aria-label="Remove block"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background/80 hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <button
        type="button"
        aria-label="Add step after this"
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="absolute -bottom-2.5 left-1/2 z-10 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

function Connector({ last = false }: { last?: boolean }) {
  return (
    <div className="relative flex h-12 w-8 shrink-0 items-center justify-center" aria-hidden>
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary/40 via-primary/60 to-primary/30" />
      {!last && <ArrowDown className="relative z-10 h-3 w-3 rounded-full bg-background p-0.5 text-primary" />}
    </div>
  );
}

function GroupHeader({ group }: { group: NodeGroup }) {
  const meta = GROUP_META[group];
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-1.5 px-1">
      <Icon className={cn("h-3 w-3", meta.color)} />
      <p className={cn("text-[9px] font-semibold uppercase tracking-[0.16em]", meta.color)}>{meta.label}</p>
    </div>
  );
}

function BlockInPalette({ def, onAdd }: { def: NodeKindDef; onAdd: () => void }) {
  const Icon = def.icon;
  return (
    <button
      type="button"
      onClick={onAdd}
      className="group flex w-full items-start gap-2 rounded-xl border border-transparent p-2 text-left transition-all hover:border-primary/25 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border bg-card/80", TONE_STYLES[def.tone])}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-semibold leading-tight">{def.label}</span>
        <span className="mt-0.5 block line-clamp-2 text-[9px] leading-snug text-muted-foreground">{def.description}</span>
      </span>
      <Plus className="mt-1 h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

/* --------------------- inspector --------------------- */

function Field({ parameter, value, onChange }: { parameter: ParamDef; value: string; onChange: (v: string) => void }) {
  const { members } = useTeamMembers();
  const { replies } = useSavedReplies();

  if (parameter.kind === "select") {
    const options = parameter.options ?? [];
    return (
      <div className="space-y-1.5">
        <Label className="text-[10px] font-semibold">{parameter.label}</Label>
        <Select value={value || parameter.defaultValue || ""} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={parameter.placeholder} /></SelectTrigger>
          <SelectContent>
            {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {parameter.help && <p className="text-[9px] leading-relaxed text-muted-foreground">{parameter.help}</p>}
      </div>
    );
  }
  if (parameter.kind === "platform") {
    return (
      <div className="space-y-1.5">
        <Label className="text-[10px] font-semibold">{parameter.label}</Label>
        <Select value={value || parameter.defaultValue || ""} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={parameter.placeholder} /></SelectTrigger>
          <SelectContent>
            {PLATFORM_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (parameter.kind === "tone") {
    const options = DEFAULT_TONES.map((t) => ({ value: t, label: t }));
    return (
      <div className="space-y-1.5">
        <Label className="text-[10px] font-semibold">{parameter.label}</Label>
        <Select value={value || parameter.defaultValue || "friendly"} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    );
  }
  if (parameter.kind === "priority") {
    const options = DEFAULT_PRIORITIES.map((p) => ({ value: p, label: p }));
    return (
      <div className="space-y-1.5">
        <Label className="text-[10px] font-semibold">{parameter.label}</Label>
        <Select value={value || parameter.defaultValue || "normal"} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    );
  }
  if (parameter.kind === "team") {
    return (
      <div className="space-y-1.5">
        <Label className="text-[10px] font-semibold">{parameter.label}</Label>
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick a teammate" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nobody</SelectItem>
            {members.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (parameter.kind === "saved-reply") {
    return (
      <div className="space-y-1.5">
        <Label className="text-[10px] font-semibold">{parameter.label}</Label>
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick from your library" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {replies.map((r) => <SelectItem key={r.id} value={r.id}>{r.name || r.body.slice(0, 40)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (parameter.kind === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label className="text-[10px] font-semibold">{parameter.label}</Label>
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={parameter.placeholder} rows={3} className="resize-none text-xs" />
        {parameter.help && <p className="text-[9px] leading-relaxed text-muted-foreground">{parameter.help}</p>}
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-semibold">{parameter.label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={parameter.placeholder} className="h-8 text-xs" />
      {parameter.help && <p className="text-[9px] leading-relaxed text-muted-foreground">{parameter.help}</p>}
    </div>
  );
}

function Inspector({ node, onPatch, onRemove, onClose }: { node: FlowNode; onPatch: (p: Record<string, string>) => void; onRemove: () => void; onClose: () => void }) {
  const def = KIND_BY_KEY[node.kind];
  const Icon = def.icon;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start gap-2.5 border-b border-border/60 p-3">
        <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg border bg-card/80", TONE_STYLES[def.tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-tight">{def.label}</p>
          <p className="mt-0.5 text-[9px] text-muted-foreground">{def.description}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} aria-label="Close inspector">
          <X className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-3">
          {def.params.length === 0 ? (
            <p className="rounded-lg bg-muted/40 p-3 text-[10px] text-muted-foreground">This block needs no configuration — it just runs.</p>
          ) : def.params.map((p) => (
            <Field key={p.key} parameter={p} value={node.params[p.key] ?? ""} onChange={(v) => onPatch({ [p.key]: v })} />
          ))}
        </div>
      </ScrollArea>
      <div className="flex gap-2 border-t border-border/60 p-3">
        <Button variant="outline" size="sm" className="flex-1 text-[10px]" onClick={onRemove}>
          <Trash2 className="mr-1 h-3 w-3" /> Remove
        </Button>
      </div>
    </div>
  );
}

/* --------------------- main editor --------------------- */

export function InboxFlowEditor({ rule, onChange }: InboxFlowEditorProps) {
  const [nodes, setNodes] = useState<FlowNode[]>(() => detectRuleFlow(rule));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCatalog, setShowCatalog] = useState(true);

  const selected = useMemo(() => nodes.find((n) => n.id === selectedId) ?? null, [nodes, selectedId]);
  const triggers = nodes.filter((n) => KIND_BY_KEY[n.kind].role === "trigger");
  const matches = nodes.filter((n) => KIND_BY_KEY[n.kind].role === "match");
  const actions = nodes.filter((n) => KIND_BY_KEY[n.kind].role === "action");
  const guardrails = nodes.filter((n) => KIND_BY_KEY[n.kind].role === "guardrail");
  const handoffs = nodes.filter((n) => KIND_BY_KEY[n.kind].role === "handoff");

  const update = useCallback((next: FlowNode[]) => {
    setNodes(next);
    onChange(flowToRule(rule, next));
  }, [rule, onChange]);

  const addNode = (kind: NodeKind, afterId?: string) => {
    const node: FlowNode = { id: nodeId(), kind, label: KIND_BY_KEY[kind].label, params: defaultParamsFor(kind) };
    if (!afterId) {
      update([...nodes, node]);
    } else {
      const idx = nodes.findIndex((n) => n.id === afterId);
      const next = [...nodes];
      next.splice(idx + 1, 0, node);
      update(next);
    }
    setSelectedId(node.id);
  };

  const removeNode = (id: string) => {
    if (KIND_BY_KEY[nodes.find((n) => n.id === id)?.kind ?? "trigger_any"].role === "trigger" && triggers.length === 1) {
      toast.error("A rule needs at least one trigger");
      return;
    }
    const next = nodes.filter((n) => n.id !== id);
    update(next);
    if (selectedId === id) setSelectedId(null);
  };

  const patchNode = (id: string, params: Record<string, string>) => {
    const next = nodes.map((n) => n.id === id ? { ...n, params: { ...n.params, ...params } } : n);
    update(next);
  };

  const summary = useMemo(() => summarizeRule(flowToRule(rule, nodes)), [rule, nodes]);
  const filteredPalette = useMemo(() => {
    if (!search.trim()) return NODE_PALETTE;
    const q = search.toLowerCase();
    return NODE_PALETTE.filter((n) => `${n.label} ${n.description} ${n.group}`.toLowerCase().includes(q));
  }, [search]);

  const groups: NodeGroup[] = ["Trigger", "Match", "Branch", "Action", "Guardrail", "Handoff"];

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_18rem] lg:grid-cols-[14rem_minmax(0,1fr)_18rem]">
      {/* Block library — collapses to top on mobile */}
      <div className={cn(
        "rounded-2xl border border-border/60 bg-card/60 shadow-sm lg:block",
        showCatalog ? "block" : "hidden lg:block",
      )}>
        <div className="border-b border-border/60 p-2.5">
          <p className="text-[11px] font-semibold">Block library</p>
          <p className="mt-0.5 text-[9px] text-muted-foreground">Drag-and-drop blocks onto the canvas.</p>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search blocks…" className="h-7 pl-7 text-[10px]" />
          </div>
        </div>
        <ScrollArea className="h-[18rem] sm:h-[22rem] lg:h-[26rem]">
          <div className="space-y-3 p-2.5">
            {groups.map((g) => {
              const list = filteredPalette.filter((n) => n.group === g);
              if (!list.length) return null;
              return (
                <div key={g}>
                  <GroupHeader group={g} />
                  <div className="mt-1 space-y-0.5">
                    {list.map((n) => <BlockInPalette key={n.kind} def={n} onAdd={() => addNode(n.kind)} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Canvas */}
      <div className="relative min-h-[16rem] overflow-hidden rounded-2xl border border-border/60 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--muted-foreground)/0.18)_1px,transparent_0)] [background-size:18px_18px]">
        <div className="flex items-center justify-between border-b border-border/60 bg-card/80 px-3 py-2 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <p className="text-[11px] font-semibold">Rule flow</p>
            <span className="hidden text-[9px] text-muted-foreground sm:inline">Tap a block to configure it.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[9px]">{triggers.length} trigger · {matches.length} match · {actions.length} action</Badge>
            <Button type="button" size="icon" variant="ghost" className="h-6 w-6 lg:hidden" onClick={() => setShowCatalog((s) => !s)} aria-label="Toggle block library">
              <Layers3 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[18rem] sm:h-[22rem] lg:h-[26rem]">
          <div className="flex flex-col gap-2 p-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-0 sm:p-6">
            {nodes.length === 0 ? (
              <div className="flex w-full flex-col items-center justify-center gap-2 py-12 text-center">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Zap className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold">Start with a trigger</p>
                <p className="max-w-xs text-[10px] text-muted-foreground">Pick a block from the library on the left, or use one of the templates below.</p>
              </div>
            ) : (
              nodes.map((node, idx) => (
                <div key={node.id} className="flex flex-col items-center sm:flex-row">
                  <NodeCard
                    node={node}
                    selected={selectedId === node.id}
                    onSelect={() => setSelectedId(node.id)}
                    onAdd={() => addNode(KIND_BY_KEY[node.kind].role === "trigger" ? "match_platform" : "action_ai_draft", node.id)}
                    onRemove={() => removeNode(node.id)}
                    onPatch={(p) => patchNode(node.id, p)}
                  />
                  {idx < nodes.length - 1 && <Connector />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-card/90 px-2.5 py-1.5 text-[9px] shadow-md backdrop-blur">
          <span className="font-semibold text-muted-foreground">In plain English:</span>
          <span className="flex-1 text-foreground/80">{summary}</span>
        </div>
      </div>

      {/* Inspector — collapses to bottom on mobile */}
      <div className="rounded-2xl border border-border/60 bg-card/60 shadow-sm">
        {selected ? (
          <Inspector
            node={selected}
            onPatch={(p) => patchNode(selected.id, p)}
            onRemove={() => removeNode(selected.id)}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full flex-col p-3">
            <p className="text-[11px] font-semibold">Inspector</p>
            <p className="mt-0.5 text-[9px] text-muted-foreground">Tap a block to configure it.</p>
            <div className="mt-3 grid gap-2">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-[10px]">
                <p className="font-semibold">What this rule will do</p>
                <p className="mt-1 text-muted-foreground">{summary}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-[10px]">
                <p className="font-semibold">How to read the flow</p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• <span className="font-semibold text-emerald-500">Triggers</span> start the rule.</li>
                  <li>• <span className="font-semibold text-violet-500">Match</span> blocks narrow who qualifies.</li>
                  <li>• <span className="font-semibold text-primary">Actions</span> are what happens next.</li>
                  <li>• <span className="font-semibold text-rose-500">Hand-off</span> passes to a teammate.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InboxFlowEditor;
