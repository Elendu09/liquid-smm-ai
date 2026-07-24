import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { OAUTH_ADAPTERS, isAdapterEnabled } from "../_shared/oauth-adapters.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CALLBACK = `${SUPABASE_URL}/functions/v1/oauth-callback`;

const STATE_COOKIE = "sb_oauth_state";

function b64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return b64url(new Uint8Array(buf));
}

/**
 * Only allow same-origin, relative paths starting with a single "/" — never
 * "//host" (protocol-relative) or full URLs which could be used for phishing.
 */
function safeRedirectPath(input: string | null): string {
  const fallback = "/dashboard/settings/connected";
  if (!input) return fallback;
  if (!input.startsWith("/") || input.startsWith("//")) return fallback;
  // Disallow control chars / whitespace / backslashes.
  if (/[\s\\]/.test(input)) return fallback;
  return input;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const platform = (url.searchParams.get("platform") ?? "").toLowerCase();
    const redirectTo = safeRedirectPath(url.searchParams.get("redirect_to"));

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "not_authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: "not_authenticated" }, 401);

    const adapter = OAUTH_ADAPTERS[platform];
    if (!adapter) return json({ error: "unknown_platform", platform }, 400);
    if (!isAdapterEnabled(adapter)) {
      return json({
        error: "adapter_not_configured",
        message: `Add ${platform.toUpperCase()}_CLIENT_ID / SECRET to enable OAuth for ${adapter.displayName}.`,
      }, 400);
    }

    const state = b64url(crypto.getRandomValues(new Uint8Array(24)));
    const code_verifier = adapter.pkce ? b64url(crypto.getRandomValues(new Uint8Array(48))) : null;
    const code_challenge = code_verifier ? await sha256(code_verifier) : null;

    // Bind the state to this browser via a signed hash stored in an httpOnly
    // cookie. The callback must present a cookie whose hash matches the state
    // recorded in the database, defeating OAuth CSRF / login-fixation.
    const stateHash = await sha256(state);

    await admin.from("oauth_states").insert({
      state,
      user_id: userData.user.id,
      platform,
      code_verifier,
      redirect_to: redirectTo,
      extra: { state_hash: stateHash },
    });

    const params = new URLSearchParams({
      client_id: adapter.clientId!,
      redirect_uri: CALLBACK,
      response_type: adapter.responseType ?? "code",
      scope: adapter.scopes.join(" "),
      state,
      ...(adapter.extraAuthParams ?? {}),
    });
    if (code_challenge) {
      params.set("code_challenge", code_challenge);
      params.set("code_challenge_method", "S256");
    }
    const authorizeUrl = `${adapter.authorizeUrl}?${params.toString()}`;

    // 10 min lifetime — enough for the consent hop, short enough to limit reuse.
    const cookie = `${STATE_COOKIE}=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`;
    return json({ authorize_url: authorizeUrl, state }, 200, { "Set-Cookie": cookie });
  } catch (err) {
    return json({ error: "server_error", detail: String(err) }, 500);
  }
});

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}
