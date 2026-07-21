// Recomputes rolling engagement baselines from the last 30 days of post_metrics
// and derives per-account health scores + anomaly notifications. Runs on a
// schedule (every 6h) and also on demand from the Analytics → Health page.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type MetricRow = {
  account_id: string;
  user_id: string;
  captured_at: string;
  impressions: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  video_views: number | null;
};

function engagementOf(r: MetricRow): number {
  return (r.likes ?? 0) + (r.comments ?? 0) + (r.shares ?? 0);
}

function mean(xs: number[]): number { return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0; }
function stddev(xs: number[], mu: number): number {
  if (xs.length < 2) return 0;
  return Math.sqrt(xs.reduce((s, x) => s + (x - mu) ** 2, 0) / (xs.length - 1));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: metrics } = await admin
    .from("post_metrics")
    .select("account_id,user_id,captured_at,impressions,reach,likes,comments,shares,video_views")
    .gte("captured_at", since.toISOString())
    .limit(5000);

  // Group latest capture per (post,account) and build per-account distributions.
  const byAccount = new Map<string, MetricRow[]>();
  for (const m of (metrics ?? []) as MetricRow[]) {
    const list = byAccount.get(m.account_id) ?? [];
    list.push(m);
    byAccount.set(m.account_id, list);
  }

  const now = new Date().toISOString();
  let baselineWrites = 0;
  let healthWrites = 0;
  const alerts: unknown[] = [];

  for (const [accountId, rows] of byAccount) {
    const engagements = rows.map(engagementOf).filter((v) => v > 0);
    const impressions = rows.map((r) => r.impressions ?? 0).filter((v) => v > 0);
    if (!engagements.length) continue;
    const mu = mean(engagements);
    const sd = stddev(engagements, mu);
    const imu = mean(impressions);
    const userId = rows[0].user_id;

    // Persist baselines (30d window).
    await admin.from("post_metrics_baseline").upsert([
      { user_id: userId, account_id: accountId, metric: "engagement", window_hours: 720, value: mu, sample_size: engagements.length, updated_at: now },
      { user_id: userId, account_id: accountId, metric: "engagement_stddev", window_hours: 720, value: sd, sample_size: engagements.length, updated_at: now },
      { user_id: userId, account_id: accountId, metric: "impressions", window_hours: 720, value: imu, sample_size: impressions.length, updated_at: now },
    ], { onConflict: "user_id,account_id,metric,window_hours" });
    baselineWrites += 3;

    // Composite health score (0-100): weighted mix of consistency, engagement
    // vs baseline, and recent momentum.
    const recent = rows.slice(-5).map(engagementOf).filter((v) => v > 0);
    const recentMu = mean(recent);
    const momentum = mu > 0 ? Math.min(2, recentMu / mu) : 1; // 0-2
    const consistency = mu > 0 ? Math.max(0, 1 - Math.min(1, sd / mu)) : 0.5; // 0-1
    const volume = Math.min(1, engagements.length / 20); // reward > ~20 posts
    const raw = (momentum * 45) + (consistency * 30) + (volume * 25);
    const healthScore = Math.max(0, Math.min(100, Math.round(raw)));

    await admin.from("social_accounts").update({ health_score: healthScore }).eq("id", accountId);
    healthWrites++;

    // Anomaly notifications: 2σ above → viral, 2σ below → underperformance.
    const latest = rows[rows.length - 1];
    const latestEng = engagementOf(latest);
    if (sd > 0 && latestEng > mu + sd * 2) {
      await admin.from("notifications").insert({
        user_id: userId,
        title: "Post is going viral",
        body: `${latestEng} engagements — ${((latestEng / mu - 1) * 100).toFixed(0)}% above your average.`,
        severity: "success",
        channel: "analytics",
        metadata: { account_id: accountId, engagement: latestEng, baseline: mu } as any,
        read: false,
      });
      alerts.push({ accountId, kind: "viral" });
    } else if (sd > 0 && latestEng > 0 && latestEng < Math.max(1, mu - sd * 2)) {
      await admin.from("notifications").insert({
        user_id: userId,
        title: "Engagement dip detected",
        body: `Recent post below baseline — ${latestEng} engagements vs avg ${Math.round(mu)}.`,
        severity: "warning",
        channel: "analytics",
        metadata: { account_id: accountId, engagement: latestEng, baseline: mu } as any,
        read: false,
      });
      alerts.push({ accountId, kind: "dip" });
    }
  }

  return new Response(JSON.stringify({ baselineWrites, healthWrites, alerts }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
