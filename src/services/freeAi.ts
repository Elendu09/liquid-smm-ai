/**
 * Keyless, zero-login AI for the browser.
 *
 * No API key, no OAuth, no account, no backend setup. Providers are tried in
 * order and the first usable answer wins, so a single outage never leaves the
 * UI without a response:
 *
 *   1. Pollinations OpenAI-compatible POST  (text.pollinations.ai/openai)
 *   2. Pollinations plain GET prompt route  (text.pollinations.ai/<prompt>)
 *   3. Puter.js — lazily loaded from its CDN, keyless "user pays" AI
 *
 * Security notes:
 *  - Output is always returned as PLAIN TEXT and rendered as text, never HTML.
 *  - Prompts are scrubbed of anything that looks like a credential before they
 *    leave the browser, and this path is only used for non-sensitive prompts.
 *  - Every request is abortable and time-boxed.
 */

const TEXT_URL = "https://text.pollinations.ai/openai";
const TEXT_GET_URL = "https://text.pollinations.ai";
const IMAGE_URL = "https://image.pollinations.ai/prompt";
const PUTER_CDN = "https://js.puter.com/v2/";
const TIMEOUT = 25_000;

export type FreeAiProvider = "pollinations" | "pollinations-get" | "puter";

export interface FreeAiResult {
  text: string;
  provider: FreeAiProvider;
}

/* ------------------------------------------------------------------ *
 * Safety
 * ------------------------------------------------------------------ */

const SECRET_PATTERNS: RegExp[] = [
  /\b(sk|pk|rk)-[A-Za-z0-9_-]{12,}\b/g,
  /\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{6,}\b/g, // JWT
  /\b(?:api[_-]?key|secret|password|token|bearer)\s*[:=]\s*\S+/gi,
];

/** Strip credential-shaped strings before anything leaves the browser. */
export function sanitizePrompt(text: string): string {
  return SECRET_PATTERNS.reduce((acc, re) => acc.replace(re, "[redacted]"), text ?? "").slice(0, 8000);
}

/* ------------------------------------------------------------------ *
 * Providers
 * ------------------------------------------------------------------ */

async function withTimeout(
  input: string,
  init: RequestInit,
  signal?: AbortSignal,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

async function pollinationsPost(system: string, user: string, signal?: AbortSignal) {
  const res = await withTimeout(
    TEXT_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        private: true,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    },
    signal,
  );
  if (!res.ok) return null;
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim() ? content.trim() : null;
}

async function pollinationsGet(system: string, user: string, signal?: AbortSignal) {
  const prompt = `${system}\n\n${user}`;
  const res = await withTimeout(
    `${TEXT_GET_URL}/${encodeURIComponent(prompt).slice(0, 6000)}`,
    { method: "GET" },
    signal,
  );
  if (!res.ok) return null;
  const text = await res.text();
  return text.trim() ? text.trim() : null;
}

/* -------- Puter.js (lazy CDN load, keyless) -------- */

type PuterGlobal = { ai?: { chat: (prompt: string) => Promise<unknown> } };
let puterLoading: Promise<PuterGlobal | null> | null = null;

function loadPuter(): Promise<PuterGlobal | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const existing = (window as unknown as { puter?: PuterGlobal }).puter;
  if (existing?.ai) return Promise.resolve(existing);
  if (puterLoading) return puterLoading;

  puterLoading = new Promise<PuterGlobal | null>((resolve) => {
    const script = document.createElement("script");
    script.src = PUTER_CDN;
    script.async = true;
    const done = (ok: boolean) =>
      resolve(ok ? ((window as unknown as { puter?: PuterGlobal }).puter ?? null) : null);
    script.onload = () => done(true);
    script.onerror = () => done(false);
    document.head.appendChild(script);
    // Never hang the UI on a CDN that is blocked or slow.
    setTimeout(() => done(false), 8000);
  });
  return puterLoading;
}

async function puterChat(system: string, user: string) {
  const puter = await loadPuter();
  if (!puter?.ai?.chat) return null;
  const out = await puter.ai.chat(`${system}\n\n${user}`);
  const text =
    typeof out === "string"
      ? out
      : ((out as { message?: { content?: string }; text?: string })?.message?.content ??
        (out as { text?: string })?.text ??
        "");
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

/* ------------------------------------------------------------------ *
 * Router
 * ------------------------------------------------------------------ */

const CHAIN: { id: FreeAiProvider; run: (s: string, u: string, sig?: AbortSignal) => Promise<string | null> }[] = [
  { id: "pollinations", run: pollinationsPost },
  { id: "pollinations-get", run: pollinationsGet },
  { id: "puter", run: puterChat },
];

/** Try every keyless provider in order. Returns null only if all fail. */
export async function freeAiRun(
  system: string,
  user: string,
  signal?: AbortSignal,
): Promise<FreeAiResult | null> {
  const safeSystem = sanitizePrompt(system);
  const safeUser = sanitizePrompt(user);
  for (const provider of CHAIN) {
    if (signal?.aborted) return null;
    try {
      const text = await provider.run(safeSystem, safeUser, signal);
      if (text) return { text: cleanText(text), provider: provider.id };
    } catch {
      /* try the next provider */
    }
  }
  return null;
}

/** Back-compat helper: plain text or null. */
export async function freeAiComplete(
  system: string,
  user: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const out = await freeAiRun(system, user, signal);
  return out?.text ?? null;
}

/** Deterministic, keyless image URL — no request needed until the <img> loads. */
export function freeAiImageUrl(prompt: string): string {
  return `${IMAGE_URL}/${encodeURIComponent(sanitizePrompt(prompt).slice(0, 500))}?nologo=true&width=1024&height=1024`;
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
