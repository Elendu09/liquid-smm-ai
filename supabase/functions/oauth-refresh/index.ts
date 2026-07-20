import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { OAUTH_ADAPTERS, isAdapterEnabled } from "../_shared/oauth-adapters.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Refresh anything expiring in <1h
  const cutoff = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const { data: rows } = await admin
    .from("social_account_tokens")
    .select("*")
    .not("refresh_token", "is", null)
    .lte("expires_at", cutoff);

  let refreshed = 0;
  const errors: any[] = [];
  for (const row of rows ?? []) {
    const adapter = OAUTH_ADAPTERS[row.platform];
    if (!adapter || !isAdapterEnabled(adapter)) continue;
    try {
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: row.refresh_token!,
        client_id: adapter.clientId!,
        client_secret: adapter.clientSecret!,
      });
      const res = await fetch(adapter.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: params.toString(),
      });
      const text = await res.text();
      if (!res.ok) { errors.push({ account: row.account_id, status: res.status, body: text }); continue; }
      let token: any; try { token = JSON.parse(text); } catch { token = Object.fromEntries(new URLSearchParams(text)); }
      await admin.from("social_account_tokens").update({
        access_token: token.access_token,
        refresh_token: token.refresh_token ?? row.refresh_token,
        expires_at: token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString() : null,
      }).eq("account_id", row.account_id);
      refreshed++;
    } catch (err) {
      errors.push({ account: row.account_id, error: String(err) });
    }
  }
  return new Response(JSON.stringify({ refreshed, errors }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
