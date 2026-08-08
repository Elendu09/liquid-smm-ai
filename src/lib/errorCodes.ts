/**
 * Error code explainer registry.
 *
 * The third-party social APIs (and our own backend) return error codes like
 * "API Error 190" or generic "400 Bad Request". Users have no idea what
 * those mean, and "vague error codes" is one of the top pain points with
 * Hootsuite/Sprout. This registry turns every code we know about into a
 * human sentence, the likely cause, and a concrete next step.
 *
 * Pattern: explain(error) → ExplainResult | null
 * If null, the UI shows a generic but still kind fallback rather than the
 * raw code.
 */

export type ErrorSeverity = "info" | "warning" | "critical";

export interface ExplainResult {
  /** Short human-readable headline. */
  headline: string;
  /** One or two sentences explaining the cause. */
  cause: string;
  /** Optional concrete next step the user can take. */
  fix?: string;
  /** Optional deep-link into the relevant doc. */
  doc?: string;
  severity: ErrorSeverity;
}

interface Entry {
  /** Regex pattern that matches the raw error. */
  pattern: RegExp;
  explain: (match: RegExpMatchArray) => Omit<ExplainResult, "severity">;
  severity: ErrorSeverity;
}

const ENTRIES: Entry[] = [
  /* ---------------- Instagram / Facebook (Meta Graph) ---------------- */
  { pattern: /\b(?:190|GRAPH_API_190)\b/i, severity: "warning", explain: () => ({
    headline: "Your access token has expired or been revoked.",
    cause: "Meta rotates long-lived tokens roughly every 60 days. If you re-installed the app, revoked a permission, or changed your password, the old token is now invalid.",
    fix: "Click Re-authorize to send the account through OAuth again — your drafts, queue and analytics are kept.",
    doc: "connections",
  })},
  { pattern: /\b(?:100|GRAPH_API_100)\b/i, severity: "critical", explain: () => ({
    headline: "Your app doesn't have a permission this API call needs.",
    cause: "Meta returned error 100 because the connected app is missing a scope the destination endpoint requires (e.g. instagram_manage_comments for comment replies).",
    fix: "Reconnect the account so we can request the missing scope. If that fails, contact support with this error id.",
    doc: "connections",
  })},
  { pattern: /\b(?:10|GRAPH_API_10)\b.*permission/i, severity: "warning", explain: () => ({
    headline: "Permission denied for this action.",
    cause: "The connected app is not allowed to perform this action — usually because the page or profile role is editor/viewer instead of admin.",
    fix: "Make sure your Facebook Page role is Admin and your Instagram account is Business or Creator.",
    doc: "connections",
  })},
  { pattern: /reel.*(?:too long|duration)/i, severity: "warning", explain: () => ({
    headline: "Your video is too long for Instagram Reels.",
    cause: "Reels allow up to 90 seconds. This draft is longer than 90 s.",
    fix: "Trim the video in the composer, or move it to a Feed post.",
  })},
  { pattern: /story.*(?:too long|duration)/i, severity: "warning", explain: () => ({
    headline: "Your story segment is over 60 s.",
    cause: "Instagram Stories max out at 60 s per segment. Longer clips are silently rejected.",
    fix: "Split the video into 60 s chunks, or use Reels for the full cut.",
  })},
  { pattern: /aspect\s*ratio.*(?:not support|invalid|reject)/i, severity: "warning", explain: () => ({
    headline: "This aspect ratio is not supported by the destination.",
    cause: "Each network has its own accepted aspect ratios. TikTok and Reels want 9:16; Feed wants 1:1, 4:5, or 1.91:1; YouTube Shorts wants 9:16.",
    fix: "Open the media field and click Auto-adapt to crop for this destination.",
  })},
  { pattern: /copyright.*(?:detected|violation|claim)/i, severity: "critical", explain: () => ({
    headline: "Copyright was detected in your media.",
    cause: "The audio or video you uploaded matched content in the platform's rights database.",
    fix: "Swap the audio, remove the disputed clip, or dispute the claim on the platform's app.",
  })},
  /* ---------------- X / Twitter ---------------- */
  { pattern: /\b(?:89|TWITTER_89)\b/i, severity: "warning", explain: () => ({
    headline: "Your X / Twitter access token has expired.",
    cause: "X access tokens expire after ~2 hours without refresh. We normally refresh in the background, but a manual re-auth fixes edge cases.",
    fix: "Click Re-authorize on the X account row.",
    doc: "connections",
  })},
  { pattern: /\b(?:403|TWITTER_403)\b.*duplicate/i, severity: "info", explain: () => ({
    headline: "This is a duplicate post.",
    cause: "X rejects tweets that match an extremely recent post (exact text, same account, last few minutes).",
    fix: "Wait a few minutes and retry, or change the copy slightly.",
  })},
  { pattern: /\b(?:186|TWITTER_186)\b/i, severity: "warning", explain: () => ({
    headline: "Your tweet is longer than the character limit.",
    cause: "X allows up to 280 characters in a standard tweet, or 25,000 for Premium.",
    fix: "Shorten the copy, or remove it from the X destination in this draft.",
  })},
  /* ---------------- TikTok ---------------- */
  { pattern: /tiktok.*(?:video.*length|duration.*limit)/i, severity: "warning", explain: () => ({
    headline: "Your video is too long for TikTok.",
    cause: "TikTok allows up to 10 minutes (60 minutes for some accounts).",
    fix: "Trim the video or lower the duration cap on the destination.",
  })},
  { pattern: /tiktok.*(?:music|audio).*(?:not available|region)/i, severity: "info", explain: () => ({
    headline: "This audio isn't available in the destination region.",
    cause: "Some TikTok sounds are region-locked. We can't pre-detect every case.",
    fix: "Pick a different sound, or move this post to a region where the sound is licensed.",
  })},
  /* ---------------- LinkedIn ---------------- */
  { pattern: /linkedin.*(?:ugc|share).*image/i, severity: "warning", explain: () => ({
    headline: "LinkedIn rejected the image format.",
    cause: "LinkedIn's UGC image endpoint only accepts JPEG, PNG and GIF — WEBP and animated PNG are blocked.",
    fix: "Re-export the image as JPEG/PNG and re-attach.",
  })},
  /* ---------------- YouTube ---------------- */
  { pattern: /youtube.*short.*duration/i, severity: "warning", explain: () => ({
    headline: "Your Short is over 60 s.",
    cause: "YouTube Shorts must be 60 s or less, vertical, and under the upload cap.",
    fix: "Trim the video, or change the destination to a regular YouTube video.",
  })},
  /* ---------------- Generic / fallback ---------------- */
  { pattern: /\b401\b/, severity: "warning", explain: () => ({
    headline: "We couldn't authenticate this request.",
    cause: "The platform told us our credentials are no longer valid for this account.",
    fix: "Re-authorize the account from the Connections page.",
    doc: "connections",
  })},
  { pattern: /\b403\b/, severity: "warning", explain: () => ({
    headline: "The platform denied this request.",
    cause: "Either the app is missing a permission, the role on the page is too low, or the post violates a content policy.",
    fix: "Check the account's role and try again. If it keeps failing, contact support with the error id.",
  })},
  { pattern: /\b404\b.*destination|page not found/i, severity: "critical", explain: () => ({
    headline: "We can't find the destination page or profile.",
    cause: "The connected account may have been renamed, deleted, or transferred to a new owner.",
    fix: "Open Connections and re-link the correct page.",
    doc: "connections",
  })},
  { pattern: /\b429\b|rate\s*limit/i, severity: "warning", explain: () => ({
    headline: "We hit the platform's rate limit.",
    cause: "The destination throttled our requests. This is normal at high publishing volume.",
    fix: "We automatically retried with backoff. If you see this often, lower the per-hour cap in Rate Limits.",
    doc: "rate-limits",
  })},
  { pattern: /\b5(?:00|02|03)\b/, severity: "critical", explain: () => ({
    headline: "The platform is having an outage.",
    cause: "The destination returned a 5xx error. This is on the platform's side, not your account.",
    fix: "We've queued the post and will retry when the platform recovers. No action needed.",
  })},
  { pattern: /network|fetch failed|timeout|ETIMEDOUT/i, severity: "warning", explain: () => ({
    headline: "The request timed out before the platform replied.",
    cause: "Our worker couldn't reach the platform's API in time. The post is still queued and will be retried.",
    fix: "If this keeps happening for one destination, check the connection health pill on the account row.",
  })},
  { pattern: /idempotency|duplicate\s*key/i, severity: "info", explain: () => ({
    headline: "Recovered a duplicate publish.",
    cause: "Our idempotency layer caught a second attempt to publish the same draft. We rolled back the duplicate and kept the original.",
    fix: "No action needed. The original post is live.",
  })},
];

/** Best-effort explanation. Returns null when we don't recognise the error. */
export function explainError(raw: string | null | undefined): ExplainResult | null {
  if (!raw) return null;
  for (const entry of ENTRIES) {
    const m = raw.match(entry.pattern);
    if (m) {
      return { severity: entry.severity, ...entry.explain(m) };
    }
  }
  return null;
}

/** Severity class for a small dot. */
export function severityTone(severity: ErrorSeverity): string {
  switch (severity) {
    case "info": return "text-cyan-500";
    case "warning": return "text-amber-500";
    case "critical": return "text-rose-500";
  }
}

export function severityLabel(severity: ErrorSeverity): string {
  switch (severity) {
    case "info": return "Heads up";
    case "warning": return "Action needed";
    case "critical": return "Blocking";
  }
}
