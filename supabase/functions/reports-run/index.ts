import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Aggregates real analytics for the caller and persists a report_runs row.
// Never synthesises — empty tables produce a run with zeroed totals + a
// `no-data` status so the UI can nudge the user to connect accounts.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: claims, error: claimsErr } = await supabase.auth.getClaims(auth.replace("Bearer ", ""));
  if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const userId = claims.claims.sub as string;

  let body: {
    template_id?: string;
    name?: string;
    range?: "7D" | "30D" | "90D" | "1Y";
    format?: "pdf" | "csv" | "json";
    sections?: string[];
    whitelabel?: boolean;
  } = {};
  try { body = await req.json(); } catch { /* allow empty */ }

  const range = body.range ?? "30D";
  const days = ({ "7D": 7, "30D": 30, "90D": 90, "1Y": 365 } as const)[range];
  const format = body.format ?? "pdf";
  const sections = body.sections ?? ["Follower Growth", "Engagement Rate", "Top Posts", "Reach & Impressions"];
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - days * 86_400_000);
  const periodLabel = `${periodStart.toISOString().slice(0, 10)} → ${periodEnd.toISOString().slice(0, 10)}`;

  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const [totalsRes, amd, topPostsRes] = await Promise.all([
    service.rpc("analytics_overview_totals", {
      _user_id: userId,
      _since: periodStart.toISOString(),
    }),
    service
      .from("account_metrics_daily")
      .select("day, followers, engagement, posts, reach")
      .eq("user_id", userId)
      .gte("day", periodStart.toISOString().slice(0, 10))
      .order("day", { ascending: true }),
    service.rpc("analytics_overview_top_posts", {
      _user_id: userId,
      _since: periodStart.toISOString(),
      _limit: 10,
    }),
  ]);

  const t = totalsRes.data?.[0];
  const totals = {
    impressions: Number(t?.impressions ?? 0),
    reach: Number(t?.reach ?? 0),
    engaged: Number(t?.engaged ?? 0),
    clicks: Number(t?.clicks ?? 0),
  };
  const postCount = Number(t?.post_count ?? 0);

  const followerSeries = (amd.data ?? []).map((r) => ({
    day: r.day,
    followers: Number(r.followers ?? 0),
    engagement: Number(r.engagement ?? 0),
  }));

  const status = postCount === 0 && followerSeries.length === 0 ? "no-data" : "success";
  const reportData = {
    totals,
    followerSeries,
    topPosts: topPostsRes.data ?? [],
    generatedAt: new Date().toISOString(),
    range,
  };
  const payload = JSON.stringify(reportData);
  const sizeBytes = new TextEncoder().encode(payload).byteLength;

  const name =
    body.name ??
    (body.template_id
      ? `${body.template_id.replace(/^tpl-/, "").replace(/-/g, " ")} · ${periodLabel}`
      : `Custom report · ${periodLabel}`);

  const { data: inserted, error: insertErr } = await service
    .from("report_runs")
    .insert({
      user_id: userId,
      template_id: body.template_id ?? null,
      name,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      period_label: periodLabel,
      format,
      size_bytes: sizeBytes,
      sections,
      data: reportData,
      status,
      whitelabel: !!body.whitelabel,
    })
    .select("id, created_at, status")
    .single();

  if (insertErr) return json({ error: insertErr.message }, 500);
  return json({ ok: true, run: inserted, status, totals });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
