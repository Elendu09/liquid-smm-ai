/**
 * Best-effort real social stats for competitor handles, per network.
 *
 * Only public, CORS-friendly endpoints are used — nothing requires a key or the
 * user's OAuth. Walled platforms (Instagram, X, TikTok, LinkedIn, Facebook,
 * Threads, Pinterest, Snapchat) expose no public follower API, so those return
 * `null` and the UI falls back to manual snapshots. Networks that DO expose
 * public data:
 *   - Bluesky  → public.api.bsky.app (real followers / posts)
 *   - Reddit   → www.reddit.com JSON (subreddit subscribers / user karma)
 *   - YouTube  → channel RSS best-effort (returns latest videos, not counts)
 */

export interface SocialStats {
  followers: number;
  posts: number;
  source: string;
  fetchedAt: string;
}

function parseCount(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

async function json(url: string, headers?: Record<string, string>): Promise<any> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchBluesky(handle: string): Promise<SocialStats | null> {
  const clean = handle.replace(/^@/, "").toLowerCase();
  try {
    const d = await json(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(clean)}`,
      { Accept: "application/json" },
    );
    return {
      followers: parseCount(d?.followersCount),
      posts: parseCount(d?.postsCount),
      source: "Bluesky API",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function fetchReddit(handle: string): Promise<SocialStats | null> {
  const clean = handle.replace(/^u\//, "").replace(/^@/, "");
  const isSubreddit = /^r\//i.test(handle) || !clean;
  try {
    if (isSubreddit) {
      const name = clean.replace(/^r\//i, "");
      const d = await json(`https://www.reddit.com/r/${encodeURIComponent(name)}/about.json`, {
        Accept: "application/json",
        "User-Agent": "smmsaas/1.0",
      });
      return {
        followers: parseCount(d?.data?.subscribers),
        posts: 0,
        source: "Reddit API",
        fetchedAt: new Date().toISOString(),
      };
    }
    const d = await json(`https://www.reddit.com/u/${encodeURIComponent(clean)}/about.json`, {
      Accept: "application/json",
      "User-Agent": "smmsaas/1.0",
    });
    return {
      followers: 0,
      posts: parseCount(d?.data?.link_karma),
      source: "Reddit API",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function fetchYouTube(handle: string): Promise<SocialStats | null> {
  const clean = handle.replace(/^@/, "");
  try {
    // Channel RSS: latest videos for a handle (id-free). Returns activity, not counts.
    const d = await json(`https://www.youtube.com/feeds/videos.xml?user=${encodeURIComponent(clean)}`, {
      Accept: "application/atom+xml",
    });
    const count = Array.isArray(d?.entry) ? d.entry.length : d?.feed?.entry?.length ?? 0;
    return { followers: 0, posts: count, source: "YouTube RSS", fetchedAt: new Date().toISOString() };
  } catch {
    return null;
  }
}

/**
 * Fetch real, public stats for a competitor handle on a given platform.
 * Returns null when the platform has no public API or the fetch failed.
 */
export async function fetchSocialStats(platform: string, handle: string): Promise<SocialStats | null> {
  switch (platform.toLowerCase()) {
    case "bluesky": return fetchBluesky(handle);
    case "reddit": return fetchReddit(handle);
    case "youtube": return fetchYouTube(handle);
    default:
      // Instagram, X, TikTok, LinkedIn, Facebook, Threads, Pinterest, Snapchat:
      // no public follower API. Honest fallback — the UI offers manual snapshots.
      return null;
  }
}
