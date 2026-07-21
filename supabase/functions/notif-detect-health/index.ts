// notif-detect-health
// Runs every 15 minutes. Checks connected accounts and scheduled posts for
// health issues: expired/expiring tokens, publish failures, quota near cap,
// sync gaps, and sudden follower drops. Safe when supporting tables are missing.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/ai-gateway.ts";
import { requireCronOrService } from "../_shared/auth.ts";
import { emitNotification } from "../_shared/notifications.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULTS = {
  syncGapHours: 24,
  followerDropPct: 5, // 5% drop in 24h
  quotaWarnPct: 85,
  tokenExpiryWarnHours: 48,
};

async function detectForUser(admin: any, userId: string) {
  const { data: rules } = await admin
    .from("notification_rules")
    .select("rule_key, params, enabled")
    .eq("user_id", userId);
  const rulesByKey = new Map<string, any>();
  (rules ?? []).forEach((r: any) => rulesByKey.set(r.rule_key, r));

  // --- Account health (token expiry / sync gap / follower drop) ---
  let accounts: any[] = [];
  try {
    const { data } = await admin
      .from("accounts")
      .select("id, platform_id, handle, token_expires_at, last_synced_at, followers, followers_24h_ago, quota_used_pct")
      .eq("user_id", userId);
    accounts = data ?? [];
  } catch (_) {
    accounts = [];
  }

  const now = Date.now();
  for (const acc of accounts) {
    // Token expiry / re-auth
    if (acc.token_expires_at) {
      const hours = (new Date(acc.token_expires_at).getTime() - now) / 3_600_000;
      if (hours <= 0) {
        await emitNotification(admin, {
          userId,
          type: "alert",
          severity: "critical",
          title: "Re-auth required",
          message: `${acc.handle ?? acc.platform_id} has been disconnected — reconnect to resume publishing.`,
          groupKey: `reauth:${acc.id}`,
          platformId: acc.platform_id,
          accountId: acc.id,
          actionUrl: "/dashboard/account-health",
          dedupeWindowHours: 12,
        });
      } else if (hours <= (rulesByKey.get("health.tokenExpiry")?.params?.warnHours ?? DEFAULTS.tokenExpiryWarnHours)) {
        await emitNotification(admin, {
          userId,
          type: "alert",
          severity: "warning",
          title: "Token expiring soon",
          message: `${acc.handle ?? acc.platform_id} access expires in ~${Math.round(hours)}h.`,
          groupKey: `token-expiring:${acc.id}`,
          platformId: acc.platform_id,
          accountId: acc.id,
          actionUrl: "/dashboard/account-health",
          dedupeWindowHours: 24,
        });
      }
    }

    // Sync gap
    if (acc.last_synced_at) {
      const gapHours = (now - new Date(acc.last_synced_at).getTime()) / 3_600_000;
      const threshold = rulesByKey.get("health.syncGap")?.params?.hours ?? DEFAULTS.syncGapHours;
      if (gapHours >= threshold) {
        await emitNotification(admin, {
          userId,
          type: "alert",
          severity: "warning",
          title: "Account not syncing",
          message: `${acc.handle ?? acc.platform_id} hasn't synced in ${Math.round(gapHours)}h.`,
          groupKey: `sync-gap:${acc.id}`,
          platformId: acc.platform_id,
          accountId: acc.id,
          actionUrl: "/dashboard/account-health",
          dedupeWindowHours: 12,
        });
      }
    }

    // Follower drop
    if (acc.followers && acc.followers_24h_ago) {
      const dropPct = ((acc.followers_24h_ago - acc.followers) / acc.followers_24h_ago) * 100;
      const threshold = rulesByKey.get("health.followerDrop")?.params?.pct ?? DEFAULTS.followerDropPct;
      if (dropPct >= threshold) {
        await emitNotification(admin, {
          userId,
          type: "alert",
          severity: "warning",
          title: "Follower drop detected",
          message: `${acc.handle ?? acc.platform_id} lost ${dropPct.toFixed(1)}% followers in the last 24h.`,
          groupKey: `follower-drop:${acc.id}:${new Date().toISOString().slice(0, 10)}`,
          platformId: acc.platform_id,
          accountId: acc.id,
          metric: { value: acc.followers, baseline: acc.followers_24h_ago, delta: -dropPct, unit: "%" },
          actionUrl: "/dashboard/analytics",
          dedupeWindowHours: 24,
        });
      }
    }

    // Quota warning
    if (acc.quota_used_pct != null) {
      const threshold = rulesByKey.get("health.quota")?.params?.pct ?? DEFAULTS.quotaWarnPct;
      if (acc.quota_used_pct >= threshold) {
        await emitNotification(admin, {
          userId,
          type: "alert",
          severity: acc.quota_used_pct >= 95 ? "critical" : "warning",
          title: "API quota nearing cap",
          message: `${acc.handle ?? acc.platform_id} is at ${Math.round(acc.quota_used_pct)}% of its API quota.`,
          groupKey: `quota:${acc.id}:${new Date().toISOString().slice(0, 10)}`,
          platformId: acc.platform_id,
          accountId: acc.id,
          actionUrl: "/dashboard/account-health",
          dedupeWindowHours: 12,
        });
      }
    }
  }

  // --- Publish failures from scheduler ---
  try {
    const cutoff = new Date(now - 60 * 60_000).toISOString(); // last hour
    const { data: failed } = await admin
      .from("scheduled_posts")
      .select("id, platform_id, account_id, error_message, updated_at")
      .eq("user_id", userId)
      .eq("status", "failed")
      .gte("updated_at", cutoff)
      .limit(50);

    for (const post of failed ?? []) {
      await emitNotification(admin, {
        userId,
        type: "alert",
        severity: "critical",
        title: "Publish failed",
        message: post.error_message
          ? `${post.platform_id}: ${String(post.error_message).slice(0, 140)}`
          : `A scheduled post failed to publish on ${post.platform_id}.`,
        groupKey: `publish-failed:${post.id}`,
        platformId: post.platform_id,
        postId: post.id,
        accountId: post.account_id,
        actionUrl: "/dashboard/scheduler",
        dedupeWindowHours: 24,
      });
    }
  } catch (_) {
    // no scheduler table yet
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const gate = requireCronOrService(req);
  if (gate) return gate;
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: users } = await admin.from("notification_preferences").select("user_id").limit(1000);
    let processed = 0;
    for (const u of users ?? []) {
      try {
        await detectForUser(admin, u.user_id);
        processed++;
      } catch (e) {
        console.error("health fail", u.user_id, e);
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
