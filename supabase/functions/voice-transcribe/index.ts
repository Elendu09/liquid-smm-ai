// Speech-to-text proxy for the AI Command Bar voice call.
// Accepts multipart audio and proxies to Lovable AI `openai/gpt-4o-mini-transcribe`.
import { corsHeaders } from "../_shared/ai-gateway.ts";
import { requireUser } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const authed = await requireUser(req);
  if (authed instanceof Response) return authed;
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return new Response(JSON.stringify({ error: "Missing or empty audio file" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const upstream = new FormData();
  upstream.append("model", "openai/gpt-4o-mini-transcribe");
  upstream.append("file", file, file.name || "recording.wav");
  const lang = form.get("language");
  if (typeof lang === "string" && /^[a-z]{2}$/.test(lang)) upstream.append("language", lang);

  const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: upstream,
  });
  const bodyText = await res.text();
  return new Response(bodyText, {
    status: res.status,
    headers: {
      ...corsHeaders,
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
});
