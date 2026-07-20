// Provider adapter registry for the OAuth broker.
// Each adapter declares scopes + endpoints and reads its credentials from env.
// When a provider's env vars are missing, `enabled` = false and the broker
// falls back to manual-connect so the UI keeps working before secrets ship.

export interface OAuthAdapter {
  platform: string;
  displayName: string;
  clientId?: string;
  clientSecret?: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  pkce: boolean;
  responseType?: string;
  extraAuthParams?: Record<string, string>;
  profileUrl?: string;
  parseProfile?: (json: unknown) => { username: string; displayName: string; avatar?: string; externalId?: string };
}

const env = (k: string) => Deno.env.get(k) ?? undefined;

export const OAUTH_ADAPTERS: Record<string, OAuthAdapter> = {
  twitter: {
    platform: "twitter",
    displayName: "X (Twitter)",
    clientId: env("TWITTER_CLIENT_ID"),
    clientSecret: env("TWITTER_CLIENT_SECRET"),
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.x.com/2/oauth2/token",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    pkce: true,
    profileUrl: "https://api.x.com/2/users/me",
    parseProfile: (json: any) => ({
      username: json?.data?.username ?? "",
      displayName: json?.data?.name ?? "",
      externalId: json?.data?.id,
    }),
  },
  linkedin: {
    platform: "linkedin",
    displayName: "LinkedIn",
    clientId: env("LINKEDIN_CLIENT_ID"),
    clientSecret: env("LINKEDIN_CLIENT_SECRET"),
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["openid", "profile", "email", "w_member_social"],
    pkce: false,
    profileUrl: "https://api.linkedin.com/v2/userinfo",
    parseProfile: (json: any) => ({
      username: json?.email?.split("@")[0] ?? json?.sub ?? "",
      displayName: json?.name ?? "",
      avatar: json?.picture,
      externalId: json?.sub,
    }),
  },
  facebook: {
    platform: "facebook",
    displayName: "Facebook",
    clientId: env("META_APP_ID"),
    clientSecret: env("META_APP_SECRET"),
    authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: ["public_profile", "email", "pages_show_list", "pages_read_engagement", "pages_manage_posts"],
    pkce: false,
    profileUrl: "https://graph.facebook.com/me?fields=id,name,picture",
    parseProfile: (json: any) => ({
      username: json?.id ?? "",
      displayName: json?.name ?? "",
      avatar: json?.picture?.data?.url,
      externalId: json?.id,
    }),
  },
  instagram: {
    platform: "instagram",
    displayName: "Instagram",
    clientId: env("META_APP_ID"),
    clientSecret: env("META_APP_SECRET"),
    authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: [
      "instagram_basic",
      "instagram_content_publish",
      "pages_show_list",
      "pages_read_engagement",
    ],
    pkce: false,
  },
  tiktok: {
    platform: "tiktok",
    displayName: "TikTok",
    clientId: env("TIKTOK_CLIENT_KEY"),
    clientSecret: env("TIKTOK_CLIENT_SECRET"),
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: ["user.info.basic", "video.publish", "video.upload"],
    pkce: true,
    profileUrl: "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
    parseProfile: (json: any) => ({
      username: json?.data?.user?.display_name ?? "",
      displayName: json?.data?.user?.display_name ?? "",
      avatar: json?.data?.user?.avatar_url,
      externalId: json?.data?.user?.open_id,
    }),
  },
  youtube: {
    platform: "youtube",
    displayName: "YouTube",
    clientId: env("GOOGLE_OAUTH_CLIENT_ID"),
    clientSecret: env("GOOGLE_OAUTH_CLIENT_SECRET"),
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/youtube.upload"],
    pkce: true,
    extraAuthParams: { access_type: "offline", prompt: "consent" },
    profileUrl: "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    parseProfile: (json: any) => {
      const c = json?.items?.[0];
      return {
        username: c?.snippet?.customUrl ?? c?.snippet?.title ?? "",
        displayName: c?.snippet?.title ?? "",
        avatar: c?.snippet?.thumbnails?.default?.url,
        externalId: c?.id,
      };
    },
  },
  pinterest: {
    platform: "pinterest",
    displayName: "Pinterest",
    clientId: env("PINTEREST_APP_ID"),
    clientSecret: env("PINTEREST_APP_SECRET"),
    authorizeUrl: "https://www.pinterest.com/oauth/",
    tokenUrl: "https://api.pinterest.com/v5/oauth/token",
    scopes: ["boards:read", "pins:read", "pins:write", "user_accounts:read"],
    pkce: false,
    profileUrl: "https://api.pinterest.com/v5/user_account",
    parseProfile: (json: any) => ({
      username: json?.username ?? "",
      displayName: json?.username ?? "",
      avatar: json?.profile_image,
      externalId: json?.account_id,
    }),
  },
  reddit: {
    platform: "reddit",
    displayName: "Reddit",
    clientId: env("REDDIT_CLIENT_ID"),
    clientSecret: env("REDDIT_CLIENT_SECRET"),
    authorizeUrl: "https://www.reddit.com/api/v1/authorize",
    tokenUrl: "https://www.reddit.com/api/v1/access_token",
    scopes: ["identity", "submit", "read"],
    pkce: false,
    extraAuthParams: { duration: "permanent" },
    profileUrl: "https://oauth.reddit.com/api/v1/me",
    parseProfile: (json: any) => ({
      username: json?.name ?? "",
      displayName: json?.name ?? "",
      avatar: json?.icon_img,
      externalId: json?.id,
    }),
  },
};

export function isAdapterEnabled(a: OAuthAdapter | undefined): a is OAuthAdapter {
  return !!(a && a.clientId && a.clientSecret);
}
