// notif-detect-milestones
// Detects follower / view / like thresholds and emits milestone notifications.
// Uses milestone_state to remember the last threshold crossed per (account, metric).
// Safe when no accounts are connected — just no-ops.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/ai-gateway.ts";
import { requireCronOrService } from "../_shared/auth.ts";
import { emitNotification } from "../_shared/notifications.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DEFAULT_THRESHOLDS: Record<string, number[]> = {
  followers: [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1_000_000],
  views: [10_000, 100_000, 1_000_000, 10_000_000],
  likes: [1_000, 10_000, 100_000, 1_000_000],
};

function nextCrossed(current: number, last: number, thresholds: number[]): number | null {
  const crossed = thresholds.filter((t) => t > last && current >= t);
  return crossed.length ? crossed[crossed.length - 1] : null;
}

async function detectForUser(admin: any, userId: string) {
  let accounts: any[] = [];
  try {
    const { data } = await admin
      .from("accounts")
      .select("id, platform_id, handle, followers, total_views, total_likes")
      .eq("user_id", userId);
    accounts = data ?? [];
  } catch (_) {
    return;
  }

  for (const acc of accounts) {
    for (const metric of ["followers", "views", "likes"] as const) {
      const current = Number(
        metric === "followers" ? acc.followers : metric === "views" ? acc.total_views : acc.total_likes,
      ) || 0;
      if (!current) continue;

      const { data: state } = await admin
        .from("milestone_state")
        .select("last_threshold")
        .eq("user_id", userId)
        .eq("account_id", acc.id)
        .eq("metric", metric)
        .maybeSingle();

      const last = Number(state?.last_threshold ?? 0);
      const crossed = nextCrossed(current, last, DEFAULT_THRESHOLDS[metric]);
      if (crossed == null) continue;

      const prettyMetric =
        metric === "followers" ? "Followers" : metric === "views" ? "Views" : "Likes";
      const prettyNumber = crossed >= 1_000_000 ? `${crossed / 1_000_000}M` : `${crossed / 1000}K`;

      await emitNotification(admin, {
        userId,
        type: "milestone",
        severity: "success",
        title: `${prettyNumber} ${prettyMetric}!`,
        message: `Congrats — ${acc.handle ?? acc.platform_id} just crossed ${crossed.toLocaleString()} ${metric}.`,
        groupKey: `milestone:${acc.id}:${metric}:${crossed}`,
        platformId: acc.platform_id,
        accountId: acc.id,
        metric: { value: current, baseline: last, unit: metric },
        dedupeWindowHours: 24 * 365,
      });

      await admin.from("milestone_state").upsert(
        {
          user_id: userId,
          account_id: acc.id,
          metric,
          last_threshold: crossed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,account_id,metric" },
      );
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const gate = requireCronOrService(req);
  if (gate) return gate;
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: users } = await admin.from("notification_preferences").select("user_id").limit(1000);
    const targetUsers: string[] = (users ?? []).map((u: any) => u.user_id);
    let processed = 0;
    for (const uid of targetUsers) {
      try {
        await detectForUser(admin, uid);
        processed++;
      } catch (e) {
        console.error("milestone fail", uid, e);
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
