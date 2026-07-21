// Per-provider post-level metrics fetchers. Each returns a normalized snapshot
// for a single provider post id; unsupported platforms return null so the
// collector skips them cleanly.

export interface PostMetrics {
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  video_views?: number;
  raw?: unknown;
}

async function twitterPost(token: string, id: string): Promise<PostMetrics | null> {
  const res = await fetch(
    `https://api.x.com/2/tweets/${id}?tweet.fields=public_metrics,non_public_metrics`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = await res.json().catch(() => ({} as any));
  const p = json?.data?.public_metrics ?? {};
  const n = json?.data?.non_public_metrics ?? {};
  return {
    likes: p.like_count,
    comments: p.reply_count,
    shares: p.retweet_count + (p.quote_count ?? 0),
    impressions: n.impression_count ?? p.impression_count,
    clicks: n.url_link_clicks,
    video_views: p.view_count,
    raw: json,
  };
}

async function facebookPost(token: string, id: string): Promise<PostMetrics | null> {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${id}?fields=reactions.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_impressions_unique,post_clicks)&access_token=${token}`,
  );
  const json = await res.json().catch(() => ({} as any));
  const ins = Object.fromEntries((json?.insights?.data ?? []).map((d: any) => [d.name, d.values?.[0]?.value]));
  return {
    likes: json?.reactions?.summary?.total_count,
    comments: json?.comments?.summary?.total_count,
    shares: json?.shares?.count,
    impressions: ins.post_impressions,
    reach: ins.post_impressions_unique,
    clicks: ins.post_clicks,
    raw: json,
  };
}

async function instagramPost(token: string, id: string): Promise<PostMetrics | null> {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${id}?fields=like_count,comments_count,insights.metric(impressions,reach,saved,video_views)&access_token=${token}`,
  );
  const json = await res.json().catch(() => ({} as any));
  const ins = Object.fromEntries((json?.insights?.data ?? []).map((d: any) => [d.name, d.values?.[0]?.value]));
  return {
    likes: json?.like_count,
    comments: json?.comments_count,
    impressions: ins.impressions,
    reach: ins.reach,
    saves: ins.saved,
    video_views: ins.video_views,
    raw: json,
  };
}

async function linkedinPost(token: string, urn: string): Promise<PostMetrics | null> {
  const res = await fetch(
    `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(urn)}`,
    { headers: { Authorization: `Bearer ${token}`, "LinkedIn-Version": "202405" } },
  );
  const json = await res.json().catch(() => ({} as any));
  return {
    likes: json?.likesSummary?.totalLikes,
    comments: json?.commentsSummary?.aggregatedTotalComments,
    raw: json,
  };
}

async function youtubeVideo(token: string, id: string): Promise<PostMetrics | null> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = await res.json().catch(() => ({} as any));
  const s = json?.items?.[0]?.statistics;
  if (!s) return null;
  return {
    likes: Number(s.likeCount ?? 0),
    comments: Number(s.commentCount ?? 0),
    video_views: Number(s.viewCount ?? 0),
    raw: json,
  };
}

async function pinterestPin(token: string, id: string): Promise<PostMetrics | null> {
  const res = await fetch(
    `https://api.pinterest.com/v5/pins/${id}/analytics?metric_types=IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = await res.json().catch(() => ({} as any));
  const all = json?.all?.summary_metrics ?? {};
  return {
    impressions: all.IMPRESSION,
    saves: all.SAVE,
    clicks: (all.PIN_CLICK ?? 0) + (all.OUTBOUND_CLICK ?? 0),
    raw: json,
  };
}

export async function postMetricsFor(
  platform: string,
  token: string,
  externalId: string,
): Promise<PostMetrics | null> {
  try {
    switch (platform) {
      case "twitter":   return await twitterPost(token, externalId);
      case "facebook":  return await facebookPost(token, externalId);
      case "instagram": return await instagramPost(token, externalId);
      case "linkedin":  return await linkedinPost(token, externalId);
      case "youtube":   return await youtubeVideo(token, externalId);
      case "pinterest": return await pinterestPin(token, externalId);
      default:          return null;
    }
  } catch (_err) {
    return null;
  }
}
