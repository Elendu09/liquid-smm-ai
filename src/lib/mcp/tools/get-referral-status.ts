import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { edgeSupabase, requireAuth, tableResult } from "../helpers";

export default defineTool({
  name: "get_referral_status",
  title: "Get referral status",
  description:
    "Return the signed-in user's referral program status: their share code and link, lifetime referral credits earned, and how many referred signups have upgraded to a paid plan.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input: unknown, ctx: ToolContext) => {
    const auth = requireAuth(ctx);
    if (!auth.ok) return auth;
    const userId = ctx.getUserId();
    const db = edgeSupabase(ctx);

    const [{ data: profile }, { data: referrals }, { data: events }] = await Promise.all([
      db.from("profiles").select("referral_code, referred_by").eq("id", userId).maybeSingle(),
      db.from("referrals").select("id, referred_user_id, plan, credits_awarded, rewarded_at").eq("referrer_id", userId).order("rewarded_at", { ascending: false }),
      db.from("credit_events").select("delta").eq("user_id", userId).eq("kind", "referral"),
    ]);

    const totalEarned = (events ?? []).reduce((sum, e) => sum + Number(e.delta ?? 0), 0);
    const payload = {
      referralCode: profile?.referral_code ?? null,
      referralLink: profile?.referral_code ? `https://smmsaas.com/referral/${profile.referral_code}` : null,
      totalCreditsEarned: totalEarned,
      paidReferrals: (referrals ?? []).length,
      referredBy: profile?.referred_by ?? null,
      referrals: referrals ?? [],
    };
    return tableResult(payload, payload.referralCode ? `Share code: ${payload.referralCode}` : "No referral code yet.");
  },
});
