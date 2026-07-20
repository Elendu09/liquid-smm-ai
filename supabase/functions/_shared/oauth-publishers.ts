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

async function simulatedPublish(_token: string, input: PublishInput): Promise<PublishResult> {
  return { ok: true, externalId: `sim_${crypto.randomUUID()}`, raw: { simulated: true, chars: input.caption.length } };
}

export async function publishFor(
  platform: string,
  accessToken: string,
  input: PublishInput,
  meta: { externalId?: string } = {},
): Promise<PublishResult> {
  switch (platform) {
    case "twitter":
      return twitterPublish(accessToken, input);
    case "linkedin":
      return linkedinPublish(accessToken, input, meta);
    case "facebook":
      return facebookPublish(accessToken, input, meta);
    case "reddit":
      return redditPublish(accessToken, input);
    default:
      // Instagram / TikTok / YouTube / Pinterest need multi-step upload flows;
      // fall back to simulated success until those pipelines are added.
      return simulatedPublish(accessToken, input);
  }
}
