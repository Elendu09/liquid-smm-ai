import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "not_authenticated" }, 401);

  // Validate the caller's JWT via anon client + user JWT.
  const asUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await asUser.auth.getUser();
  if (userErr || !userData.user) return json({ error: "not_authenticated" }, 401);

  let body: { token?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }
  const token = (body.token ?? "").trim();
  if (!token || token.length > 200) return json({ error: "invalid_token" }, 400);

  // Service-role call: the RPC is SECURITY DEFINER and only executable by service_role.
  // The RPC still validates auth.uid() internally — we pass the JWT via headers so
  // auth.uid() inside Postgres resolves to the caller, not the service account.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await admin.rpc("accept_team_invite", { _token: token });
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true, data });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
