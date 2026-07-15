// AI Command edge function — takes a natural-language prompt and returns a
// structured plan the client can approve. Uses Lovable AI Gateway.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are the AI command planner for an SMM (social media management) app.

The user types a natural-language request. Your job is to reply with a JSON plan
of concrete actions the app can execute. Available actions (tool + kind):

- create_caption_draft (kind: caption-draft) — payload: { title, body, hashtags?: string[], platformIds?: string[] }
  targetRoute: "/dashboard/library/captions"
- queue_cross_platform_post (kind: scheduled-post) — payload: { caption, platformIds: string[], scheduledAt (ISO), hashtags?: string[] }
  targetRoute: "/dashboard/publish/queue"
- open_page (kind: navigate) — payload: { route } — for navigation-only intents (e.g. "show my analytics")
  targetRoute: same as payload.route

Always return:
{
  "message": "<one-sentence summary you'd tell the user>",
  "actions": [
    { "tool": "<tool name>", "kind": "<kind>", "description": "<user-facing sentence>", "targetRoute": "<route>", "payload": {...} }
  ]
}

Rules:
- Keep actions to 1–5 items.
- Use the user's profile (tone, niches, goals) to tailor captions.
- Prefer scheduling within the next 7 days; use ISO 8601 timestamps.
- If the request is ambiguous or purely informational, return actions: [] and put the answer in "message".
- Never invent connected platforms; if platformIds unknown, use ["instagram"].
- Return ONLY the JSON object, no prose, no markdown fences.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, profile } = await req.json();
    if (typeof prompt !== "string" || !prompt.trim()) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileHint = profile
      ? `User profile: ${JSON.stringify({
          name: profile.name,
          role: profile.role,
          niches: profile.niches,
          goals: profile.goals,
          tone: profile.tone,
          brandDescription: profile.brandDescription,
          cadencePerWeek: profile.cadencePerWeek,
          autonomy: profile.autonomy,
        })}`
      : "No profile available.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: profileHint },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      const status = response.status === 429 || response.status === 402 ? response.status : 500;
      return new Response(JSON.stringify({ error: `AI gateway ${response.status}: ${text}` }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { message: content || "I couldn't structure a plan for that.", actions: [] };
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
