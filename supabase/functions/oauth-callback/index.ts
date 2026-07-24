import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { OAUTH_ADAPTERS, isAdapterEnabled } from "../_shared/oauth-adapters.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CALLBACK = `${SUPABASE_URL}/functions/v1/oauth-callback`;
const APP_URL = Deno.env.get("APP_URL") ?? "";
const STATE_COOKIE = "sb_oauth_state";

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Same-origin relative path only — reject full URLs, protocol-relative and userinfo tricks. */
function safeRedirectPath(input: string | null | undefined): string {
  const fallback = "/dashboard/settings/connected";
  if (!input) return fallback;
  if (!input.startsWith("/") || input.startsWith("//")) return fallback;
  if (/[\s\\]/.test(input)) return fallback;
  return input;
}

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    const [k, ...v] = part.split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) return redirectApp(`/dashboard/settings/connected?oauth_error=${encodeURIComponent(error)}`);
  if (!code || !state) return redirectApp(`/dashboard/settings/connected?oauth_error=missing_params`);

  // CSRF defense: the browser must present the state cookie set by oauth-start.
  const cookieState = parseCookie(req.headers.get("cookie"), STATE_COOKIE);
  if (!cookieState || cookieState !== state) {
    return redirectApp(`/dashboard/settings/connected?oauth_error=state_mismatch`);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: st } = await admin.from("oauth_states").select("*").eq("state", state).maybeSingle();
  if (!st) return redirectApp(`/dashboard/settings/connected?oauth_error=invalid_state`);

  // Double-check the stored hash still matches (defense in depth against DB tampering).
  const expectedHash = await sha256Hex(state);
  const storedHash = (st.extra as { state_hash?: string } | null)?.state_hash;
  if (storedHash && storedHash !== expectedHash) {
    await admin.from("oauth_states").delete().eq("state", state);
    return redirectApp(`/dashboard/settings/connected?oauth_error=state_mismatch`);
  }
  await admin.from("oauth_states").delete().eq("state", state);

  const adapter = OAUTH_ADAPTERS[st.platform];
  if (!adapter || !isAdapterEnabled(adapter)) {
    return redirectApp(`/dashboard/settings/connected?oauth_error=adapter_missing`);
  }

  // Exchange code
  const tokenParams = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: adapter.clientId!,
    client_secret: adapter.clientSecret!,
    redirect_uri: CALLBACK,
  });
  if (st.code_verifier) tokenParams.set("code_verifier", st.code_verifier);

  const tokenRes = await fetch(adapter.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: tokenParams.toString(),
  });
  const tokenText = await tokenRes.text();
  if (!tokenRes.ok) {
    console.error("token exchange failed", tokenRes.status, tokenText);
    return redirectApp(`/dashboard/settings/connected?oauth_error=token_exchange_failed`);
  }
  let token: any;
  try { token = JSON.parse(tokenText); } catch { token = Object.fromEntries(new URLSearchParams(tokenText)); }
  const accessToken = token.access_token;
  const refreshToken = token.refresh_token ?? null;
  const expiresIn = Number(token.expires_in ?? 0);
  const scope = token.scope ?? adapter.scopes.join(" ");

  // Fetch profile if adapter supports it
  let profile: { username: string; displayName: string; avatar?: string; externalId?: string } | null = null;
  if (adapter.profileUrl && adapter.parseProfile) {
    try {
      const profRes = await fetch(adapter.profileUrl, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      });
      const profJson = await profRes.json();
      profile = adapter.parseProfile(profJson);
    } catch (err) {
      console.warn("profile fetch failed", err);
    }
  }

  const accountRow = {
    user_id: st.user_id,
    platform_id: st.platform,
    username: profile?.username ?? st.platform,
    display_name: profile?.displayName ?? profile?.username ?? st.platform,
    avatar: profile?.avatar,
    is_active: true,
    status: "active",
    external_id: profile?.externalId,
    last_sync: new Date().toISOString(),
  };
  const { data: existing } = await admin
    .from("social_accounts")
    .select("id")
    .eq("user_id", st.user_id)
    .eq("platform_id", st.platform)
    .eq("username", accountRow.username)
    .maybeSingle();

  let accountId = existing?.id;
  if (accountId) {
    await admin.from("social_accounts").update(accountRow).eq("id", accountId);
  } else {
    const { data: ins, error: insErr } = await admin
      .from("social_accounts")
      .insert(accountRow)
      .select("id")
      .single();
    if (insErr) {
      console.error("social_accounts insert failed", insErr);
      return redirectApp(`/dashboard/settings/connected?oauth_error=account_upsert_failed`);
    }
    accountId = ins.id;
  }

  await admin.from("social_account_tokens").upsert({
    account_id: accountId,
    user_id: st.user_id,
    platform: st.platform,
    access_token: accessToken,
    refresh_token: refreshToken,
    scope,
    expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    meta: {},
  }, { onConflict: "account_id" });

  const safePath = safeRedirectPath(st.redirect_to);
  return redirectApp(`${safePath}?oauth=success&platform=${st.platform}`);
});

function redirectApp(path: string) {
  const safe = safeRedirectPath(path.split("?")[0]) + (path.includes("?") ? `?${path.split("?").slice(1).join("?")}` : "");
  const dest = APP_URL ? `${APP_URL.replace(/\/$/, "")}${safe}` : safe;
  // Clear the state cookie on the way out.
  const clear = `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
  return new Response(null, { status: 302, headers: { Location: dest, "Set-Cookie": clear } });
}
