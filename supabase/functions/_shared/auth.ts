// Shared auth helpers for edge functions.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders } from "./ai-gateway.ts";

/**
 * Verify the caller's Supabase JWT. Returns the user id or a 401 Response.
 * Use for user-facing endpoints that must not be anonymous.
 */
export async function requireUser(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) {
    return new Response(JSON.stringify({ error: "server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const client = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || !userId) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return { userId };
}

/**
 * Gate for cron/batch endpoints. Accepts either:
 *  - x-cron-secret header matching CRON_SECRET, OR
 *  - Authorization: Bearer <SERVICE_ROLE_KEY>
 * Returns null when allowed, or a 401 Response.
 */
export function requireCronOrService(req: Request): Response | null {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (cronSecret && provided && provided === cronSecret) return null;
  const auth = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && auth === `Bearer ${serviceKey}`) return null;
  return new Response(JSON.stringify({ error: "forbidden" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Gate for internal-only endpoints (e.g. webhook fan-out). Requires the
 * shared INTERNAL_FN_SECRET or a service-role bearer.
 */
export function requireInternal(req: Request): Response | null {
  const secret = Deno.env.get("INTERNAL_FN_SECRET");
  const provided = req.headers.get("x-internal-secret");
  if (secret && provided && provided === secret) return null;
  const auth = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && auth === `Bearer ${serviceKey}`) return null;
  return new Response(JSON.stringify({ error: "forbidden" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
