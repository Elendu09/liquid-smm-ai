// Public read-only endpoint: reports which OAuth adapters have credentials
// configured. Used by the UI to render an accurate "provider readiness"
// checklist without exposing secret values.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { OAUTH_ADAPTERS, isAdapterEnabled } from "../_shared/oauth-adapters.ts";

// Human-readable env var requirements per provider. Keep in sync with
// _shared/oauth-adapters.ts.
const REQUIRED_ENV: Record<string, string[]> = {
  twitter: ["TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET"],
  linkedin: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  facebook: ["META_APP_ID", "META_APP_SECRET"],
  instagram: ["META_APP_ID", "META_APP_SECRET"],
  tiktok: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  youtube: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"],
  pinterest: ["PINTEREST_APP_ID", "PINTEREST_APP_SECRET"],
  reddit: ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET"],
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const providers = Object.values(OAUTH_ADAPTERS).map((a) => ({
    platform: a.platform,
    displayName: a.displayName,
    enabled: isAdapterEnabled(a),
    scopes: a.scopes,
    requiredSecrets: REQUIRED_ENV[a.platform] ?? [],
  }));
  return new Response(JSON.stringify({ providers }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
