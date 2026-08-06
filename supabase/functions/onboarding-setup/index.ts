// onboarding-setup — turns the onboarding wizard's answers into REAL workspace
// setup, not just UI state. Called once when the user completes onboarding.
//  - persists brand_voice (tone + description) on the profile
//  - seeds a `brands` row if the workspace has none yet
//  - seeds `content_categories` from the user's niches
//  - uses AI to generate a workspace blueprint (content focus, suggested
//    automations, starter hashtags, content mix) stored in onboarding_state.meta

// deno-lint-ignore-file no-explicit-any
import { generateObject, NoObjectGeneratedError } from "npm:ai@5.0.60";
import { z } from "npm:zod@3.25.76";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";
import { requireUser } from "../_shared/auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const blueprintSchema = z.object({
  focus: z.string(),
  suggestedAutomations: z.array(z.string()),
  starterHashtags: z.array(z.string()),
  contentMix: z.array(z.object({ pillar: z.string(), share: z.number() })),
});

interface BodyProfile {
  name?: string;
  role?: string;
  connectedPlatformIds?: string[];
  niches?: string[];
  goals?: string[];
  tone?: string;
  brandDescription?: string;
  postsPerWeek?: number;
  preferredTimes?: string[];
  autonomy?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authed = await requireUser(req);
  if (authed instanceof Response) return authed;

  let body: { profile?: BodyProfile } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const p: BodyProfile = body.profile ?? {};

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const userId = authed.userId;

  try {
    // 1. Persist brand voice.
    const brandVoice = {
      tone: p.tone || "professional",
      description: p.brandDescription || "",
      role: p.role || "",
      niches: p.niches ?? [],
      goals: p.goals ?? [],
      postsPerWeek: p.postsPerWeek ?? 5,
    };
    await db.from("profiles").update({ brand_voice: brandVoice }).eq("id", userId);

    // 2. Seed a brand if none exists.
    const { data: existingBrands } = await db.from("brands").select("id").eq("user_id", userId).limit(1);
    if (!existingBrands || existingBrands.length === 0) {
      const name = (p.name || "My brand").trim();
      await db.from("brands").insert({
        user_id: userId,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "my-brand",
        description: p.brandDescription || null,
        timezone: "UTC",
      });
    }

    // 3. Seed content categories from niches.
    const niches = (p.niches ?? []).slice(0, 12);
    for (const niche of niches) {
      const trimmed = niche.trim();
      if (!trimmed) continue;
      const { data: dup } = await db
        .from("content_categories")
        .select("id")
        .eq("user_id", userId)
        .eq("name", trimmed)
        .limit(1);
      if (!dup || dup.length === 0) {
        await db.from("content_categories").insert({
          user_id: userId,
          name: trimmed,
          color: "#3B82F6",
          emoji: "📌",
          weekly_budget: 1,
          cadence: "weekly",
        });
      }
    }

    // 4. AI workspace blueprint (best-effort — never blocks setup).
    let blueprint = {
      focus: (p.goals ?? []).join(", ") || "Grow a consistent social presence",
      suggestedAutomations: [] as string[],
      starterHashtags: [] as string[],
      contentMix: [] as { pillar: string; share: number }[],
    };
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (key) {
      try {
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-2.5-flash");
        const { object } = await generateObject({
          model,
          schema: blueprintSchema,
          prompt: `You are setting up a social media workspace for a new user.
Role: ${p.role || "creator"}
Niches: ${(p.niches ?? []).join(", ") || "general"}
Goals: ${(p.goals ?? []).join(", ") || "grow"}
Tone: ${p.tone || "professional"}
Platforms: ${(p.connectedPlatformIds ?? []).join(", ") || "instagram, tiktok, twitter"}
Posts per week: ${p.postsPerWeek ?? 5}

Return an object with:
- "focus": one sentence describing their content focus
- "suggestedAutomations": 3-4 concrete automation ideas (e.g. "auto-queue new blog RSS items", "auto-share new videos to Stories")
- "starterHashtags": 8-10 relevant hashtags (no # prefix)
- "contentMix": 4 pillars as {pillar, share} where shares sum to 100`,
        });
        blueprint = {
          focus: String(object.focus ?? "").slice(0, 200),
          suggestedAutomations: (object.suggestedAutomations ?? []).slice(0, 6).map(String),
          starterHashtags: (object.starterHashtags ?? []).slice(0, 15).map((t: string) => t.replace(/^#/, "")),
          contentMix: (object.contentMix ?? []).slice(0, 6),
        };
      } catch (e) {
        if (!NoObjectGeneratedError.isInstance(e)) {
          console.error("onboarding-setup AI failed:", e instanceof Error ? e.message : String(e));
        }
      }
    }

    // 5. Store the blueprint in onboarding_state.meta.
    const { data: prof } = await db
      .from("profiles")
      .select("onboarding_state")
      .eq("id", userId)
      .maybeSingle();
    const state = (prof?.onboarding_state as Record<string, unknown> | null) ?? {};
    state.meta = { ...(state.meta as Record<string, unknown> | undefined), blueprint };
    await db.from("profiles").update({ onboarding_state: state as never }).eq("id", userId);

    return new Response(
      JSON.stringify({ ok: true, blueprint, seeded: { brand: true, categories: niches.length } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
