// Home dashboard AI summary — turns aggregate app state into a concise brief.
// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "../_shared/ai-gateway.ts";
import { requireUser } from "../_shared/auth.ts";

interface Aggregate {
  accounts: { total: number; followers: number; engagement: number };
  scheduled: { total: number; next?: { caption: string; whenISO: string; platforms: string[] } | null };
  posts: { completed: number; failed: number; topPost?: { caption: string; platform: string; metric?: number } | null };
  notifications: { unread: number; critical: number; recentTitles: string[] };
  inbox: { positive: number; negative: number; needsReply: number };
  bestSlot?: { dow: number; hour: number } | null;
}

function fallback(agg: Aggregate) {
  const headline = agg.notifications.critical > 0
    ? `${agg.notifications.critical} item${agg.notifications.critical === 1 ? "" : "s"} need attention`
    : agg.scheduled.total > 0
      ? `${agg.scheduled.total} post${agg.scheduled.total === 1 ? "" : "s"} in the queue`
      : "You're all caught up";
  const highlights: string[] = [];
  if (agg.scheduled.next) highlights.push(`Next post goes live ${new Date(agg.scheduled.next.whenISO).toLocaleString()}`);
  if (agg.posts.topPost?.caption) highlights.push(`Top performer: "${agg.posts.topPost.caption.slice(0, 60)}"`);
  if (agg.inbox.needsReply > 0) highlights.push(`${agg.inbox.needsReply} unanswered inbox thread${agg.inbox.needsReply === 1 ? "" : "s"}`);
  const nextAction = agg.inbox.needsReply > 0
    ? "Clear the inbox queue"
    : agg.scheduled.total === 0
      ? "Schedule your next post"
      : "Keep the momentum going";
  const pulse: "positive" | "mixed" | "attention" =
    agg.notifications.critical > 0 ? "attention" :
    agg.inbox.negative > agg.inbox.positive ? "mixed" : "positive";
  return { headline, highlights, nextAction, pulse };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authed = await requireUser(req);
  if (authed instanceof Response) return authed;
  try {
    const agg = (await req.json()) as Aggregate;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify(fallback(agg)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are the AI brief for a social-media manager's dashboard. Read this JSON snapshot of the last 24-48h and produce a punchy update.

SNAPSHOT:
${JSON.stringify(agg, null, 2)}

Return STRICT JSON with this shape (no markdown, no prose outside JSON):
{
  "headline": "one sentence, <= 80 chars, present-tense",
  "highlights": ["2-3 bullets, each <= 90 chars"],
  "nextAction": "one concrete verb-led suggestion, <= 70 chars",
  "pulse": "positive" | "mixed" | "attention"
}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "raw",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You return only strict JSON. No markdown. No commentary." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("ai-home-summary gateway error", res.status, errText);
      return new Response(JSON.stringify(fallback(agg)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const j = await res.json();
    const raw = j.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    const fb = fallback(agg);
    const out = {
      headline: typeof parsed.headline === "string" ? parsed.headline : fb.headline,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 3).map((s: unknown) => String(s)) : fb.highlights,
      nextAction: typeof parsed.nextAction === "string" ? parsed.nextAction : fb.nextAction,
      pulse: ["positive", "mixed", "attention"].includes(parsed.pulse) ? parsed.pulse : fb.pulse,
    };
    return new Response(JSON.stringify(out), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-home-summary fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
