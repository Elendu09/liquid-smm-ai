// notif-detect-engagement
// Scans recent posts per user, compares metrics against 7-day baseline stored in
// post_metrics_baseline, emits "viral" and "high engagement" notifications.
// Designed to be invoked on a schedule via pg_cron. Safe to run without connected
// social platforms — will simply find no posts and no-op.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { emitNotification } from "../_shared/notifications.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Default rule params (overridden per-user by notification_rules).
const DEFAULTS = {
  viralMultiplier: 5, // >5× baseline within first N hours = viral
  viralWindowHours: 24,
  highEngagementCommentsThreshold: 100,
};

async function detectForUser(admin: any, userId: string) {
  // Rules
  const { data: rules } = await admin
    .from("notification_rules")
    .select("rule_key, params, enabled")
    .eq("user_id", userId);

  const rulesByKey = new Map<string, any>();
  (rules ?? []).forEach((r: any) => rulesByKey.set(r.rule_key, r));

  const viralRule = rulesByKey.get("engagement.viral");
  const highEngRule = rulesByKey.get("engagement.high");
  if (viralRule && viralRule.enabled === false && highEngRule && highEngRule.enabled === false) return;

  const viralMult = viralRule?.params?.multiplier ?? DEFAULTS.viralMultiplier;
  const viralWindow = viralRule?.params?.windowHours ?? DEFAULTS.viralWindowHours;
  const commentsThreshold = highEngRule?.params?.commentsThreshold ?? DEFAULTS.highEngagementCommentsThreshold;

  // Pull recent posts from posts table if it exists — otherwise no-op.
  let posts: any[] = [];
  try {
    const { data } = await admin
      .from("posts")
      .select("id, platform_id, account_id, views, likes, comments, published_at")
      .eq("user_id", userId)
      .gte("published_at", new Date(Date.now() - viralWindow * 3600_000).toISOString())
      .limit(100);
    posts = data ?? [];
  } catch (_) {
    return;
  }

  for (const post of posts) {
    const ageHours = Math.max(1, (Date.now() - new Date(post.published_at).getTime()) / 3600_000);
    const viewsPerHour = (post.views ?? 0) / ageHours;

    // Get baseline
    const { data: baseline } = await admin
      .from("post_metrics_baseline")
      .select("value")
      .eq("user_id", userId)
      .eq("account_id", post.account_id)
      .eq("metric", "views_per_hour")
      .maybeSingle();

    const base = Number(baseline?.value ?? 0);

    if (viralRule?.enabled !== false && base > 0 && viewsPerHour >= base * viralMult) {
      await emitNotification(admin, {
        userId,
        type: "engagement",
        severity: "success",
        title: "Post went viral!",
        message: `A post on ${post.platform_id} is trending — ${Math.round(viewsPerHour)}/hr vs baseline ${Math.round(base)}/hr`,
        groupKey: `viral:${post.id}`,
        platformId: post.platform_id,
        postId: post.id,
        accountId: post.account_id,
        actionUrl: `/dashboard/analytics`,
        metric: { value: viewsPerHour, baseline: base, delta: viewsPerHour - base, unit: "views/hr" },
        dedupeWindowHours: viralWindow,
      });
    }

    if (highEngRule?.enabled !== false && (post.comments ?? 0) >= commentsThreshold) {
      await emitNotification(admin, {
        userId,
        type: "engagement",
        severity: "info",
        title: "High engagement detected",
        message: `Your ${post.platform_id} post has ${post.comments} comments — jump in and reply.`,
        groupKey: `high-eng:${post.id}`,
        platformId: post.platform_id,
        postId: post.id,
        accountId: post.account_id,
        actionUrl: `/dashboard/comment-manager`,
        metric: { value: post.comments, unit: "comments" },
        dedupeWindowHours: 12,
      });
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    // Iterate over users with any preferences row (proxy for "active user").
    const { data: users } = await admin.from("notification_preferences").select("user_id").limit(1000);
    const targetUsers: string[] = (users ?? []).map((u: any) => u.user_id);

    let processed = 0;
    for (const uid of targetUsers) {
      try {
        await detectForUser(admin, uid);
        processed++;
      } catch (e) {
        console.error("detect fail", uid, e);
      }
    }
    return new Response(JSON.stringify({ ok: true, processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
