// Typed AI content operations for the Create hub dialogs.
// Uses Lovable AI Gateway via the AI SDK with `generateObject`, so each op
// returns a strict schema-shaped result the UI can trust.
import { generateObject } from "npm:ai@5.0.60";
import { z } from "npm:zod@3.25.76";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";

const captionsSchema = z.object({
  captions: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        body: z.string().min(1).max(1200),
        hashtags: z.array(z.string()).max(15),
      }),
    )
    .min(1)
    .max(10),
});

const hashtagsSchema = z.object({
  topic: z.string(),
  tags: z
    .array(
      z.object({
        tag: z.string(),
        volume: z.enum(["low", "medium", "high", "viral"]),
        difficulty: z.enum(["easy", "medium", "hard"]),
      }),
    )
    .min(5)
    .max(30),
});

const translateSchema = z.object({
  translated: z.string().min(1),
  language: z.string(),
});

const briefSchema = z.object({
  caption: z.string().min(1),
  hashtags: z.array(z.string()).min(3).max(15),
  hooks: z.array(z.string()).min(3).max(6),
  cta: z.string().min(1),
});

interface Body {
  op: "captions" | "hashtags" | "translate" | "brief";
  topic?: string;
  tone?: string;
  platform?: string;
  count?: number;
  text?: string;
  targetLanguage?: string;
  goal?: string;
  audience?: string;
}

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
  const model = gateway("google/gemini-3-flash-preview");

  try {
    let result: unknown;

    if (body.op === "captions") {
      const { object } = await generateObject({
        model,
        schema: captionsSchema,
        prompt: `Generate ${body.count ?? 3} distinct social media caption variants for the topic: "${body.topic ?? ""}".
Tone: ${body.tone ?? "engaging"}.
Platform: ${body.platform ?? "instagram"}.
Each variant must have a short title, a body under 800 chars, and 5-10 relevant hashtags (no # prefix in the string).`,
      });
      result = object;
    } else if (body.op === "hashtags") {
      const { object } = await generateObject({
        model,
        schema: hashtagsSchema,
        prompt: `Research 15 hashtags for the topic "${body.topic ?? ""}" on ${body.platform ?? "instagram"}.
Mix broad + niche. For each: estimate 'volume' (low/medium/high/viral) and 'difficulty' (easy/medium/hard).
Do NOT include the # prefix.`,
      });
      result = object;
    } else if (body.op === "translate") {
      const { object } = await generateObject({
        model,
        schema: translateSchema,
        prompt: `Translate the following caption to ${body.targetLanguage ?? "Spanish"}. Preserve emojis and hashtags. Return the translated text and the target language name.
---
${body.text ?? ""}`,
      });
      result = object;
    } else if (body.op === "brief") {
      const { object } = await generateObject({
        model,
        schema: briefSchema,
        prompt: `You are producing a full post kit for a social media manager.
Goal: ${body.goal ?? "grow followers"}
Audience: ${body.audience ?? "general"}
Platform: ${body.platform ?? "instagram"}
Topic: ${body.topic ?? ""}
Tone: ${body.tone ?? "engaging"}

Return: caption (<=800 chars), 8-12 hashtags (no #), 4 hook variants (openers), one CTA.`,
      });
      result = object;
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
