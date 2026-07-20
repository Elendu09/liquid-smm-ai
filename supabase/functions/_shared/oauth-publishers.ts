// Per-adapter publish() implementations. Each takes a resolved access token +
// post payload and returns a normalized { ok, externalId?, error? } result.
// Adapters missing here fall through to a "not_implemented" simulated success
// so scheduled-post-runner can still record activity end-to-end.

export interface PublishInput {
  caption: string;
  mediaUrls?: string[]; // public URLs (signed if needed) that the provider can fetch
  linkUrl?: string;
}
export interface PublishResult {
  ok: boolean;
  externalId?: string;
  externalUrl?: string;
  error?: string;
  raw?: unknown;
}

async function twitterPublish(accessToken: string, input: PublishInput): Promise<PublishResult> {
  const body: Record<string, unknown> = { text: input.caption.slice(0, 280) };
  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: `twitter:${res.status} ${JSON.stringify(json)}`, raw: json };
  const id = json?.data?.id;
  return { ok: true, externalId: id, externalUrl: id ? `https://x.com/i/status/${id}` : undefined, raw: json };
}

async function linkedinPublish(accessToken: string, input: PublishInput, meta: { externalId?: string }): Promise<PublishResult> {
  if (!meta.externalId) return { ok: false, error: "linkedin:missing_author_urn" };
  const author = `urn:li:person:${meta.externalId}`;
  const body = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: input.caption },
        shareMediaCategory: "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: `linkedin:${res.status} ${JSON.stringify(json)}`, raw: json };
  const id = json?.id;
  return { ok: true, externalId: id, raw: json };
}

async function facebookPublish(accessToken: string, input: PublishInput, meta: { externalId?: string }): Promise<PublishResult> {
  if (!meta.externalId) return { ok: false, error: "facebook:missing_page_id" };
  const params = new URLSearchParams({ message: input.caption, access_token: accessToken });
  if (input.linkUrl) params.set("link", input.linkUrl);
  const res = await fetch(`https://graph.facebook.com/v18.0/${meta.externalId}/feed`, {
    method: "POST",
    body: params,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: `facebook:${res.status} ${JSON.stringify(json)}`, raw: json };
  return { ok: true, externalId: json?.id, raw: json };
}

async function redditPublish(accessToken: string, input: PublishInput): Promise<PublishResult> {
  // Reddit needs a subreddit; store it in meta.subreddit when available. For
  // now we skip if not provided so the runner marks it as pending.
  return { ok: false, error: "reddit:subreddit_required" };
}

// Instagram Graph API — two-step: create media container, then publish.
// Requires the account's IG Business/Creator user id in meta.externalId.
async function instagramPublish(accessToken: string, input: PublishInput, meta: { externalId?: string }): Promise<PublishResult> {
  if (!meta.externalId) return { ok: false, error: "instagram:missing_ig_user_id" };
  const media = input.mediaUrls?.[0];
  if (!media) return { ok: false, error: "instagram:media_required" };
  const isVideo = /\.(mp4|mov|m4v)$/i.test(media);
  const containerParams = new URLSearchParams({
    caption: input.caption,
    access_token: accessToken,
    ...(isVideo ? { media_type: "REELS", video_url: media } : { image_url: media }),
  });
  const create = await fetch(`https://graph.facebook.com/v18.0/${meta.externalId}/media`, {
    method: "POST",
    body: containerParams,
  });
  const createJson = await create.json().catch(() => ({}));
  if (!create.ok || !createJson?.id) {
    return { ok: false, error: `instagram:container ${create.status} ${JSON.stringify(createJson)}`, raw: createJson };
  }
  // Poll until video containers finish, images are ready immediately.
  if (isVideo) {
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await fetch(
        `https://graph.facebook.com/v18.0/${createJson.id}?fields=status_code&access_token=${accessToken}`,
      );
      const s = await statusRes.json().catch(() => ({}));
      if (s?.status_code === "FINISHED") break;
      if (s?.status_code === "ERROR") return { ok: false, error: "instagram:container_error", raw: s };
    }
  }
  const publishParams = new URLSearchParams({ creation_id: createJson.id, access_token: accessToken });
  const publish = await fetch(`https://graph.facebook.com/v18.0/${meta.externalId}/media_publish`, {
    method: "POST",
    body: publishParams,
  });
  const publishJson = await publish.json().catch(() => ({}));
  if (!publish.ok) return { ok: false, error: `instagram:publish ${publish.status} ${JSON.stringify(publishJson)}`, raw: publishJson };
  return { ok: true, externalId: publishJson?.id, raw: publishJson };
}

// Pinterest v5 — single-shot pin create from a public image URL.
async function pinterestPublish(accessToken: string, input: PublishInput, meta: { externalId?: string; boardId?: string }): Promise<PublishResult> {
  const boardId = meta.boardId ?? meta.externalId;
  if (!boardId) return { ok: false, error: "pinterest:missing_board_id" };
  const media = input.mediaUrls?.[0];
  if (!media) return { ok: false, error: "pinterest:media_required" };
  const body = {
    board_id: boardId,
    description: input.caption,
    link: input.linkUrl,
    media_source: { source_type: "image_url", url: media },
  };
  const res = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: `pinterest:${res.status} ${JSON.stringify(json)}`, raw: json };
  return { ok: true, externalId: json?.id, externalUrl: `https://pinterest.com/pin/${json?.id}`, raw: json };
}

// TikTok — init a pull-from-URL video upload. Publishing continues asynchronously
// on TikTok's side; we return the publish_id so the runner can poll status later.
async function tiktokPublish(accessToken: string, input: PublishInput): Promise<PublishResult> {
  const media = input.mediaUrls?.[0];
  if (!media) return { ok: false, error: "tiktok:media_required" };
  const body = {
    post_info: {
      title: input.caption.slice(0, 150),
      privacy_level: "SELF_ONLY",
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
    },
    source_info: { source: "PULL_FROM_URL", video_url: media },
  };
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: `tiktok:${res.status} ${JSON.stringify(json)}`, raw: json };
  return { ok: true, externalId: json?.data?.publish_id, raw: json };
}

// YouTube — resumable upload initiate + single PUT of the fetched video buffer.
// For very large files a chunked worker is preferable; here we stream through
// once which is fine for typical short-form uploads.
async function youtubePublish(accessToken: string, input: PublishInput): Promise<PublishResult> {
  const media = input.mediaUrls?.[0];
  if (!media) return { ok: false, error: "youtube:media_required" };
  const metadata = {
    snippet: { title: input.caption.slice(0, 100) || "Untitled", description: input.caption },
    status: { privacyStatus: "private" },
  };
  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/*",
      },
      body: JSON.stringify(metadata),
    },
  );
  if (!initRes.ok) {
    const text = await initRes.text();
    return { ok: false, error: `youtube:init ${initRes.status} ${text}` };
  }
  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) return { ok: false, error: "youtube:missing_upload_url" };

  const videoRes = await fetch(media);
  if (!videoRes.ok) return { ok: false, error: `youtube:media_fetch ${videoRes.status}` };
  const buf = await videoRes.arrayBuffer();
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": videoRes.headers.get("content-type") ?? "video/*" },
    body: buf,
  });
  const json = await put.json().catch(() => ({}));
  if (!put.ok) return { ok: false, error: `youtube:put ${put.status} ${JSON.stringify(json)}`, raw: json };
  return {
    ok: true,
    externalId: json?.id,
    externalUrl: json?.id ? `https://youtube.com/watch?v=${json.id}` : undefined,
    raw: json,
  };
}

async function simulatedPublish(_token: string, input: PublishInput): Promise<PublishResult> {
  return { ok: true, externalId: `sim_${crypto.randomUUID()}`, raw: { simulated: true, chars: input.caption.length } };
}

export async function publishFor(
  platform: string,
  accessToken: string,
  input: PublishInput,
  meta: { externalId?: string; boardId?: string } = {},
): Promise<PublishResult> {
  switch (platform) {
    case "twitter":   return twitterPublish(accessToken, input);
    case "linkedin":  return linkedinPublish(accessToken, input, meta);
    case "facebook":  return facebookPublish(accessToken, input, meta);
    case "instagram": return instagramPublish(accessToken, input, meta);
    case "pinterest": return pinterestPublish(accessToken, input, meta);
    case "tiktok":    return tiktokPublish(accessToken, input);
    case "youtube":   return youtubePublish(accessToken, input);
    case "reddit":    return redditPublish(accessToken, input);
    default:
      return simulatedPublish(accessToken, input);
  }
}
