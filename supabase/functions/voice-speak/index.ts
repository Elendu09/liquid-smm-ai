// Text-to-speech proxy — returns MP3 audio playable by a standard <audio>.
import { corsHeaders } from "../_shared/ai-gateway.ts";

interface Body { text?: string; voice?: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  let body: Body;
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const text = (body.text ?? "").trim();
  if (!text) {
    return new Response(JSON.stringify({ error: "text is required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const input = text.slice(0, 2400);
  const voice = typeof body.voice === "string" && body.voice ? body.voice : "alloy";
  const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "openai/gpt-4o-mini-tts", input, voice, response_format: "mp3" }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return new Response(JSON.stringify({ error: err || `TTS failed (${res.status})` }), {
      status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(res.body, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
});
