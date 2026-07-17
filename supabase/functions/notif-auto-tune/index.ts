// Auto-tuning: analyzes recent notification events per user and nudges rule thresholds
// when a rule is either being ignored (raise threshold) or under-firing (lower threshold).
// Cron: weekly.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const RULE_TUNING: Record<string, { param: string; up: (v: number) => number; down: (v: number) => number; min: number; max: number }> = {
  "engagement.viral": { param: "multiplier", up: (v) => Math.min(20, v + 1), down: (v) => Math.max(2, v - 1), min: 2, max: 20 },
  "engagement.high": { param: "commentsThreshold", up: (v) => Math.round(v * 1.25), down: (v) => Math.max(20, Math.round(v * 0.8)), min: 20, max: 5000 },
  "health.followerDrop": { param: "pct", up: (v) => Math.min(50, v + 2), down: (v) => Math.max(1, v - 1), min: 1, max: 50 },
  "health.quota": { param: "pct", up: (v) => Math.min(99, v + 5), down: (v) => Math.max(50, v - 5), min: 50, max: 99 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();

  const { data: prefs } = await admin
    .from("notification_preferences")
    .select("user_id")
    .eq("auto_tune_enabled", true);

  let tuned = 0;
  for (const p of prefs ?? []) {
    const { data: events } = await admin
      .from("notification_events")
      .select("event, rule_key")
      .eq("user_id", p.user_id)
      .gte("created_at", since);

    if (!events || events.length === 0) continue;

    // Aggregate per rule_key
    const stats = new Map<string, { delivered: number; interacted: number; dismissed: number }>();
    for (const e of events) {
      if (!e.rule_key) continue;
      const s = stats.get(e.rule_key) ?? { delivered: 0, interacted: 0, dismissed: 0 };
      if (e.event === "delivered") s.delivered++;
      if (e.event === "clicked" || e.event === "read") s.interacted++;
      if (e.event === "dismissed") s.dismissed++;
      stats.set(e.rule_key, s);
    }

    const { data: rules } = await admin
      .from("notification_rules")
      .select("*")
      .eq("user_id", p.user_id);

    for (const rule of rules ?? []) {
      const tuning = RULE_TUNING[rule.rule_key];
      const s = stats.get(rule.rule_key);
      if (!tuning || !s || s.delivered < 5) continue;

      const dismissRate = s.dismissed / Math.max(1, s.delivered);
      const engageRate = s.interacted / Math.max(1, s.delivered);
      const params: any = rule.params ?? {};
      const current = Number(params[tuning.param] ?? 0);
      let next = current;

      if (dismissRate > 0.6) next = tuning.up(current); // too noisy → raise
      else if (engageRate > 0.7 && s.delivered < 15) next = tuning.down(current); // useful & rare → lower

      if (next !== current && next >= tuning.min && next <= tuning.max) {
        await admin
          .from("notification_rules")
          .update({
            params: { ...params, [tuning.param]: next, autoTuned: true, autoTunedAt: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          })
          .eq("id", rule.id);
        tuned++;
      }
    }
  }

  return new Response(JSON.stringify({ tuned }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
