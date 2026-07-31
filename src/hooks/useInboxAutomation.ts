import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeMessage, type Intent, type Sentiment } from "@/hooks/useInboxAnalysis";
import { aiEngage } from "@/hooks/useAiEngage";
import type { InboxItem } from "@/pages/dashboard/views/InboxBoard";

/**
 * Configurable inbox automation.
 *
 * Rules route inbound comments/DMs by sentiment, intent, platform and
 * keywords, then optionally set a status, auto-assign a teammate and queue
 * an AI-drafted reply for a human to approve. Rules persist in
 * `automation_rules` with kind `inbox-routing`, with a localStorage fallback
 * for guests so the demo still works.
 */

export type InboxStatus = InboxItem["status"];

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
  /** Queue an AI draft reply on the message for human approval. */
  aiDraftReply: boolean;
  aiTone: string;
  /** Use the AI classifier (ai-engage) instead of the local heuristic. */
  aiClassify: boolean;
}

export interface InboxRule {
  id: string;
  name: string;
  enabled: boolean;
  match: InboxRuleMatch;
  actions: InboxRuleActions;
  runs: number;
}

export const emptyRule = (): InboxRule => ({
  id: crypto.randomUUID(),
  name: "",
  enabled: true,
  match: { kinds: [], platforms: [], sentiments: [], intents: [], keywords: [] },
  actions: { setStatus: null, assignTo: null, aiDraftReply: false, aiTone: "friendly", aiClassify: false },
  runs: 0,
});

const RULE_KIND = "inbox-routing";
const STORAGE_KEY = "smmpilot:engage:inbox-rules";

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
    return raw ? (JSON.parse(raw) as InboxRule[]) : [];
  } catch { return []; }
}
function writeLocal(next: InboxRule[]) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  setCache(next);
}

type Row = {
  id: string;
  name: string;
  enabled: boolean;
  config: { match?: Partial<InboxRuleMatch>; actions?: Partial<InboxRuleActions>; runs?: number } | null;
};

const rowToRule = (r: Row): InboxRule => {
  const base = emptyRule();
  return {
    id: r.id,
    name: r.name,
    enabled: r.enabled,
    match: { ...base.match, ...(r.config?.match ?? {}) },
    actions: { ...base.actions, ...(r.config?.actions ?? {}) },
    runs: r.config?.runs ?? 0,
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
  setCache(((data as unknown as Row[] | null) ?? []).map(rowToRule));
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
    else { mode = "local"; remoteUserId = null; setCache(readLocal()); }
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
  });

  const add = (rule: InboxRule) => {
    if (mode === "remote" && remoteUserId) {
      setCache([...cache, rule]);
      void supabase.from("automation_rules").insert({
        id: rule.id,
        user_id: remoteUserId,
        kind: RULE_KIND,
        name: rule.name,
        enabled: rule.enabled,
        config: persistConfig(rule),
      } as never).then(({ error }) => {
        if (error) setCache(cache.filter((r) => r.id !== rule.id));
      });
    } else {
      writeLocal([...cache, rule]);
    }
    return rule;
  };

  const update = (id: string, patch: Partial<InboxRule>) => {
    const cur = cache.find((r) => r.id === id);
    if (!cur) return;
    const merged: InboxRule = {
      ...cur,
      ...patch,
      match: { ...cur.match, ...(patch.match ?? {}) },
      actions: { ...cur.actions, ...(patch.actions ?? {}) },
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

  return { rules, add, update, remove, bumpRuns };
}
