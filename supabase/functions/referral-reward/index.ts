// referral-reward — award the referrer credits when the signed-in user upgrades
// to a paid plan. Called once per referred user (deduped by the referrals table
// UNIQUE(referred_user_id)). The plan is passed by the client (plans are
// client-side in this app); the function only rewards when the plan is paid and
// the caller actually has a `referred_by`.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { emitNotification } from "../_shared/notifications.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const PAID_PLANS = new Set(["starter", "professional", "custom"]);
const REWARD_CREDITS = 500;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) {
      return json(401, { error: "unauthorized" });
    }

    const body = await req.json().catch(() => ({}));
    const plan = typeof body?.plan === "string" ? body.plan : "";
    if (!PAID_PLANS.has(plan)) {
      return json(200, { rewarded: false, reason: "not_paid_plan" });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. Does the caller have a referrer?
    const { data: profile } = await admin
      .from("profiles")
      .select("referral_code, referred_by")
      .eq("id", userId)
      .maybeSingle();
    const referrerId = profile?.referred_by;
    if (!referrerId) {
      return json(200, { rewarded: false, reason: "no_referrer" });
    }

    // 2. Already rewarded? (idempotent — UNIQUE(referred_user_id) guards races too)
    const { data: existing } = await admin
      .from("referrals")
      .select("id")
      .eq("referred_user_id", userId)
      .limit(1);
    if (existing && existing.length > 0) {
      return json(200, { rewarded: false, reason: "already_rewarded" });
    }

    // 3. Write the ledger row (race-safe via unique constraint).
    const { error: insertErr } = await admin
      .from("referrals")
      .insert({
        referrer_id: referrerId,
        referred_user_id: userId,
        code: profile?.referral_code ?? "",
        plan,
        status: "rewarded",
        credits_awarded: REWARD_CREDITS,
        rewarded_at: new Date().toISOString(),
      });
    if (insertErr) {
      // Unique violation means a concurrent request already rewarded — treat as done.
      if (String(insertErr.code ?? "").startsWith("23")) {
        return json(200, { rewarded: false, reason: "already_rewarded" });
      }
      return json(500, { error: insertErr.message });
    }

    // 4. Credit the referrer's balance atomically (increments purchased, never
    //    overwrites; creates the row if missing).
    const { error: balErr } = await admin.rpc("referral_apply_credit", {
      p_user_id: referrerId,
      p_credits: REWARD_CREDITS,
    });
    if (balErr) {
      return json(500, { error: balErr.message });
    }

    // 5. Ledger event for the referrer.
    await admin.from("credit_events").insert({
      user_id: referrerId,
      kind: "referral",
      delta: REWARD_CREDITS,
      label: "Referral reward — new paid signup",
      meta: { referredUserId: userId, plan },
    }).catch(() => {});

    // 6. Notify the referrer.
    await emitNotification(admin, {
      userId: referrerId,
      type: "milestone",
      severity: "success",
      title: "You earned referral credits",
      message: `Someone you referred upgraded to ${plan}. ${REWARD_CREDITS} credits added to your balance.`,
      groupKey: `referral:${userId}`,
      actionUrl: "/dashboard/referrals",
      metric: { credits: REWARD_CREDITS, referredUserId: userId, plan },
    }).catch(() => {});

    return json(200, { rewarded: true, credits: REWARD_CREDITS, referrerId });
  } catch (e) {
    return json(500, { error: (e as Error).message });
  }
});

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
