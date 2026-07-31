/**
 * Keyless AI fallback for the browser.
 *
 * Pollinations (text.pollinations.ai / image.pollinations.ai) is a free,
 * open, no-auth AI endpoint — no API key, no account, no CORS proxy needed.
 * It backs the SkyRank tools so those keep producing output whenever
 * skyrank.digital is unreachable or rate limited.
 */

const TEXT_URL = "https://text.pollinations.ai/openai";
const IMAGE_URL = "https://image.pollinations.ai/prompt";
const TIMEOUT = 25_000;

export async function freeAiComplete(system: string, user: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(TEXT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: "openai",
        private: true,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim() ? content.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Deterministic, keyless image URL — no request needed until the <img> loads. */
export function freeAiImageUrl(prompt: string): string {
  return `${IMAGE_URL}/${encodeURIComponent(prompt.slice(0, 500))}?nologo=true&width=1024&height=1024`;
}

/** Strip surrounding quotes/markdown a model sometimes adds. */
export function cleanText(text: string): string {
  return text.replace(/^```[a-z]*\s*/i, "").replace(/```$/, "").replace(/^["']|["']$/g, "").trim();
}

/** Pull hashtags out of a free-form model response. */
export function parseHashtags(text: string): string[] {
  const tagged = text.match(/#[\w\u00C0-\u024F]+/g);
  if (tagged?.length) return Array.from(new Set(tagged.map((t) => t.slice(1))));
  return text
    .split(/[\n,]/)
    .map((t) => t.replace(/^[\s\-*\d.]+/, "").replace(/^#/, "").trim())
    .filter((t) => t && t.length < 40 && !t.includes(" "))
    .slice(0, 30);
}
