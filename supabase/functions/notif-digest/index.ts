// Daily/weekly digest: rolls up unread notifications per user and emits ONE system notification.
// Scheduled via pg_cron. Respects digest_mode preference.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { emitNotification } from "../_shared/notifications.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") ?? "daily") as "daily" | "weekly";
  const sinceHours = mode === "weekly" ? 24 * 7 : 24;
  const since = new Date(Date.now() - sinceHours * 3600_000).toISOString();

  const { data: users } = await admin
    .from("notification_preferences")
    .select("user_id, digest_mode")
    .eq("digest_mode", mode);

  let sent = 0;
  for (const row of users ?? []) {
    const { data: notifs } = await admin
      .from("notifications")
      .select("type, severity, title")
      .eq("user_id", row.user_id)
      .gte("created_at", since)
      .neq("type", "system")
      .limit(200);

    if (!notifs || notifs.length === 0) continue;

    const counts: Record<string, number> = {};
    let critical = 0;
    for (const n of notifs) {
      counts[n.type] = (counts[n.type] ?? 0) + 1;
      if (n.severity === "critical") critical++;
    }
    const parts = Object.entries(counts).map(([t, c]) => `${c} ${t}`);
    const title = mode === "weekly" ? "Weekly digest" : "Daily digest";
    const message = `${notifs.length} updates: ${parts.join(", ")}${critical ? ` — ${critical} critical` : ""}.`;

    const groupKey = `digest:${mode}:${new Date().toISOString().slice(0, 10)}`;
    const r = await emitNotification(admin, {
      userId: row.user_id,
      type: "system",
      severity: critical ? "warning" : "info",
      title,
      message,
      groupKey,
      actionUrl: "/dashboard/activity/notifications",
      dedupeWindowHours: mode === "weekly" ? 24 * 6 : 20,
    });
    if (!r.skipped) sent++;
  }

  return new Response(JSON.stringify({ mode, sent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
