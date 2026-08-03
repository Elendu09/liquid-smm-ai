// AI campaign planner — turns a brief into a full content plan.
// Metered through the shared credit ledger (feature: campaign.plan).
import { generateObject, NoObjectGeneratedError } from "npm:ai@5.0.60";
import { z } from "npm:zod@3.25.76";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";
import { requireUser } from "../_shared/auth.ts";
import { chargeCredits, checkCredits, insufficientCredits } from "../_shared/credits.ts";

// Constraint-free schema on purpose (bounds crash Gemini at request time).
const planSchema = z.object({
  themes: z.array(z.string()),
  posts: z.array(
    z.object({
      day: z.number(),
      platform: z.string(),
      hook: z.string(),
      caption: z.string(),
      hashtags: z.array(z.string()),
      format: z.string(),
    }),
  ),
});

interface Body {
  name?: string;
  objective?: string;
  brief?: string;
  audience?: string;
  tone?: string;
  platforms?: string[];
  days?: number;
  postsPerWeek?: number;
}

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
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const preflight = await checkCredits(authed.userId, "campaign.plan");
  if (!preflight.allowed) return insufficientCredits(preflight);

  const days = Math.min(Math.max(body.days ?? 14, 3), 90);
  const perWeek = Math.min(Math.max(body.postsPerWeek ?? 4, 1), 21);
  const total = Math.min(Math.round((days / 7) * perWeek), 40);
  const platforms = (body.platforms ?? ["instagram"]).slice(0, 8);

  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-2.5-flash");

  const prompt = `You are a senior social media strategist building a campaign content plan.

Campaign: ${body.name ?? "Untitled campaign"}
Objective: ${body.objective ?? "awareness"}
Brief: ${body.brief ?? "(none provided)"}
Audience: ${body.audience ?? "general"}
Tone: ${body.tone ?? "confident, helpful"}
Platforms: ${platforms.join(", ")}
Duration: ${days} days, roughly ${perWeek} posts per week.

Produce:
- "themes": 3 to 5 short content pillars for the campaign.
- "posts": exactly ${total} posts. Each post has:
  - "day": integer day offset from campaign start (0 = start day), spread evenly across the duration
  - "platform": one of the campaign platforms (lowercase id)
  - "hook": scroll-stopping opening line, under 90 characters
  - "caption": the full caption, under 700 characters, in the requested tone
  - "hashtags": 5 to 10 tags without the # prefix
  - "format": one of reel, carousel, image, story, text, video

Vary formats and themes. Never invent metrics, prices, dates or links.`;

  try {
    let plan: z.infer<typeof planSchema>;
    try {
      const { object } = await generateObject({ model, schema: planSchema, prompt });
      plan = object;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        plan = { themes: [], posts: [] };
      } else {
        throw error;
      }
    }

    const posts = (plan.posts ?? []).slice(0, total).map((p, i) => ({
      day: Number.isFinite(p.day) ? Math.max(0, Math.min(Math.round(p.day), days)) : i,
      platform: String(p.platform ?? platforms[0]).toLowerCase(),
      hook: String(p.hook ?? "").slice(0, 160),
      caption: String(p.caption ?? "").slice(0, 1200),
      hashtags: (p.hashtags ?? []).slice(0, 12).map((h) => String(h).replace(/^#/, "")),
      format: String(p.format ?? "image").toLowerCase(),
    }));

    const charge = await chargeCredits(authed.userId, "campaign.plan", {
      model: "google/gemini-2.5-flash",
      posts: posts.length,
      platforms,
      surface: "campaign-plan",
    });

    return new Response(
      JSON.stringify({
        themes: (plan.themes ?? []).slice(0, 6).map(String),
        posts,
        _credits: { spent: charge.spent, remaining: charge.remaining, feature: "campaign.plan" },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isRateLimit = message.toLowerCase().includes("rate") || message.includes("429");
    console.error("campaign-plan failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: isRateLimit ? 429 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
