/**
 * Keyless fallback AI provider.
 *
 * Pollinations (https://text.pollinations.ai) exposes an OpenAI-compatible
 * chat-completions endpoint that requires NO API key and NO auth header.
 * We use it purely as a safety net: whenever the Lovable AI Gateway is rate
 * limited (429), out of credits (402) or otherwise unavailable, engagement
 * automation keeps working instead of hard-failing.
 *
 * It is intentionally NOT the primary provider — quality/latency are lower.
 */

const FREE_ENDPOINT = "https://text.pollinations.ai/openai";
const FREE_TEXT_ENDPOINT = "https://text.pollinations.ai";
const TIMEOUT_MS = 25_000;

export interface FreeAiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function withTimeout(input: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Raw text completion through the keyless provider. */
export async function freeAiText(messages: FreeAiMessage[]): Promise<string> {
  try {
    const res = await withTimeout(FREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai", messages, private: true }),
    });
    if (res.ok) {
      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) return content;
    }
  } catch {
    /* fall through to the GET endpoint */
  }

  // Second keyless route: plain GET prompt endpoint.
  const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
  const res = await withTimeout(
    `${FREE_TEXT_ENDPOINT}/${encodeURIComponent(prompt).slice(0, 6000)}`,
    { method: "GET" },
  );
  if (!res.ok) throw new Error(`free-ai failed (${res.status})`);
  return await res.text();
}

/** Extract the first JSON object/array from a model response. */
export function extractJson<T>(text: string): T | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start === -1 || end <= start) return null;
  const slice = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(slice) as T;
  } catch {
    try {
      return JSON.parse(slice.replace(/,\s*([}\]])/g, "$1")) as T;
    } catch {
      return null;
    }
  }
}

/** JSON completion through the keyless provider. Returns null when unusable. */
export async function freeAiJson<T>(system: string, user: string): Promise<T | null> {
  try {
    const text = await freeAiText([
      { role: "system", content: `${system}\n\nRespond with raw JSON only. No prose, no markdown fences.` },
      { role: "user", content: user },
    ]);
    return extractJson<T>(text);
  } catch {
    return null;
  }
}
