// AI command runner — STREAMING (SSE).
// Streams AI SDK `fullStream` events (text-delta, tool-call, tool-result, finish)
// as `data:` frames the client parses incrementally. Also honors a bounded
// per-user conversation history to give the assistant short-term context memory.
import { streamText, tool, stepCountIs } from "npm:ai@5.0.60";
import { z } from "npm:zod@3.25.76";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";

const SYSTEM = `You are SMMSAAS's in-app command runner. The user types a short instruction and you must translate it into ONE OR MORE tool calls that the app will surface for their approval.

Rules:
- Prefer taking action via tools over long prose. Reply in at most 1–2 sentences after tool calls.
- For anything that writes data (drafts, schedules, rules, segments) always call a tool with concrete arguments; never say "I would…" without calling.
- If the user only asks a question or asks to navigate, call \`open_page\` when possible.
- Every write tool result requires the user's manual approval in the app; make that clear when useful.
- Never invent connected accounts. If the user references a platform, pass its lowercase id (instagram, tiktok, youtube, twitter, linkedin, facebook, threads, pinterest, snapchat, reddit, discord, telegram, whatsapp, twitch).
- Dates: use ISO 8601. If the user says "tomorrow 9am", resolve against the provided \`nowIso\`.
- Use the conversation history to resolve references like "the last one", "same platforms", or "reschedule that". Do not repeat identical tool calls the user already approved unless asked.
`;

interface HistoryTurn {
  prompt: string;
  text?: string;
  toolNames?: string[];
}

interface Attachment {
  kind: "image";
  dataUrl: string;
  name?: string;
  mime?: string;
  size?: number;
}

interface Body {
  prompt: string;
  nowIso?: string;
  context?: {
    connectedPlatformIds?: string[];
    activeAccountHandle?: string | null;
    tone?: string;
    niches?: string[];
    currentRoute?: string;
  };
  history?: HistoryTurn[];
  attachments?: Attachment[];
  mode?: "text" | "voice";
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

  if (!body?.prompt || typeof body.prompt !== "string" || body.prompt.trim().length === 0) {
    return new Response(JSON.stringify({ error: "prompt is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const nowIso = body.nowIso ?? new Date().toISOString();

  const tools = {
    create_caption_draft: tool({
      description:
        "Draft a caption for the caption library. The user must approve it before it appears in their library.",
      inputSchema: z.object({
        title: z.string().min(1).max(120),
        body: z.string().min(1).max(4000),
        hashtags: z.array(z.string()).optional(),
        platformIds: z.array(z.string()).optional(),
      }),
      execute: async (input) => ({
        kind: "caption-draft" as const,
        needsApproval: true,
        payload: {
          id: crypto.randomUUID(),
          title: input.title,
          body: input.body,
          hashtags: input.hashtags ?? [],
          platformIds: input.platformIds ?? [],
          tags: [],
          status: "pending-approval",
          createdAt: new Date().toISOString(),
          source: "ai-command:create_caption_draft",
        },
        targetRoute: "/dashboard/library/captions",
      }),
    }),

    queue_cross_platform_post: tool({
      description:
        "Queue a post to one or more platforms at a specific time. Requires user approval before it is applied.",
      inputSchema: z.object({
        caption: z.string().min(1).max(4000),
        platformIds: z.array(z.string()).min(1),
        scheduledAt: z.string().describe("ISO 8601 datetime."),
        mediaUrls: z.array(z.string()).optional(),
      }),
      execute: async (input) => ({
        kind: "scheduled-post" as const,
        needsApproval: true,
        payload: {
          id: crypto.randomUUID(),
          caption: input.caption,
          platformIds: input.platformIds,
          scheduledAt: input.scheduledAt,
          mediaUrls: input.mediaUrls ?? [],
          status: "pending-approval",
          createdAt: new Date().toISOString(),
          source: "ai-command:queue_cross_platform_post",
        },
        targetRoute: "/dashboard/publish/queue",
      }),
    }),

    generate_hashtags: tool({
      description: "Suggest a list of hashtags for a topic. No approval needed — read-only.",
      inputSchema: z.object({
        topic: z.string().min(1).max(200),
        count: z.number().int().min(3).max(30).optional(),
        platformIds: z.array(z.string()).optional(),
      }),
      execute: async (input) => {
        const count = input.count ?? 12;
        const seed = input.topic.toLowerCase().replace(/[^a-z0-9]+/g, "");
        const bases = [seed, `${seed}life`, `${seed}daily`, `${seed}tips`, `${seed}gram`, `love${seed}`];
        const filler = ["viral", "trending", "explore", "reels", "creator", "community", "growth", "socialmedia"];
        const tags = Array.from(new Set([...bases, ...filler])).slice(0, count);
        return {
          kind: "hashtag-list" as const,
          needsApproval: false,
          payload: { topic: input.topic, tags, platformIds: input.platformIds ?? [] },
          targetRoute: "/dashboard/create/hashtags",
        };
      },
    }),

    open_page: tool({
      description: "Navigate the user to a specific dashboard page. Read-only.",
      inputSchema: z.object({
        route: z
          .string()
          .describe(
            "App route starting with /dashboard, e.g. /dashboard/publish/queue, /dashboard/library/captions, /dashboard/analytics.",
          ),
        reason: z.string().max(160).optional(),
      }),
      execute: async (input) => ({
        kind: "navigate" as const,
        needsApproval: false,
        payload: { route: input.route, reason: input.reason ?? "" },
        targetRoute: input.route,
      }),
    }),
  };

  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-3-flash-preview");

  const context = body.context ?? {};
  const historyBlock =
    body.history && body.history.length
      ? `Recent conversation (oldest → newest):\n${body.history
          .slice(-6)
          .map((h, i) => {
            const tools = h.toolNames?.length ? ` [tools: ${h.toolNames.join(", ")}]` : "";
            return `${i + 1}. USER: ${h.prompt}\n   ASSISTANT: ${(h.text ?? "").slice(0, 240)}${tools}`;
          })
          .join("\n")}`
      : "No prior conversation this session.";

  const contextBlock = `Current context:
- Now: ${nowIso}
- Current route: ${context.currentRoute ?? "(unknown)"}
- Connected platforms: ${(context.connectedPlatformIds ?? []).join(", ") || "(none)"}
- Active handle: ${context.activeAccountHandle ?? "(none)"}
- Brand tone: ${context.tone ?? "(unset)"}
- Niches: ${(context.niches ?? []).join(", ") || "(unset)"}

${historyBlock}`;

  try {
    const result = streamText({
      model,
      system: `${SYSTEM}\n\n${contextBlock}`,
      prompt: body.prompt,
      tools,
      stopWhen: stepCountIs(6),
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        try {
          for await (const chunk of result.fullStream) {
            switch (chunk.type) {
              case "text-delta":
                // AI SDK v5 exposes streaming text under `chunk.text`; older builds used `textDelta`.
                send({
                  type: "text-delta",
                  // deno-lint-ignore no-explicit-any
                  text: (chunk as any).text ?? (chunk as any).textDelta ?? "",
                });
                break;
              case "tool-call":
                send({
                  type: "tool-call",
                  id: chunk.toolCallId,
                  name: chunk.toolName,
                  // deno-lint-ignore no-explicit-any
                  args: (chunk as any).input ?? (chunk as any).args ?? null,
                });
                break;
              case "tool-result":
                send({
                  type: "tool-result",
                  id: chunk.toolCallId,
                  name: chunk.toolName,
                  // deno-lint-ignore no-explicit-any
                  result: (chunk as any).output ?? (chunk as any).result ?? null,
                });
                break;
              case "error":
                send({ type: "error", error: String((chunk as { error: unknown }).error) });
                break;
              case "finish":
                send({ type: "finish" });
                break;
            }
          }
          send({ type: "done" });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error("ai-command stream failed:", message);
          send({ type: "error", error: message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isRateLimit = message.toLowerCase().includes("rate") || message.includes("429");
    const isCredits = message.includes("402") || message.toLowerCase().includes("credit");
    const status = isRateLimit ? 429 : isCredits ? 402 : 500;
    console.error("ai-command failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
