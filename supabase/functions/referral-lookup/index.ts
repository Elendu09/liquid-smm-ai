// referral-lookup — public, unauthenticated lookup for the /referral/:code
// landing page. Resolves a public referral code to the referrer's display name.
// Only returns deliberately-shareable profile fields, never ids or tokens.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const code = String(
      body?.code ?? url.searchParams.get("code") ?? "",
    ).trim().toLowerCase();
    if (!code) {
      return json(400, { error: "code required" });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await admin
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("referral_code", code)
      .maybeSingle();

    if (error) return json(500, { error: error.message });
    if (!data) return json(404, { error: "invalid_referral_code" });

    return json(200, {
      code,
      referrerName: data.display_name?.trim() ? data.display_name : "an SMMSAAS user",
      avatarUrl: data.avatar_url ?? null,
    });
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
