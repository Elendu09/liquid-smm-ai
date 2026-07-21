// notif-remind
// Runs every 5 minutes. Emits reminder notifications for:
//  - Scheduled posts T-1h and T-15m
//  - Drafts older than N days
//  - Optimal posting window opening now (from analytics.optimal_windows)
// Safe when supporting tables are missing.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/ai-gateway.ts";
import { requireCronOrService } from "../_shared/auth.ts";
import { emitNotification } from "../_shared/notifications.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULTS = {
  draftAgingDays: 7,
};

async function remindForUser(admin: any, userId: string) {
  const { data: rules } = await admin
    .from("notification_rules")
    .select("rule_key, params, enabled")
    .eq("user_id", userId);
  const rulesByKey = new Map<string, any>();
  (rules ?? []).forEach((r: any) => rulesByKey.set(r.rule_key, r));

  const now = Date.now();

  // --- Scheduled post reminders (T-1h & T-15m) ---
  try {
    const in70min = new Date(now + 70 * 60_000).toISOString();
    const inNow = new Date(now).toISOString();
    const { data: upcoming } = await admin
      .from("scheduled_posts")
      .select("id, platform_id, account_id, scheduled_at, title")
      .eq("user_id", userId)
      .eq("status", "scheduled")
      .gte("scheduled_at", inNow)
      .lte("scheduled_at", in70min)
      .limit(100);

    for (const p of upcoming ?? []) {
      const minutes = Math.round((new Date(p.scheduled_at).getTime() - now) / 60_000);
      // T-60 window (55–65 min)
      if (minutes >= 55 && minutes <= 65) {
        await emitNotification(admin, {
          userId,
          type: "reminder",
          severity: "info",
          title: "Scheduled post in 1h",
          message: `${p.title ?? "A post"} publishes to ${p.platform_id} in about 1 hour.`,
          groupKey: `remind-1h:${p.id}`,
          platformId: p.platform_id,
          postId: p.id,
          accountId: p.account_id,
          actionUrl: "/dashboard/scheduler",
          dedupeWindowHours: 2,
        });
      }
      // T-15 window (10–20 min)
      if (minutes >= 10 && minutes <= 20) {
        await emitNotification(admin, {
          userId,
          type: "reminder",
          severity: "info",
          title: "Scheduled post in 15m",
          message: `${p.title ?? "A post"} publishes to ${p.platform_id} in about 15 minutes.`,
          groupKey: `remind-15m:${p.id}`,
          platformId: p.platform_id,
          postId: p.id,
          accountId: p.account_id,
          actionUrl: "/dashboard/scheduler",
          dedupeWindowHours: 1,
        });
      }
    }
  } catch (_) {
    // scheduled_posts table not present
  }

  // --- Drafts aging ---
  try {
    const days = rulesByKey.get("reminder.draftAging")?.params?.days ?? DEFAULTS.draftAgingDays;
    const cutoff = new Date(now - days * 24 * 3_600_000).toISOString();
    const { data: drafts } = await admin
      .from("drafts")
      .select("id, title, updated_at, platform_id")
      .eq("user_id", userId)
      .lte("updated_at", cutoff)
      .limit(20);

    for (const d of drafts ?? []) {
      await emitNotification(admin, {
        userId,
        type: "reminder",
        severity: "info",
        title: "Draft is getting stale",
        message: `"${d.title ?? "Untitled draft"}" has been sitting for ${days}+ days.`,
        groupKey: `draft-aging:${d.id}`,
        platformId: d.platform_id ?? undefined,
        actionUrl: "/dashboard/content-studio",
        dedupeWindowHours: 24 * 7,
      });
    }
  } catch (_) {
    // no drafts table
  }

  // --- Optimal window opening now ---
  try {
    const { data: windows } = await admin
      .from("optimal_windows")
      .select("account_id, platform_id, starts_at, ends_at")
      .eq("user_id", userId)
      .lte("starts_at", new Date(now + 5 * 60_000).toISOString())
      .gte("ends_at", new Date(now).toISOString())
      .limit(20);

    for (const w of windows ?? []) {
      await emitNotification(admin, {
        userId,
        type: "reminder",
        severity: "info",
        title: "Optimal posting window open",
        message: `Your ${w.platform_id} audience is most active right now.`,
        groupKey: `optimal:${w.account_id}:${new Date(w.starts_at).toISOString()}`,
        platformId: w.platform_id,
        accountId: w.account_id,
        actionUrl: "/dashboard/scheduler",
        dedupeWindowHours: 4,
      });
    }
  } catch (_) {
    // no optimal_windows table
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
        await remindForUser(admin, u.user_id);
        processed++;
      } catch (e) {
        console.error("remind fail", u.user_id, e);
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
