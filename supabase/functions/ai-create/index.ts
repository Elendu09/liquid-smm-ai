// Typed AI content operations for the Create hub dialogs.
// Uses Lovable AI Gateway via the AI SDK with `generateObject`.
// IMPORTANT: schemas here MUST stay constraint-free (no .min/.max/length/enum-of-runtime).
// State limits in the prompt and clamp in code — schema bounds crash Gemini at request
// time and cause post-hoc AI_NoObjectGeneratedError on any model.
import { generateObject, NoObjectGeneratedError } from "npm:ai@5.0.60";
import { z } from "npm:zod@3.25.76";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";
import { requireUser } from "../_shared/auth.ts";

const captionsSchema = z.object({
  captions: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
      hashtags: z.array(z.string()),
    }),
  ),
});

const hashtagsSchema = z.object({
  topic: z.string(),
  tags: z.array(
    z.object({
      tag: z.string(),
      volume: z.string(), // "low" | "medium" | "high" | "viral" — validated in code
      difficulty: z.string(), // "easy" | "medium" | "hard" — validated in code
    }),
  ),
});

const translateSchema = z.object({
  translated: z.string(),
  language: z.string(),
});

const replySchema = z.object({
  suggestions: z.array(z.string()),
});

const briefSchema = z.object({
  caption: z.string(),
  hashtags: z.array(z.string()),
  hooks: z.array(z.string()),
  cta: z.string(),
});

interface Body {
  op: "captions" | "hashtags" | "translate" | "brief" | "reply";
  message?: string;
  author?: string;
  topic?: string;
  tone?: string;
  platform?: string;
  count?: number;
  text?: string;
  targetLanguage?: string;
  goal?: string;
  audience?: string;
}

const VOLUMES = ["low", "medium", "high", "viral"] as const;
const DIFFS = ["easy", "medium", "hard"] as const;
const pick = <T extends string>(v: string, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

// Best-effort JSON recovery from `error.text` when schema validation fails.
function tryParse(text: string | undefined): unknown | null {
  if (!text) return null;
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const start = cleaned.search(/[\{\[]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    try {
      return JSON.parse(
        cleaned.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1"),
      );
    } catch {
      return null;
    }
  }
}

async function runObject<T>(
  fn: () => Promise<{ object: T }>,
  fallback: (raw: unknown | null) => T,
): Promise<T> {
  try {
    const { object } = await fn();
    return object;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      const raw = tryParse((error as { text?: string }).text);
      return fallback(raw);
    }
    throw error;
  }
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

  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-2.5-flash");

  try {
    let result: unknown;

    if (body.op === "captions") {
      const count = Math.min(Math.max(body.count ?? 3, 1), 10);
      const raw = await runObject(
        () =>
          generateObject({
            model,
            schema: captionsSchema,
            prompt: `Generate exactly ${count} distinct social media caption variants for the topic: "${body.topic ?? ""}".
Tone: ${body.tone ?? "engaging"}.
Platform: ${body.platform ?? "instagram"}.
Each variant must have:
- a short "title" (max 120 chars)
- a "body" under 800 chars
- 5-10 relevant "hashtags" as strings WITHOUT the # prefix
Return an object with a "captions" array.`,
          }),
        (fb) => (fb as typeof captionsSchema._type) ?? { captions: [] },
      );
      const captions = (raw.captions ?? []).slice(0, count).map((c) => ({
        title: String(c.title ?? "").slice(0, 120),
        body: String(c.body ?? "").slice(0, 1200),
        hashtags: (c.hashtags ?? []).slice(0, 15).map(String),
      }));
      result = { captions };
    } else if (body.op === "hashtags") {
      const raw = await runObject(
        () =>
          generateObject({
            model,
            schema: hashtagsSchema,
            prompt: `Research 15 hashtags for the topic "${body.topic ?? ""}" on ${body.platform ?? "instagram"}.
Mix broad + niche. For each tag include:
- "tag" (no # prefix)
- "volume": one of "low", "medium", "high", "viral"
- "difficulty": one of "easy", "medium", "hard"
Return an object with "topic" and a "tags" array of 5 to 30 items.`,
          }),
        (fb) =>
          (fb as typeof hashtagsSchema._type) ?? {
            topic: body.topic ?? "",
            tags: [],
          },
      );
      const tags = (raw.tags ?? []).slice(0, 30).map((t) => ({
        tag: String(t.tag ?? "").replace(/^#/, ""),
        volume: pick(String(t.volume ?? ""), VOLUMES, "medium"),
        difficulty: pick(String(t.difficulty ?? ""), DIFFS, "medium"),
      }));
      result = { topic: raw.topic ?? body.topic ?? "", tags };
    } else if (body.op === "translate") {
      const raw = await runObject(
        () =>
          generateObject({
            model,
            schema: translateSchema,
            prompt: `Translate the following caption to ${body.targetLanguage ?? "Spanish"}. Preserve emojis and hashtags. Return the translated text and the target language name.
---
${body.text ?? ""}`,
          }),
        (fb) =>
          (fb as typeof translateSchema._type) ?? {
            translated: body.text ?? "",
            language: body.targetLanguage ?? "",
          },
      );
      result = {
        translated: String(raw.translated ?? ""),
        language: String(raw.language ?? body.targetLanguage ?? ""),
      };
    } else if (body.op === "reply") {
      const count = Math.min(Math.max(body.count ?? 3, 1), 5);
      const raw = await runObject(
        () =>
          generateObject({
            model,
            schema: replySchema,
            prompt: `You are a social media community manager replying to an inbound ${body.platform ?? "instagram"} message.
Author: ${body.author ?? "the customer"}
Message: "${body.message ?? ""}"
Tone: ${body.tone ?? "friendly"}

Write exactly ${count} distinct reply options. Each reply must be under 320 characters, address the message directly, stay on-brand, and never invent facts (no prices, no dates, no links unless present in the message).
Return an object with a "suggestions" array of plain strings.`,
          }),
        (fb) => (fb as typeof replySchema._type) ?? { suggestions: [] },
      );
      result = {
        suggestions: (raw.suggestions ?? []).slice(0, count).map((s) => String(s).slice(0, 400)),
      };
    } else if (body.op === "brief") {
      const raw = await runObject(
        () =>
          generateObject({
            model,
            schema: briefSchema,
            prompt: `You are producing a full post kit for a social media manager.
Goal: ${body.goal ?? "grow followers"}
Audience: ${body.audience ?? "general"}
Platform: ${body.platform ?? "instagram"}
Topic: ${body.topic ?? ""}
Tone: ${body.tone ?? "engaging"}

Return an object with:
- "caption" (<=800 chars)
- "hashtags": 8-12 strings (no #)
- "hooks": 4 opener strings
- "cta": one call-to-action string`,
          }),
        (fb) =>
          (fb as typeof briefSchema._type) ?? {
            caption: "",
            hashtags: [],
            hooks: [],
            cta: "",
          },
      );
      result = {
        caption: String(raw.caption ?? "").slice(0, 1200),
        hashtags: (raw.hashtags ?? []).slice(0, 15).map(String),
        hooks: (raw.hooks ?? []).slice(0, 6).map(String),
        cta: String(raw.cta ?? ""),
      };
    } else {
      return new Response(JSON.stringify({ error: "Unknown op" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isRateLimit = message.toLowerCase().includes("rate") || message.includes("429");
    const isCredits = message.includes("402") || message.toLowerCase().includes("credit");
    const status = isRateLimit ? 429 : isCredits ? 402 : 500;
    console.error("ai-create failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
