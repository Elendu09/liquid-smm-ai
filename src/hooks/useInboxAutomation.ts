import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeMessage, type Intent, type Sentiment } from "@/hooks/useInboxAnalysis";
import { aiEngage } from "@/hooks/useAiEngage";
import type { InboxItem } from "@/pages/dashboard/views/InboxBoard";
import { isGuestSession } from "@/hooks/useGuest";

/**
 * Configurable inbox automation.
 *
 * Rules route inbound comments/DMs by sentiment, intent, platform and
 * keywords, then take a focused action (set status, assign, draft AI reply,
 * send a welcome / away / menu DM, fire a saved reply, hide spam, label or
 * prioritise). The classic "match + actions" form remains the persisted
 * source of truth, while optional `flow` (an n8n-style ordered list of
 * blocks) lets the visual editor render and edit the same rule.
 *
 * Rules persist in `automation_rules` with kind `inbox-routing`, with a
 * localStorage fallback for guests so the demo still works.
 */

export type InboxStatus = InboxItem["status"];

export type InboxPriority = "low" | "normal" | "high" | "urgent";

export interface InboxRuleMatch {
  /** Empty array = matches everything for that facet. */
  kinds: ("comment" | "dm")[];
  platforms: string[];
  sentiments: Sentiment[];
  intents: Intent[];
  /** Any-of keyword match against the message body. */
  keywords: string[];
}

export interface InboxRuleActions {
  setStatus: InboxStatus | null;
  assignTo: string | null;
  /** Apply a label/tag to the conversation. */
  label: string | null;
  /** Conversation priority. */
  priority: InboxPriority;
  /** Hide obvious spam / off-topic messages. */
  hide: boolean;
  /** Queue an AI draft reply on the message for human approval. */
  aiDraftReply: boolean;
  aiTone: string;
  /** Use the AI classifier (ai-engage) instead of the local heuristic. */
  aiClassify: boolean;
  /** Send a welcome DM to a new inbound DM. */
  sendWelcomeDM: boolean;
  welcomeTemplate: string;
  /** Send an away / out-of-office DM during quiet hours. */
  sendAwayDM: boolean;
  awayTemplate: string;
  /** Reply with a numbered menu of choices for common questions. */
  sendMenuDM: boolean;
  menuChoices: string;
  /** Send a saved reply (by id, or a literal body) for common questions. */
  sendSavedReply: boolean;
  savedReplyId: string | null;
  savedReplyBody: string;
  /** Send an in-app notification to the workspace. */
  notify: boolean;
  notifyChannel: string;
}

export interface InboxRule {
  id: string;
  name: string;
  description?: string;
  /** Visual category for default libraries and lists. */
  category: "dm" | "comment" | "triage" | "saved-reply" | "custom";
  /** Wether the rule ships out-of-the-box (we don't auto-disable on first run). */
  builtIn?: boolean;
  enabled: boolean;
  match: InboxRuleMatch;
  actions: InboxRuleActions;
  runs: number;
  /** Optional n8n-style visual flow. Mirrors match/actions for legacy rules. */
  flow?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_TONES = ["friendly", "professional", "witty", "empathetic", "concise"] as const;
export const DEFAULT_PRIORITIES: InboxPriority[] = ["low", "normal", "high", "urgent"];
export const DEFAULT_CATEGORIES: InboxRule["category"][] = ["dm", "comment", "triage", "saved-reply", "custom"];

export const emptyRule = (): InboxRule => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  category: "custom",
  builtIn: false,
  enabled: true,
  match: { kinds: [], platforms: [], sentiments: [], intents: [], keywords: [] },
  actions: {
    setStatus: null,
    assignTo: null,
    label: null,
    priority: "normal",
    hide: false,
    aiDraftReply: false,
    aiTone: "friendly",
    aiClassify: false,
    sendWelcomeDM: false,
    welcomeTemplate: "Hey {{author}} 👋 thanks for reaching out! What can we help with?",
    sendAwayDM: false,
    awayTemplate: "Thanks for the message — we're away right now. We'll get back to you within a few hours.",
    sendMenuDM: false,
    menuChoices: "1) Pricing\n2) Demo\n3) Support",
    sendSavedReply: false,
    savedReplyId: null,
    savedReplyBody: "",
    notify: false,
    notifyChannel: "#engage",
  },
  runs: 0,
});

const RULE_KIND = "inbox-routing";
const STORAGE_KEY = "smmpilot:engage:inbox-rules";

/* ------------------------------ defaults ------------------------------ */

/**
 * Curated default rules that cover the four core engagement areas called out
 * by every major social-media automation guide:
 *  - Direct messages: welcome, away, menu chatbot
 *  - Comment triggers: keyword auto-replies
 *  - Inbox triage: label, prioritise, assign, hide
 *  - Saved replies: template library for common questions
 *
 * Shipped once per workspace. Users can edit, disable, or delete them.
 */
export const DEFAULT_INBOX_RULES: InboxRule[] = [
  {
    id: "default-dm-welcome",
    name: "Greet new DMs",
    description: "Send a friendly welcome message to any new DM so the conversation starts instantly.",
    category: "dm",
    builtIn: true,
    enabled: true,
    runs: 0,
    match: { kinds: ["dm"], platforms: [], sentiments: [], intents: [], keywords: [] },
    actions: {
      ...emptyRule().actions,
      sendWelcomeDM: true,
      welcomeTemplate: "Hey {{author}} 👋 thanks for reaching out! How can we help today?",
    },
  },
  {
    id: "default-dm-away",
    name: "Away message (overnight)",
    description: "Reply to inbound DMs overnight with a polite away note so nobody feels ghosted.",
    category: "dm",
    builtIn: true,
    enabled: false,
    runs: 0,
    match: { kinds: ["dm"], platforms: [], sentiments: [], intents: [], keywords: [] },
    actions: {
      ...emptyRule().actions,
      sendAwayDM: true,
      awayTemplate: "Hey {{author}} — we're away right now. A teammate will reply within a few hours 🙌",
    },
  },
  {
    id: "default-dm-menu",
    name: "Menu DM chatbot",
    description: "Reply to common questions with a numbered menu so users can self-serve in seconds.",
    category: "dm",
    builtIn: true,
    enabled: false,
    runs: 0,
    match: { kinds: ["dm"], platforms: [], sentiments: [], intents: ["question", "info"], keywords: ["help", "hi", "hello", "pricing"] },
    actions: {
      ...emptyRule().actions,
      sendMenuDM: true,
      menuChoices: "1) Pricing & plans\n2) Book a demo\n3) Talk to support\n4) Just saying hi 👋",
    },
  },
  {
    id: "default-comment-keyword",
    name: "Auto-reply to \"price\" / \"link\" comments",
    description: "When a comment contains a pricing or link request, queue a public reply with a saved snippet.",
    category: "comment",
    builtIn: true,
    enabled: true,
    runs: 0,
    match: { kinds: ["comment"], platforms: [], sentiments: [], intents: ["question", "info"], keywords: ["price", "pricing", "link", "buy", "cost"] },
    actions: {
      ...emptyRule().actions,
      sendSavedReply: true,
      savedReplyId: null,
      savedReplyBody: "Hey {{author}}! 💌 pricing and the link are in our bio — drop us a DM if you have questions!",
      setStatus: "replied",
      label: "pricing-question",
    },
  },
  {
    id: "default-triage-angry",
    name: "Route angry customers to support",
    description: "Negative-sentiment comments or DMs are labelled, prioritised and assigned to your support lead.",
    category: "triage",
    builtIn: true,
    enabled: true,
    runs: 0,
    match: { kinds: ["comment", "dm"], platforms: [], sentiments: ["negative"], intents: ["complaint", "support"], keywords: [] },
    actions: {
      ...emptyRule().actions,
      setStatus: "new",
      assignTo: "Support lead",
      label: "angry-customer",
      priority: "urgent",
      notify: true,
      notifyChannel: "#support-escalations",
      aiClassify: true,
      aiDraftReply: true,
      aiTone: "empathetic",
    },
  },
  {
    id: "default-triage-spam",
    name: "Hide obvious spam",
    description: "Generic promo comments get labelled and hidden from the main board so the team focuses on real fans.",
    category: "triage",
    builtIn: true,
    enabled: true,
    runs: 0,
    match: { kinds: ["comment"], platforms: [], sentiments: [], intents: ["spam", "promotion"], keywords: ["airdrop", "free crypto", "click my bio", "follow for follow"] },
    actions: {
      ...emptyRule().actions,
      hide: true,
      label: "spam",
      setStatus: "resolved",
    },
  },
  {
    id: "default-triage-priority",
    name: "Prioritise DMs from warm leads",
    description: "DMs that look like high-intent leads are flagged high-priority and assigned to sales.",
    category: "triage",
    builtIn: true,
    enabled: false,
    runs: 0,
    match: { kinds: ["dm"], platforms: [], sentiments: ["positive"], intents: ["purchase", "demo"], keywords: ["quote", "demo", "trial", "pricing"] },
    actions: {
      ...emptyRule().actions,
      setStatus: "new",
      assignTo: "Sales",
      label: "warm-lead",
      priority: "high",
      aiDraftReply: true,
      aiTone: "professional",
    },
  },
  {
    id: "default-saved-reply-faq",
    name: "Saved-reply FAQ library",
    description: "Pre-built snippets the team can one-tap to common questions — ships with the workspace.",
    category: "saved-reply",
    builtIn: true,
    enabled: true,
    runs: 0,
    match: { kinds: ["comment", "dm"], platforms: [], sentiments: [], intents: ["question"], keywords: ["hours", "open", "shipping"] },
    actions: {
      ...emptyRule().actions,
      sendSavedReply: true,
      savedReplyBody: "Hi {{author}} — we ship Mon-Fri and reply to DMs within 2 business hours. Thanks for reaching out! 💛",
      setStatus: "replied",
    },
  },
];

/* ------------------------------ store ------------------------------ */

let mode: "local" | "remote" = "local";
let remoteUserId: string | null = null;
let cache: InboxRule[] = readLocal();
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }
function setCache(next: InboxRule[]) { cache = next; emit(); }

function readLocal(): InboxRule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as InboxRule[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch { /* fall through to seeding */ }
  return seedDefaults();
}

function seedDefaults(): InboxRule[] {
  const now = new Date().toISOString();
  return DEFAULT_INBOX_RULES.map((r) => ({ ...r, createdAt: now, updatedAt: now }));
}

function writeLocal(next: InboxRule[]) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  setCache(next);
}

/** Re-seed defaults into local storage when the workspace has none yet. */
export function ensureInboxDefaults() {
  if (mode !== "local") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) writeLocal(seedDefaults());
  } catch { /* ignore */ }
}

type Row = {
  id: string;
  name: string;
  enabled: boolean;
  config: { match?: Partial<InboxRuleMatch>; actions?: Partial<InboxRuleActions>; runs?: number; description?: string; category?: InboxRule["category"]; builtIn?: boolean; flow?: unknown[]; createdAt?: string; updatedAt?: string } | null;
};

const rowToRule = (r: Row): InboxRule => {
  const base = emptyRule();
  return {
    id: r.id,
    name: r.name,
    description: r.config?.description ?? "",
    category: r.config?.category ?? "custom",
    builtIn: r.config?.builtIn ?? false,
    enabled: r.enabled,
    match: { ...base.match, ...(r.config?.match ?? {}) },
    actions: { ...base.actions, ...(r.config?.actions ?? {}) },
    runs: r.config?.runs ?? 0,
    flow: r.config?.flow,
    createdAt: r.config?.createdAt,
    updatedAt: r.config?.updatedAt,
  };
};

let channel: ReturnType<typeof supabase.channel> | null = null;
let hydration: Promise<void> | null = null;

async function refetch() {
  const { data } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("kind", RULE_KIND)
    .order("created_at", { ascending: true });
  const rows = ((data as unknown as Row[] | null) ?? []).map(rowToRule);
  // Always merge defaults so the workspace ships pre-seeded, even for users.
  const merged = mergeDefaults(rows);
  setCache(merged);
}

function mergeDefaults(existing: InboxRule[]): InboxRule[] {
  const ids = new Set(existing.map((r) => r.id));
  const missing = DEFAULT_INBOX_RULES.filter((d) => !ids.has(d.id));
  if (!missing.length) return existing;
  const now = new Date().toISOString();
  return [...existing, ...missing.map((d) => ({ ...d, createdAt: now, updatedAt: now }))];
}

async function hydrateRemote(userId: string) {
  await refetch();
  if (channel) supabase.removeChannel(channel);
  channel = supabase
    .channel(`inbox_rules:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "automation_rules", filter: `user_id=eq.${userId}` },
      () => { void refetch(); },
    )
    .subscribe();
}

async function ensureAuthMode() {
  if (hydration) return hydration;
  hydration = (async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id ?? null;
    if (uid) { mode = "remote"; remoteUserId = uid; await hydrateRemote(uid); }
    else {
      mode = "local"; remoteUserId = null;
      // Seed defaults for guests so the demo isn't empty.
      if (isGuestSession()) ensureInboxDefaults();
      setCache(readLocal());
    }
  })();
  return hydration;
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((_e, session) => {
    const uid = session?.user?.id ?? null;
    if (uid && uid !== remoteUserId) {
      mode = "remote"; remoteUserId = uid; hydration = null;
      void hydrateRemote(uid);
    } else if (!uid && mode !== "local") {
      mode = "local"; remoteUserId = null;
      if (channel) { supabase.removeChannel(channel); channel = null; }
      hydration = null;
      setCache(readLocal());
    }
  });
}

/* ------------------------------ matching ------------------------------ */

const anyOrEmpty = <T,>(list: T[], value: T) => list.length === 0 || list.includes(value);

export interface Classification {
  sentiment: Sentiment;
  intent: Intent;
}

/** Does this rule apply to the message given its classification? */
export function ruleMatches(rule: InboxRule, item: InboxItem, cls: Classification): boolean {
  const m = rule.match;
  if (!anyOrEmpty(m.kinds, item.kind)) return false;
  if (!anyOrEmpty(m.platforms, item.platform)) return false;
  if (!anyOrEmpty(m.sentiments, cls.sentiment)) return false;
  if (!anyOrEmpty(m.intents, cls.intent)) return false;
  if (m.keywords.length) {
    const body = (item.message ?? "").toLowerCase();
    if (!m.keywords.some((k) => k.trim() && body.includes(k.trim().toLowerCase()))) return false;
  }
  return true;
}

export interface AutomationOutcome {
  itemId: string;
  ruleId: string;
  ruleName: string;
  patch: Partial<InboxItem>;
  note: string;
}

/**
 * Run the enabled rules over a set of messages. Pure-ish: it returns the
 * patches to apply so the caller controls persistence and can preview a dry run.
 */
export async function runInboxAutomation(
  items: InboxItem[],
  rules: InboxRule[],
  opts: { onlyNew?: boolean; limit?: number } = {},
): Promise<AutomationOutcome[]> {
  const active = rules.filter((r) => r.enabled);
  if (!active.length) return [];
  const pool = items
    .filter((i) => (opts.onlyNew === false ? true : i.status === "new"))
    .filter((i) => !i.autoRuleId)
    .slice(0, opts.limit ?? 25);

  const results: AutomationOutcome[] = [];

  for (const item of pool) {
    let cls: Classification = analyzeMessage(item.message);
    const needsAi = active.some((r) => r.actions.aiClassify);
    if (needsAi) {
      const ai = await aiEngage.analyzeComment(
        { text: item.message, author: item.author, platform: item.platform },
        true,
      );
      if (ai) cls = { sentiment: ai.sentiment, intent: ai.intent };
    }

    const rule = active.find((r) => ruleMatches(r, item, cls));
    if (!rule) continue;

    const patch: Partial<InboxItem> = { autoRuleId: rule.id };
    const notes: string[] = [];

    if (rule.actions.setStatus) {
      patch.status = rule.actions.setStatus;
      notes.push(`moved to ${rule.actions.setStatus}`);
    }
    if (rule.actions.assignTo) {
      patch.assignee = rule.actions.assignTo;
      notes.push(`assigned to ${rule.actions.assignTo}`);
    }
    if (rule.actions.label) {
      patch.label = rule.actions.label;
      notes.push(`labelled ${rule.actions.label}`);
    }
    if (rule.actions.priority && rule.actions.priority !== "normal") {
      patch.priority = rule.actions.priority;
      notes.push(`${rule.actions.priority} priority`);
    }
    if (rule.actions.hide) {
      patch.hidden = true;
      patch.status = patch.status ?? "resolved";
      notes.push("hidden as spam");
    }
    if (rule.actions.aiDraftReply) {
      const draft = await aiEngage.draftReply(
        {
          text: item.message,
          author: item.author,
          platform: item.platform,
          tone: rule.actions.aiTone,
          count: 1,
        },
        true,
      );
      const first = draft?.options?.[0];
      if (first) {
        patch.aiDraft = first;
        notes.push("AI reply drafted");
      }
    }
    if (rule.actions.sendWelcomeDM) {
      notes.push("welcome DM queued");
    }
    if (rule.actions.sendAwayDM) {
      notes.push("away DM queued");
    }
    if (rule.actions.sendMenuDM) {
      notes.push("menu DM queued");
    }
    if (rule.actions.sendSavedReply && rule.actions.savedReplyBody) {
      patch.aiDraft = rule.actions.savedReplyBody;
      notes.push("saved reply queued");
    }
    if (rule.actions.notify) {
      notes.push(`notified ${rule.actions.notifyChannel || "#engage"}`);
    }

    results.push({
      itemId: item.id,
      ruleId: rule.id,
      ruleName: rule.name,
      patch,
      note: `${cls.sentiment}/${cls.intent} → ${notes.join(", ") || "matched"}`,
    });
  }

  return results;
}

/* ------------------------------ hook ------------------------------ */

export function useInboxAutomation() {
  const rules = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => cache,
    () => cache,
  );

  useEffect(() => { void ensureAuthMode(); }, []);

  const persistConfig = (rule: InboxRule) => ({
    match: rule.match,
    actions: rule.actions,
    runs: rule.runs,
    description: rule.description,
    category: rule.category,
    builtIn: rule.builtIn,
    flow: rule.flow,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  });

  const add = (rule: InboxRule) => {
    const now = new Date().toISOString();
    const stamped: InboxRule = { ...rule, createdAt: rule.createdAt ?? now, updatedAt: now };
    if (mode === "remote" && remoteUserId) {
      setCache([...cache, stamped]);
      void supabase.from("automation_rules").insert({
        id: stamped.id,
        user_id: remoteUserId,
        kind: RULE_KIND,
        name: stamped.name,
        enabled: stamped.enabled,
        config: persistConfig(stamped),
      } as never).then(({ error }) => {
        if (error) setCache(cache.filter((r) => r.id !== stamped.id));
      });
    } else {
      writeLocal([...cache, stamped]);
    }
    return stamped;
  };

  const update = (id: string, patch: Partial<InboxRule>) => {
    const cur = cache.find((r) => r.id === id);
    if (!cur) return;
    const now = new Date().toISOString();
    const merged: InboxRule = {
      ...cur,
      ...patch,
      match: { ...cur.match, ...(patch.match ?? {}) },
      actions: { ...cur.actions, ...(patch.actions ?? {}) },
      updatedAt: now,
    };
    setCache(cache.map((r) => (r.id === id ? merged : r)));
    if (mode === "remote" && remoteUserId) {
      void supabase.from("automation_rules").update({
        name: merged.name,
        enabled: merged.enabled,
        config: persistConfig(merged),
      } as never).eq("id", id);
    } else {
      writeLocal(cache.map((r) => (r.id === id ? merged : r)));
    }
  };

  const remove = (id: string) => {
    const next = cache.filter((r) => r.id !== id);
    if (mode === "remote" && remoteUserId) {
      setCache(next);
      void supabase.from("automation_rules").delete().eq("id", id);
    } else {
      writeLocal(next);
    }
  };

  /** Increment the run counter after the engine applies a rule. */
  const bumpRuns = (id: string, by = 1) => {
    const cur = cache.find((r) => r.id === id);
    if (cur) update(id, { runs: cur.runs + by });
  };

  /** Restore all built-in defaults without touching user rules. */
  const reseedDefaults = () => {
    const ids = new Set(cache.map((r) => r.id));
    const missing = DEFAULT_INBOX_RULES.filter((d) => !ids.has(d.id));
    if (!missing.length) return cache;
    const now = new Date().toISOString();
    const next = [...cache, ...missing.map((d) => ({ ...d, createdAt: now, updatedAt: now }))];
    if (mode === "remote" && remoteUserId) {
      setCache(next);
      missing.forEach((d) => {
        void supabase.from("automation_rules").insert({
          id: d.id,
          user_id: remoteUserId,
          kind: RULE_KIND,
          name: d.name,
          enabled: d.enabled,
          config: persistConfig(d),
        } as never);
      });
    } else {
      writeLocal(next);
    }
    return next;
  };

  return { rules, add, update, remove, bumpRuns, reseedDefaults };
}
