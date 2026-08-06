import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/**
 * Build a Supabase client for an MCP tool handler. MCP tools run on the edge
 * (the Lovable Supabase function), so VITE_ env vars are inlined by Vite at
 * build and Deno env vars are available at runtime as a fallback. The caller's
 * verified bearer token is forwarded so every query is scoped to that user via
 * RLS. Never use a service key here.
 */
interface EdgeDeno {
  env?: { get?: (k: string) => string | undefined };
}

export function edgeSupabase(ctx: ToolContext) {
  const token = typeof ctx.getToken === "function" ? ctx.getToken() : undefined;
  const deno = (globalThis as { Deno?: EdgeDeno }).Deno;
  const url: string =
    (import.meta.env.VITE_SUPABASE_URL as string) ||
    deno?.env?.get?.("SUPABASE_URL") ||
    "";
  const key: string =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
    deno?.env?.get?.("SUPABASE_ANON_KEY") ||
    "";
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

/** Standard auth guard for tool handlers. */
export function requireAuth(ctx: ToolContext): { ok: true } | { ok: false; content: { type: "text"; text: string }[]; isError: true } {
  if (!ctx.isAuthenticated()) {
    return {
      ok: false,
      content: [{ type: "text", text: "Not authenticated. Connect your account via OAuth to use this tool." }],
      isError: true,
    };
  }
  return { ok: true };
}

/** Render a row set as a compact text/structured result. */
export function tableResult(rows: unknown[], summary?: string) {
  const text = summary ? `${summary}\n\n` : "";
  return {
    content: [{ type: "text", text: text + JSON.stringify(rows, null, 2) }],
    structuredContent: rows,
  };
}
