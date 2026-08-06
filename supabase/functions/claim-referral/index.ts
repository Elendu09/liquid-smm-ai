// claim-referral — authenticated. Sets the caller's `profiles.referred_by` from
// a public referral code, once. Idempotent: never overwrites an existing
// referrer, and is a no-op for unknown codes.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

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
    const code = typeof body?.code === "string" ? body.code.trim().toLowerCase() : "";
    if (!code) return json(400, { error: "code required" });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // No-op if the user already has a referrer (referrals are locked once set).
    const { data: me } = await admin
      .from("profiles")
      .select("referred_by, referral_code")
      .eq("id", userId)
      .maybeSingle();
    if (me?.referred_by) {
      return json(200, { ok: true, alreadyClaimed: true });
    }
    // Prevent self-referral.
    if (me?.referral_code === code) {
      return json(200, { ok: false, reason: "self_referral" });
    }

    // Resolve the code to a referrer.
    const { data: referrer } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!referrer) return json(404, { error: "invalid_referral_code" });

    const { error } = await admin
      .from("profiles")
      .update({ referred_by: referrer.id, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) return json(500, { error: error.message });

    return json(200, { ok: true, referredBy: referrer.id });
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
