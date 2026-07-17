// Fires user-defined outbound webhooks for a given notification payload.
// Called from emitNotification after a successful insert.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

async function sign(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { userId, notification } = await req.json();
    if (!userId || !notification) {
      return new Response(JSON.stringify({ error: "missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: hooks } = await admin
      .from("notification_webhooks")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true);

    if (!hooks || hooks.length === 0) {
      return new Response(JSON.stringify({ fired: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = JSON.stringify({
      event: `notification.${notification.type}`,
      severity: notification.severity,
      notification,
      timestamp: new Date().toISOString(),
    });

    let fired = 0;
    await Promise.all(
      hooks.map(async (h: any) => {
        const eventTypes: string[] = h.event_types ?? ["*"];
        if (
          !eventTypes.includes("*") &&
          !eventTypes.includes(notification.type) &&
          !eventTypes.includes(`notification.${notification.type}`)
        ) {
          return;
        }
        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (h.secret) headers["X-Lovable-Signature"] = await sign(h.secret, body);
          const res = await fetch(h.url, { method: "POST", headers, body });
          fired++;
          await admin
            .from("notification_webhooks")
            .update({
              last_fired_at: new Date().toISOString(),
              last_status: res.status,
              failure_count: res.ok ? 0 : (h.failure_count ?? 0) + 1,
              active: res.ok ? true : (h.failure_count ?? 0) + 1 < 10,
            })
            .eq("id", h.id);
        } catch (_) {
          await admin
            .from("notification_webhooks")
            .update({
              last_status: 0,
              failure_count: (h.failure_count ?? 0) + 1,
              active: (h.failure_count ?? 0) + 1 < 10,
            })
            .eq("id", h.id);
        }
      }),
    );

    return new Response(JSON.stringify({ fired }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
