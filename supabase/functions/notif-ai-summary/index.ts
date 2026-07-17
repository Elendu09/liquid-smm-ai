// Summarize a user's recent unread notifications with Lovable AI.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: notifs } = await admin
      .from("notifications")
      .select("type,severity,title,message,platform_id,created_at")
      .eq("user_id", u.user.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!notifs || notifs.length === 0) {
      return new Response(JSON.stringify({ summary: "You're all caught up. No unread notifications." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ summary: `${notifs.length} unread notifications.` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lines = notifs.map((n: any) => `- [${n.type}/${n.severity}] ${n.title}: ${n.message}`).join("\n");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You summarize social-media manager notifications into 3-5 concise bullets highlighting wins, risks and required actions. Be terse." },
          { role: "user", content: lines },
        ],
      }),
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ summary: `${notifs.length} unread notifications.` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await res.json();
    const summary = j.choices?.[0]?.message?.content ?? `${notifs.length} unread notifications.`;
    return new Response(JSON.stringify({ summary, count: notifs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
