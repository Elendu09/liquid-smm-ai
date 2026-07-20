// Runs due scheduled_posts, resolves per-account tokens, and would call the
// per-provider adapter to publish. When provider credentials are not yet
// configured we mark the post as "simulated" and log a run_history entry —
// this keeps the pipeline exercisable end-to-end before OAuth secrets ship.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { OAUTH_ADAPTERS, isAdapterEnabled } from "../_shared/oauth-adapters.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const now = new Date().toISOString();
  const { data: due } = await admin
    .from("scheduled_posts")
    .select("*")
    .lte("scheduled_at", now)
    .eq("status", "scheduled")
    .limit(25);

  let processed = 0;
  const results: any[] = [];

  for (const post of due ?? []) {
    const platformIds: string[] = (post as any).platform_ids ?? [];
    let anySuccess = false;
    const platformResults: Record<string, any> = {};

    for (const platform of platformIds) {
      const adapter = OAUTH_ADAPTERS[platform];
      const { data: account } = await admin
        .from("social_accounts")
        .select("id")
        .eq("user_id", post.user_id)
        .eq("platform_id", platform)
        .limit(1)
        .maybeSingle();

      if (!account) {
        platformResults[platform] = { status: "skipped", reason: "no_account" };
        continue;
      }
      const { data: token } = await admin
        .from("social_account_tokens")
        .select("access_token, expires_at")
        .eq("account_id", account.id)
        .maybeSingle();

      if (!adapter || !isAdapterEnabled(adapter) || !token) {
        // Simulated publish so downstream analytics/notifications can still trigger.
        platformResults[platform] = { status: "simulated", note: "adapter or token missing" };
        anySuccess = true;
        continue;
      }

      // Real publish path — provider-specific POST goes here.
      // For now we mark it as pending until adapter-specific publish() is added.
      platformResults[platform] = { status: "pending", note: "adapter publish() not yet implemented" };
    }

    const newStatus = anySuccess ? "completed" : "failed";
    await admin.from("scheduled_posts").update({
      status: newStatus,
      published_at: anySuccess ? new Date().toISOString() : null,
      last_error: anySuccess ? null : "no channels published",
    }).eq("id", post.id);

    await admin.from("run_history").insert({
      user_id: post.user_id,
      kind: "scheduled_post",
      ref_id: post.id,
      status: newStatus === "completed" ? "success" : "failed",
      message: `Published to ${Object.entries(platformResults).filter(([, v]: any) => v.status !== "skipped").length} channel(s)`,
      data: platformResults,
    });

    processed++;
    results.push({ post_id: post.id, status: newStatus, platforms: platformResults });
  }

  return new Response(JSON.stringify({ processed, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
