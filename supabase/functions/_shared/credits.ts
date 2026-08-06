// Shared, server-side credit metering + AI conversation memory.
//
// Every metered AI edge function goes through here so the ledger is honest:
//  - the cost is fixed and published (see RATE_CARD, mirrored client-side in
//    src/config/aiCosts.ts),
//  - the balance is checked BEFORE the model runs (402 when empty),
//  - the debit is written AFTER a successful run (failures cost nothing),
//  - every debit writes a `credit_events` row describing feature + model +
//    where it was triggered from, so Settings → Billing can show exactly what
//    the credits were spent on.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders } from "./ai-gateway.ts";

/** Published rate card. Keep in sync with src/config/aiCosts.ts. */
export const RATE_CARD = {
  "command.text": 1,
  "command.vision": 2,
  "command.voice": 1,
  "create.captions": 2,
  "create.hashtags": 1,
  "create.translate": 1,
  "create.brief": 3,
  "create.reply": 1,
  "create.rewrite": 2,
  "engage.reply": 1,
  "home.summary": 1,
  "notif.summary": 1,
  "voice.speak": 1,
  "voice.transcribe": 1,
  "campaign.plan": 5,
  "memory.summarize": 0,
} as const;

export type FeatureKey = keyof typeof RATE_CARD;

export function costOf(feature: FeatureKey): number {
  return RATE_CARD[feature] ?? 1;
}

export function serviceClient(): SupabaseClient | null {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface CreditCheck {
  allowed: boolean;
  remaining: number;
  cost: number;
}

/** Read-only pre-flight: does the user have enough credits for `feature`? */
export async function checkCredits(userId: string, feature: FeatureKey): Promise<CreditCheck> {
  const cost = costOf(feature);
  const db = serviceClient();
  if (!db) return { allowed: true, remaining: 0, cost }; // fail open if unconfigured
  const { data } = await db
    .from("credit_balances")
    .select("included, purchased, used")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { allowed: true, remaining: 0, cost };
  const remaining = Math.max(
    0,
    Number(data.included ?? 0) + Number(data.purchased ?? 0) - Number(data.used ?? 0),
  );
  return { allowed: remaining >= cost, remaining, cost };
}

/** Debit after a successful run. Never throws — metering must not break the feature. */
export async function chargeCredits(
  userId: string,
  feature: FeatureKey,
  meta: Record<string, unknown> = {},
): Promise<{ spent: number; remaining: number }> {
  const cost = costOf(feature);
  if (cost <= 0) return { spent: 0, remaining: 0 };
  const db = serviceClient();
  if (!db) return { spent: 0, remaining: 0 };
  try {
    const { data, error } = await db.rpc("spend_credits", {
      _user_id: userId,
      _amount: cost,
      _feature: feature,
      _meta: meta,
    });
    if (error) {
      console.error("spend_credits failed:", error.message);
      return { spent: 0, remaining: 0 };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return { spent: Number(row?.spent ?? 0), remaining: Number(row?.remaining ?? 0) };
  } catch (e) {
    console.error("spend_credits threw:", e instanceof Error ? e.message : String(e));
    return { spent: 0, remaining: 0 };
  }
}

/** Standard 402 response when the user is out of credits. */
export function insufficientCredits(check: CreditCheck): Response {
  return new Response(
    JSON.stringify({
      error: "insufficient_credits",
      message: `This action costs ${check.cost} credit${check.cost === 1 ? "" : "s"} and you have ${check.remaining} left. Top up in Settings → Billing.`,
      cost: check.cost,
      remaining: check.remaining,
    }),
    { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

/* ------------------------------------------------------------------ */
/* AI rolling memory                                                    */
/* ------------------------------------------------------------------ */

export interface AiMemory {
  summary: string;
  turns: number;
  facts: Record<string, unknown>;
}

export async function loadMemory(userId: string): Promise<AiMemory> {
  const db = serviceClient();
  if (!db) return { summary: "", turns: 0, facts: {} };
  const { data } = await db
    .from("ai_memory")
    .select("summary, turns, facts")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    summary: data?.summary ?? "",
    turns: Number(data?.turns ?? 0),
    facts: (data?.facts as Record<string, unknown>) ?? {},
  };
}

export async function saveMemory(
  userId: string,
  patch: Partial<AiMemory>,
): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { error } = await db.from("ai_memory").upsert(
    {
      user_id: userId,
      ...(patch.summary !== undefined ? { summary: patch.summary } : {}),
      ...(patch.turns !== undefined ? { turns: patch.turns } : {}),
      ...(patch.facts !== undefined ? { facts: patch.facts } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) console.error("saveMemory failed:", error.message);
}
