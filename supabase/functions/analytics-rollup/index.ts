// Recomputes per-user, per-platform daily rollups into platform_rollup_daily.
// Called by pg_cron every 2 hours; also invocable per-user for on-demand refresh.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/ai-gateway.ts";
import { requireCronOrService } from "../_shared/auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const gate = requireCronOrService(req);
  if (gate) return gate;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  let targetUsers: string[] = [];
  let days = 90;

  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body?.user_id) targetUsers = [body.user_id];
      if (typeof body?.days === "number") days = Math.min(365, Math.max(1, body.days));
    }
  } catch {}

  if (targetUsers.length === 0) {
    const { data } = await admin
      .from("account_metrics_daily")
      .select("user_id")
      .gte("day", new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10));
    targetUsers = Array.from(new Set((data ?? []).map((r: any) => r.user_id).filter(Boolean)));
  }

  const results: Array<{ user_id: string; rows: number; error?: string }> = [];
  for (const uid of targetUsers) {
    const { data, error } = await admin.rpc("refresh_platform_rollup", {
      _user_id: uid,
      _days: days,
    });
    results.push({ user_id: uid, rows: (data as number) ?? 0, error: error?.message });
  }

  return new Response(
    JSON.stringify({ ok: true, users: targetUsers.length, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
