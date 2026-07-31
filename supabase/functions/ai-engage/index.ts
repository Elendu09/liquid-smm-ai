/**
 * ai-engage — social-native engagement intelligence for the automation bot
 * and the inbox routing engine.
 *
 * Ops
 *  - analyze-post    : read someone else's post, decide whether/how to engage
 *  - analyze-comment : sentiment / intent / language / spam for an inbound comment or DM
 *  - draft-comment   : write a human-sounding comment on someone else's post
 *  - draft-reply     : write replies to an inbound comment or DM
 *
 * Every op runs through the Lovable AI Gateway first and transparently falls
 * back to a keyless provider when the gateway is unavailable (402/429/outage),
 * so automation never silently stops.
 */
import { generateText } from "npm:ai@5.0.60";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";
import { requireUser } from "../_shared/auth.ts";
import { freeAiJson, extractJson } from "../_shared/free-ai.ts";

const MODEL = "google/gemini-2.5-flash";

/** Per-platform comment/reply etiquette so drafts read native, not generic. */
const PLATFORM_RULES: Record<string, { max: number; style: string }> = {
  instagram: { max: 300, style: "warm, emoji-friendly (1-2 max), casual, 1-2 short sentences" },
  facebook: { max: 400, style: "friendly and conversational, complete sentences, minimal emoji" },
  tiktok: { max: 150, style: "very short, playful, lowercase-ok, at most one emoji" },
  twitter: { max: 260, style: "punchy, witty, no hashtags, one sentence" },
  x: { max: 260, style: "punchy, witty, no hashtags, one sentence" },
  threads: { max: 480, style: "casual and opinionated, conversational, no hashtags" },
  linkedin: { max: 700, style: "professional, insight-first, no emoji, 2-3 sentences" },
  youtube: { max: 500, style: "supportive and specific about the video content" },
  pinterest: { max: 400, style: "descriptive and helpful" },
  reddit: { max: 800, style: "plain-spoken, no marketing tone, genuinely additive, no emoji" },
  bluesky: { max: 280, style: "casual, community-minded, no hashtags" },
  telegram: { max: 500, style: "direct and helpful" },
  discord: { max: 500, style: "casual community tone" },
  whatsapp: { max: 400, style: "personal and direct" },
  snapchat: { max: 200, style: "very casual and short" },
};

const rulesFor = (p?: string) =>
  PLATFORM_RULES[(p ?? "instagram").toLowerCase()] ?? { max: 300, style: "friendly and concise" };

interface Body {
  op: "analyze-post" | "analyze-comment" | "draft-comment" | "draft-reply";
  text?: string;
  author?: string;
  platform?: string;
  tone?: string;
  brandVoice?: string;
  language?: string;
  count?: number;
  keywords?: string[];
  negativeKeywords?: string[];
}

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Gateway first, keyless fallback second. Returns null only if both fail. */
async function complete<T>(system: string, user: string, apiKey: string | undefined): Promise<T | null> {
  if (apiKey) {
    try {
      const gateway = createLovableAiGatewayProvider(apiKey);
      const { text } = await generateText({
        model: gateway(MODEL),
        system: `${system}\n\nRespond with raw JSON only. No prose, no markdown fences.`,
        prompt: user,
      });
      const parsed = extractJson<T>(text);
      if (parsed) return parsed;
    } catch (err) {
      console.error("gateway failed, falling back to keyless provider:", String(err));
    }
  }
  return await freeAiJson<T>(system, user);
}

const clampList = (v: unknown, max: number, cap: number): string[] =>
  (Array.isArray(v) ? v : [])
    .filter((x) => typeof x === "string" && x.trim())
    .slice(0, max)
    .map((x) => String(x).trim().slice(0, cap));

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fallback;
};

const oneOf = (v: unknown, allowed: string[], fallback: string) =>
  allowed.includes(String(v).toLowerCase()) ? String(v).toLowerCase() : fallback;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authed = await requireUser(req);
  if (authed instanceof Response) return authed;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const key = Deno.env.get("LOVABLE_API_KEY");
  const platform = (body.platform ?? "instagram").toLowerCase();
  const rules = rulesFor(platform);
  const text = String(body.text ?? "").slice(0, 4000);
  const author = String(body.author ?? "someone").slice(0, 80);

  try {
    if (body.op === "analyze-post") {
      const kw = clampList(body.keywords, 25, 40);
      const neg = clampList(body.negativeKeywords, 25, 40);
      const out = await complete<Record<string, unknown>>(
        `You are a senior social media manager triaging other people's ${platform} posts for an engagement bot. You judge whether interacting is worthwhile and safe for the brand.`,
        `Post author: @${author}
Post content:
"""${text}"""

Target keywords/topics the brand cares about: ${kw.length ? kw.join(", ") : "(none specified)"}
Blocked keywords/topics (never engage): ${neg.length ? neg.join(", ") : "(none specified)"}

Return JSON:
{
 "topic": "short topic label",
 "summary": "one sentence on what the post is actually about",
 "language": "ISO language name",
 "sentiment": "positive|neutral|negative",
 "spam": true|false,
 "sensitive": true|false,
 "relevance": 0-100,
 "shouldEngage": true|false,
 "suggestedActions": ["like","comment","follow","share"],
 "reason": "one sentence explaining the decision"
}`,
        key,
      );
      if (!out) return json({ error: "AI unavailable" }, 503);
      return json({
        topic: String(out.topic ?? "").slice(0, 80),
        summary: String(out.summary ?? "").slice(0, 300),
        language: String(out.language ?? "English").slice(0, 40),
        sentiment: oneOf(out.sentiment, ["positive", "neutral", "negative"], "neutral"),
        spam: Boolean(out.spam),
        sensitive: Boolean(out.sensitive),
        relevance: num(out.relevance, 50),
        shouldEngage: Boolean(out.shouldEngage) && !out.spam && !out.sensitive,
        suggestedActions: clampList(out.suggestedActions, 4, 12),
        reason: String(out.reason ?? "").slice(0, 240),
      });
    }

    if (body.op === "analyze-comment") {
      const out = await complete<Record<string, unknown>>(
        `You classify inbound ${platform} comments and DMs for a social inbox so they can be routed to the right teammate.`,
        `From: @${author}
Message:
"""${text}"""

Return JSON:
{
 "sentiment": "positive|neutral|negative",
 "intent": "question|compliment|complaint|lead|collab|support|spam|other",
 "language": "ISO language name",
 "urgency": "low|medium|high",
 "spam": true|false,
 "summary": "one short sentence",
 "suggestedAction": "reply|assign|ignore|escalate"
}`,
        key,
      );
      if (!out) return json({ error: "AI unavailable" }, 503);
      return json({
        sentiment: oneOf(out.sentiment, ["positive", "neutral", "negative"], "neutral"),
        intent: oneOf(
          out.intent,
          ["question", "compliment", "complaint", "lead", "collab", "support", "spam", "other"],
          "other",
        ),
        language: String(out.language ?? "English").slice(0, 40),
        urgency: oneOf(out.urgency, ["low", "medium", "high"], "low"),
        spam: Boolean(out.spam),
        summary: String(out.summary ?? "").slice(0, 240),
        suggestedAction: oneOf(out.suggestedAction, ["reply", "assign", "ignore", "escalate"], "reply"),
      });
    }

    if (body.op === "draft-comment" || body.op === "draft-reply") {
      const count = Math.min(Math.max(body.count ?? 3, 1), 5);
      const isComment = body.op === "draft-comment";
      const out = await complete<Record<string, unknown>>(
        `You write comments as a real human community manager on ${platform}. You never sound like a bot, never use generic filler like "Great post!", never repeat the original text, and never pitch unless asked.`,
        `${isComment ? "Someone else's post" : "An inbound message"} from @${author}:
"""${text}"""

Write ${count} distinct ${isComment ? "comments to leave on this post" : "replies to this message"}.
Hard rules:
- Platform: ${platform}. Style: ${rules.style}.
- Each option MUST be under ${rules.max} characters.
- Reference something specific from the content so it reads human.
- Match the language of the original message${body.language ? ` (${body.language})` : ""}.
- Tone: ${body.tone ?? "friendly"}.
${body.brandVoice ? `- Brand voice notes: ${String(body.brandVoice).slice(0, 500)}` : ""}
- No hashtags unless the platform culture expects them. No emoji spam.

Return JSON: { "options": ["...", "..."] }`,
        key,
      );
      if (!out) return json({ error: "AI unavailable" }, 503);
      const options = clampList(out.options, count, rules.max);
      return json({ options, platform, maxLength: rules.max });
    }

    return json({ error: "Unknown op" }, 400);
  } catch (err) {
    console.error("ai-engage error:", String(err));
    return json({ error: String(err instanceof Error ? err.message : err) }, 500);
  }
});
