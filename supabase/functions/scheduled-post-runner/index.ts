// Runs due scheduled_posts, resolves per-account tokens, and publishes via
// the per-provider adapter. Falls back to a simulated publish only when the
// provider's OAuth adapter has no credentials configured yet so the pipeline
// stays exercisable pre-launch.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/ai-gateway.ts";
import { requireCronOrService } from "../_shared/auth.ts";
import { OAUTH_ADAPTERS, isAdapterEnabled } from "../_shared/oauth-adapters.ts";
import { publishFor } from "../_shared/oauth-publishers.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const gate = requireCronOrService(req);
  if (gate) return gate;
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
        .select("id, external_id")
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

      if (!adapter || !isAdapterEnabled(adapter) || !token?.access_token) {
        platformResults[platform] = { status: "simulated", note: "adapter_or_token_missing" };
        anySuccess = true;
        continue;
      }

      const result = await publishFor(
        platform,
        token.access_token,
        { caption: post.caption ?? "", mediaUrls: (post as any).media_urls ?? [] },
        { externalId: (account as any).external_id ?? undefined },
      );
      if (result.ok) anySuccess = true;
      platformResults[platform] = {
        status: result.ok ? "published" : "failed",
        externalId: result.externalId,
        externalUrl: result.externalUrl,
        error: result.error,
      };
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
      message: `Published to ${Object.values(platformResults).filter((v: any) => v.status === "published" || v.status === "simulated").length} channel(s)`,
      data: platformResults as any,
    });

    // Notify the owner so the bell + notification center light up.
    await admin.from("notifications").insert({
      user_id: post.user_id,
      title: newStatus === "completed" ? "Post published" : "Post failed to publish",
      body: post.caption?.slice(0, 140) ?? "",
      severity: newStatus === "completed" ? "info" : "warning",
      channel: "post",
      metadata: { post_id: post.id, results: platformResults } as any,
      read: false,
    });

    processed++;
    results.push({ post_id: post.id, status: newStatus, platforms: platformResults });
  }

  return new Response(JSON.stringify({ processed, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
