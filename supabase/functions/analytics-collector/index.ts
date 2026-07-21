// Snapshots follower/engagement counts for every connected account with a live
// token, updates social_accounts.followers/following/posts/engagement, and
// records a daily row in account_metrics_daily for historical charts.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/ai-gateway.ts";
import { requireCronOrService } from "../_shared/auth.ts";
import { statsFor } from "../_shared/oauth-stats.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const gate = requireCronOrService(req);
  if (gate) return gate;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: tokens } = await admin
    .from("social_account_tokens")
    .select("account_id, platform, access_token")
    .not("access_token", "is", null);

  let updated = 0;
  const errors: any[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const row of tokens ?? []) {
    try {
      const { data: acct } = await admin
        .from("social_accounts")
        .select("id, user_id, external_id, followers")
        .eq("id", row.account_id)
        .maybeSingle();
      if (!acct) continue;

      const stats = await statsFor(row.platform, row.access_token, { externalId: (acct as any).external_id ?? undefined });
      if (!stats || (stats.followers == null && stats.posts == null)) continue;

      const prevFollowers = (acct as any).followers ?? 0;
      const delta = (stats.followers ?? prevFollowers) - prevFollowers;

      await admin.from("social_accounts").update({
        followers: stats.followers ?? prevFollowers,
        following: stats.following ?? undefined,
        posts: stats.posts ?? undefined,
        engagement: stats.engagement ?? undefined,
        last_sync: new Date().toISOString(),
      }).eq("id", acct.id);

      await admin.from("account_metrics_daily").upsert({
        account_id: acct.id,
        user_id: (acct as any).user_id,
        day: today,
        followers: stats.followers ?? null,
        following: stats.following ?? null,
        posts: stats.posts ?? null,
        engagement: stats.engagement ?? null,
        raw: (stats.raw ?? null) as any,
      }, { onConflict: "account_id,day" });

      // Surface milestones as notifications (every +100 followers or first sync).
      if (delta >= 100) {
        await admin.from("notifications").insert({
          user_id: (acct as any).user_id,
          title: "Followers milestone",
          body: `+${delta} new followers on ${row.platform}`,
          severity: "info",
          channel: "analytics",
          metadata: { account_id: acct.id, platform: row.platform, delta } as any,
          read: false,
        });
      }

      updated++;
    } catch (err) {
      errors.push({ account_id: row.account_id, error: String(err) });
    }
  }

  return new Response(JSON.stringify({ updated, errors }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
