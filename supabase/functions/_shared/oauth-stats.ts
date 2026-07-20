// Per-provider "read profile stats" fetchers. Each returns a normalized
// snapshot; missing providers fall back to a no-op so the collector doesn't
// error out on partially-configured workspaces.

export interface AccountStats {
  followers?: number;
  following?: number;
  posts?: number;
  engagement?: number;
  raw?: unknown;
}

async function twitterStats(token: string, meta: { externalId?: string }): Promise<AccountStats> {
  const uid = meta.externalId;
  if (!uid) return {};
  const res = await fetch(
    `https://api.x.com/2/users/${uid}?user.fields=public_metrics`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = await res.json().catch(() => ({} as any));
  const m = json?.data?.public_metrics;
  return { followers: m?.followers_count, following: m?.following_count, posts: m?.tweet_count, raw: json };
}

async function linkedinStats(token: string): Promise<AccountStats> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  return { raw: json };
}

async function facebookStats(token: string, meta: { externalId?: string }): Promise<AccountStats> {
  if (!meta.externalId) return {};
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${meta.externalId}?fields=fan_count,followers_count&access_token=${token}`,
  );
  const json = await res.json().catch(() => ({} as any));
  return { followers: json?.fan_count ?? json?.followers_count, raw: json };
}

async function instagramStats(token: string, meta: { externalId?: string }): Promise<AccountStats> {
  if (!meta.externalId) return {};
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${meta.externalId}?fields=followers_count,follows_count,media_count&access_token=${token}`,
  );
  const json = await res.json().catch(() => ({} as any));
  return { followers: json?.followers_count, following: json?.follows_count, posts: json?.media_count, raw: json };
}

async function tiktokStats(token: string): Promise<AccountStats> {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,video_count,likes_count",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = await res.json().catch(() => ({} as any));
  const u = json?.data?.user;
  return { followers: u?.follower_count, following: u?.following_count, posts: u?.video_count, raw: json };
}

async function youtubeStats(token: string): Promise<AccountStats> {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = await res.json().catch(() => ({} as any));
  const s = json?.items?.[0]?.statistics;
  return { followers: Number(s?.subscriberCount ?? 0), posts: Number(s?.videoCount ?? 0), raw: json };
}

async function pinterestStats(token: string): Promise<AccountStats> {
  const res = await fetch("https://api.pinterest.com/v5/user_account", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({} as any));
  return { followers: json?.follower_count, following: json?.following_count, posts: json?.pin_count, raw: json };
}

async function redditStats(token: string): Promise<AccountStats> {
  const res = await fetch("https://oauth.reddit.com/api/v1/me", {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "SMMSAAS/1.0" },
  });
  const json = await res.json().catch(() => ({} as any));
  return { followers: json?.subreddit?.subscribers, raw: json };
}

export async function statsFor(platform: string, token: string, meta: { externalId?: string }): Promise<AccountStats> {
  switch (platform) {
    case "twitter":   return twitterStats(token, meta);
    case "linkedin":  return linkedinStats(token);
    case "facebook":  return facebookStats(token, meta);
    case "instagram": return instagramStats(token, meta);
    case "tiktok":    return tiktokStats(token);
    case "youtube":   return youtubeStats(token);
    case "pinterest": return pinterestStats(token);
    case "reddit":    return redditStats(token);
    default:          return {};
  }
}
