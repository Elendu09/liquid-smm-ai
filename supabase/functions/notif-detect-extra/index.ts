// notif-detect-extra
// Additional detectors: follower spike, engagement drop, best-time hit,
// competitor overtake, RSS new item, scheduled-post failure, billing threshold.
// Runs on cron. Safe when supporting tables are empty — each block no-ops.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/ai-gateway.ts";
import { requireCronOrService } from "../_shared/auth.ts";
import { emitNotification } from "../_shared/notifications.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULTS = {
  followerSpikePct: 10,           // +10% in 24h across an account
  engagementDropPct: 30,          // -30% vs 7-day baseline
  bestTimeWindowMinutes: 60,      // fire once per predicted slot
  competitorGapPct: 5,            // competitor grew this much faster than user
  billingUsagePct: 85,            // usage as % of plan quota
};

function ruleParams(rulesByKey: Map<string, any>, key: string, def: any) {
  const r = rulesByKey.get(key);
  if (!r) return def;
  return { enabled: r.enabled !== false, params: { ...def, ...(r.params ?? {}) } };
}

async function loadRules(admin: any, userId: string) {
  const { data } = await admin
    .from("notification_rules")
    .select("rule_key, params, enabled")
    .eq("user_id", userId);
  const m = new Map<string, any>();
  (data ?? []).forEach((r: any) => m.set(r.rule_key, r));
  return m;
}

/* ------------------------------ Follower spike ----------------------------- */
async function detectFollowerSpike(admin: any, userId: string, rules: Map<string, any>) {
  const cfg = ruleParams(rules, "health.followerSpike", { enabled: true, pct: DEFAULTS.followerSpikePct });
  if (!cfg.enabled) return;
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data: rows } = await admin
    .from("follower_snapshots")
    .select("account_id, platform, followers, captured_at")
    .eq("user_id", userId)
    .gte("captured_at", new Date(Date.now() - 48 * 3600_000).toISOString())
    .order("captured_at", { ascending: true });
  if (!rows?.length) return;

  const byAcct = new Map<string, any[]>();
  rows.forEach((r: any) => {
    const arr = byAcct.get(r.account_id) ?? [];
    arr.push(r);
    byAcct.set(r.account_id, arr);
  });
  for (const [accountId, snaps] of byAcct) {
    const now = snaps[snaps.length - 1];
    const prior = snaps.find((s: any) => new Date(s.captured_at).getTime() <= Date.parse(since));
    if (!prior || !prior.followers) continue;
    const pct = ((now.followers - prior.followers) / prior.followers) * 100;
    if (pct >= cfg.params.pct) {
      await emitNotification(admin, {
        userId,
        type: "milestone",
        severity: "success",
        title: `Follower spike on ${now.platform}`,
        message: `+${pct.toFixed(1)}% (${now.followers - prior.followers} new) in the last 24h`,
        groupKey: `spike:${accountId}:${new Date().toISOString().slice(0, 10)}`,
        platformId: now.platform,
        accountId,
        metric: { pct, delta: now.followers - prior.followers },
        dedupeWindowHours: 24,
      });
    }
  }
}

/* ---------------------------- Engagement drop ------------------------------ */
async function detectEngagementDrop(admin: any, userId: string, rules: Map<string, any>) {
  const cfg = ruleParams(rules, "health.engagementDrop", { enabled: true, pct: DEFAULTS.engagementDropPct });
  if (!cfg.enabled) return;
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - 8 * 86_400_000);
  const { data } = await admin
    .from("account_metrics_daily")
    .select("account_id, day, engagement")
    .eq("user_id", userId)
    .gte("day", start.toISOString().slice(0, 10))
    .order("day", { ascending: true });
  if (!data?.length) return;
  const byAcct = new Map<string, any[]>();
  data.forEach((d: any) => {
    const arr = byAcct.get(d.account_id) ?? [];
    arr.push(d);
    byAcct.set(d.account_id, arr);
  });
  for (const [accountId, rows] of byAcct) {
    if (rows.length < 5) continue;
    const last = rows[rows.length - 1];
    const baseline = rows.slice(0, -1).reduce((s: number, r: any) => s + Number(r.engagement ?? 0), 0) / (rows.length - 1);
    if (baseline <= 0) continue;
    const dropPct = ((baseline - Number(last.engagement ?? 0)) / baseline) * 100;
    if (dropPct >= cfg.params.pct) {
      await emitNotification(admin, {
        userId,
        type: "alert",
        severity: "warning",
        title: "Engagement dropped",
        message: `Engagement is ${dropPct.toFixed(0)}% below your 7-day average`,
        groupKey: `engdrop:${accountId}:${last.day}`,
        accountId,
        metric: { dropPct, baseline, latest: last.engagement },
        dedupeWindowHours: 24,
      });
    }
  }
}

/* ------------------------------ Best-time hit ------------------------------ */
async function detectBestTimeHit(admin: any, userId: string, rules: Map<string, any>) {
  const cfg = ruleParams(rules, "reminder.bestTimeHit", { enabled: true });
  if (!cfg.enabled) return;
  // Predicted best slots come from `post_metrics` aggregated by hour of week.
  // Fire when the current hour matches a top slot AND user has no scheduled post
  // in the next 60 min for that account.
  try {
    const { data: accounts } = await admin
      .from("social_accounts")
      .select("id, platform")
      .eq("user_id", userId)
      .eq("status", "connected");
    if (!accounts?.length) return;
    const now = new Date();
    const dow = now.getUTCDay();
    const hour = now.getUTCHours();
    for (const acct of accounts) {
      const { data: top } = await admin
        .from("post_metrics")
        .select("published_at, engagement")
        .eq("user_id", userId)
        .eq("account_id", acct.id)
        .not("published_at", "is", null)
        .order("engagement", { ascending: false })
        .limit(30);
      if (!top?.length) continue;
      const hits = top.filter((p: any) => {
        const d = new Date(p.published_at);
        return d.getUTCDay() === dow && d.getUTCHours() === hour;
      }).length;
      if (hits < 3) continue; // needs at least 3 historical wins in this slot
      const soon = new Date(now.getTime() + 60 * 60_000).toISOString();
      const { data: scheduled } = await admin
        .from("scheduled_posts")
        .select("id")
        .eq("user_id", userId)
        .eq("account_id", acct.id)
        .gte("scheduled_at", now.toISOString())
        .lte("scheduled_at", soon)
        .limit(1);
      if (scheduled?.length) continue;
      await emitNotification(admin, {
        userId,
        type: "reminder",
        severity: "info",
        title: `Best time to post on ${acct.platform}`,
        message: "Your audience is most active right now — nothing is queued.",
        groupKey: `besttime:${acct.id}:${dow}:${hour}`,
        platformId: acct.platform,
        accountId: acct.id,
        actionUrl: "/dashboard/publish",
        dedupeWindowHours: 6,
      });
    }
  } catch (_) { /* table missing */ }
}

/* --------------------------- Competitor overtake --------------------------- */
async function detectCompetitorOvertake(admin: any, userId: string, rules: Map<string, any>) {
  const cfg = ruleParams(rules, "alert.competitorOvertake", { enabled: true, pct: DEFAULTS.competitorGapPct });
  if (!cfg.enabled) return;
  try {
    const { data: comps } = await admin
      .from("competitors")
      .select("id, handle, platform, followers, followers_prev, tracked_at")
      .eq("user_id", userId);
    if (!comps?.length) return;
    for (const c of comps) {
      if (!c.followers || !c.followers_prev) continue;
      const growth = ((c.followers - c.followers_prev) / c.followers_prev) * 100;
      if (growth < cfg.params.pct) continue;
      await emitNotification(admin, {
        userId,
        type: "alert",
        severity: "info",
        title: `${c.handle} is outpacing you`,
        message: `${c.handle} on ${c.platform} grew ${growth.toFixed(1)}% since last check.`,
        groupKey: `overtake:${c.id}:${new Date().toISOString().slice(0, 10)}`,
        platformId: c.platform,
        metric: { growth },
        actionUrl: "/dashboard/audience",
        dedupeWindowHours: 48,
      });
    }
  } catch (_) { /* table missing */ }
}

/* ------------------------------- RSS new item ------------------------------ */
async function detectRssNewItems(admin: any, userId: string, rules: Map<string, any>) {
  const cfg = ruleParams(rules, "reminder.rssNewItem", { enabled: true });
  if (!cfg.enabled) return;
  try {
    const since = new Date(Date.now() - 30 * 60_000).toISOString();
    const { data: items } = await admin
      .from("rss_items")
      .select("id, feed_id, title, url, published_at, rss_feeds!inner(user_id, name)")
      .eq("rss_feeds.user_id", userId)
      .gte("published_at", since)
      .limit(20);
    if (!items?.length) return;
    for (const it of items as any[]) {
      await emitNotification(admin, {
        userId,
        type: "reminder",
        severity: "info",
        title: `New RSS item — ${it.rss_feeds?.name ?? "feed"}`,
        message: it.title ?? "New article ready to remix",
        groupKey: `rss:${it.id}`,
        actionUrl: "/dashboard/rss",
        dedupeWindowHours: 24,
      });
    }
  } catch (_) { /* table missing */ }
}

/* --------------------------- Scheduled-post failure ------------------------ */
async function detectScheduledFailure(admin: any, userId: string, rules: Map<string, any>) {
  const cfg = ruleParams(rules, "alert.scheduledFailure", { enabled: true });
  if (!cfg.enabled) return;
  try {
    const since = new Date(Date.now() - 30 * 60_000).toISOString();
    const { data: rows } = await admin
      .from("scheduled_posts")
      .select("id, platform, account_id, scheduled_at, status, error_message, updated_at")
      .eq("user_id", userId)
      .eq("status", "failed")
      .gte("updated_at", since);
    if (!rows?.length) return;
    for (const r of rows as any[]) {
      await emitNotification(admin, {
        userId,
        type: "alert",
        severity: "critical",
        title: `Scheduled post failed on ${r.platform ?? "platform"}`,
        message: r.error_message ?? "Delivery could not complete. Review and retry.",
        groupKey: `schedfail:${r.id}`,
        platformId: r.platform,
        accountId: r.account_id,
        postId: r.id,
        actionUrl: "/dashboard/publish",
        dedupeWindowHours: 12,
      });
    }
  } catch (_) { /* table missing */ }
}

/* ---------------------------- Billing threshold ---------------------------- */
async function detectBillingThreshold(admin: any, userId: string, rules: Map<string, any>) {
  const cfg = ruleParams(rules, "alert.billingThreshold", { enabled: true, pct: DEFAULTS.billingUsagePct });
  if (!cfg.enabled) return;
  try {
    const monthStart = new Date();
    monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
    const [{ count: aiUsed }, { count: postsUsed }] = await Promise.all([
      admin.from("ai_command_history").select("id", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", monthStart.toISOString()),
      admin.from("scheduled_posts").select("id", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", monthStart.toISOString()),
    ]);
    // Free plan defaults; can be overridden per-user via rule params.
    const aiQuota = cfg.params.aiQuota ?? 500;
    const postQuota = cfg.params.postQuota ?? 200;
    const buckets = [
      { name: "AI commands", used: aiUsed ?? 0, quota: aiQuota },
      { name: "Scheduled posts", used: postsUsed ?? 0, quota: postQuota },
    ];
    for (const b of buckets) {
      const pct = (b.used / b.quota) * 100;
      if (pct < cfg.params.pct) continue;
      await emitNotification(admin, {
        userId,
        type: "alert",
        severity: pct >= 100 ? "critical" : "warning",
        title: `${b.name} usage at ${Math.round(pct)}%`,
        message: `You've used ${b.used}/${b.quota} this cycle. Upgrade to keep automating without limits.`,
        groupKey: `billing:${b.name}:${monthStart.toISOString().slice(0, 7)}:${Math.floor(pct / 10)}`,
        actionUrl: "/dashboard/settings/billing",
        metric: { used: b.used, quota: b.quota, pct },
        dedupeWindowHours: 72,
      });
    }
  } catch (_) { /* table missing */ }
}

/* --------------------------------- Runner --------------------------------- */
async function runForUser(admin: any, userId: string) {
  const rules = await loadRules(admin, userId);
  await Promise.allSettled([
    detectFollowerSpike(admin, userId, rules),
    detectEngagementDrop(admin, userId, rules),
    detectBestTimeHit(admin, userId, rules),
    detectCompetitorOvertake(admin, userId, rules),
    detectRssNewItems(admin, userId, rules),
    detectScheduledFailure(admin, userId, rules),
    detectBillingThreshold(admin, userId, rules),
  ]);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const gate = requireCronOrService(req);
  if (gate) return gate;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const url = new URL(req.url);
  const singleUser = url.searchParams.get("user_id");

  try {
    let userIds: string[] = [];
    if (singleUser) {
      userIds = [singleUser];
    } else {
      const { data } = await admin.from("profiles").select("id").limit(2000);
      userIds = (data ?? []).map((r: any) => r.id);
    }
    let ok = 0;
    for (const uid of userIds) {
      try { await runForUser(admin, uid); ok++; } catch (_) { /* skip user */ }
    }
    return new Response(JSON.stringify({ ok: true, processed: ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
