// Collects per-post engagement metrics for recently-published scheduled_posts.
// Reads provider post ids from run_history (data.<platform>.externalId),
// fetches metrics via each provider adapter, and appends a fresh row into
// post_metrics so trend charts and baselines have real data to work with.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/ai-gateway.ts";
import { requireCronOrService } from "../_shared/auth.ts";
import { postMetricsFor } from "../_shared/oauth-post-metrics.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const gate = requireCronOrService(req);
  if (gate) return gate;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Only care about posts sent in the last 30 days — that's the useful window
  // for iterating per-post metrics on every provider we support.
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: runs } = await admin
    .from("run_history")
    .select("ref_id, user_id, data, created_at")
    .eq("kind", "scheduled_post")
    .eq("status", "success")
    .gte("created_at", since.toISOString())
    .limit(200);

  let inserted = 0;
  const errors: unknown[] = [];

  for (const run of runs ?? []) {
    const results = (run as any).data ?? {};
    for (const [platform, res] of Object.entries<any>(results)) {
      const externalId: string | undefined = res?.externalId;
      if (!externalId) continue;

      try {
        const { data: account } = await admin
          .from("social_accounts")
          .select("id")
          .eq("user_id", (run as any).user_id)
          .eq("platform_id", platform)
          .maybeSingle();
        if (!account) continue;

        const { data: tok } = await admin
          .from("social_account_tokens")
          .select("access_token")
          .eq("account_id", account.id)
          .maybeSingle();
        if (!tok?.access_token) continue;

        const m = await postMetricsFor(platform, tok.access_token, externalId);
        if (!m) continue;

        await admin.from("post_metrics").insert({
          user_id: (run as any).user_id,
          post_id: (run as any).ref_id,
          account_id: account.id,
          captured_at: new Date().toISOString(),
          impressions: m.impressions ?? null,
          reach: m.reach ?? null,
          likes: m.likes ?? null,
          comments: m.comments ?? null,
          shares: m.shares ?? null,
          saves: m.saves ?? null,
          clicks: m.clicks ?? null,
          video_views: m.video_views ?? null,
          raw: (m.raw ?? null) as any,
        });
        inserted++;
      } catch (err) {
        errors.push({ ref_id: (run as any).ref_id, platform, error: String(err) });
      }
    }
  }

  return new Response(JSON.stringify({ inserted, errors }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
