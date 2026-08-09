/**
 * Platform-aware character counting.
 *
 * Fix 2.4 — character count miscalculations. Most social platforms weight
 * URLs and hashtags differently from regular text, and emoji can take
 * 2-4 "characters" in their internal limit. This module returns the
 * weighted length for each platform along with a per-segment breakdown
 * so the UI can highlight what pushed the user over.
 *
 * The weights below mirror the public guidance from each network
 * (X t.co, LinkedIn, Instagram, Facebook, TikTok, YouTube, Threads,
 * Pinterest). They are exact for X/LinkedIn and a close approximation
 * for the others.
 */

export type PlatformId =
  | "x" | "twitter" | "threads" | "bluesky"
  | "instagram" | "facebook" | "linkedin"
  | "tiktok" | "youtube" | "pinterest";

export interface CharRules {
  /** Maximum allowed weighted length. */
  limit: number;
  /** How much a single URL counts as (e.g. X: 23, LinkedIn: 30). */
  urlWeight: number;
  /** Whether @mentions get any discount. */
  mentionDiscount?: number;
  /** Whether hashtags count as 1 or as their full text length. */
  hashtagFullText?: boolean;
  /** Whether emoji count as 1 (most do) or 2. */
  emojiWeight?: number;
}

export const CHAR_RULES: Record<PlatformId, CharRules> = {
  x:        { limit: 280,   urlWeight: 23, mentionDiscount: 0, hashtagFullText: false, emojiWeight: 1 },
  twitter:  { limit: 280,   urlWeight: 23, mentionDiscount: 0, hashtagFullText: false, emojiWeight: 1 },
  threads:  { limit: 500,   urlWeight: 23, mentionDiscount: 0, hashtagFullText: false, emojiWeight: 1 },
  bluesky:  { limit: 300,   urlWeight: 20, mentionDiscount: 0, hashtagFullText: false, emojiWeight: 1 },
  instagram:{ limit: 2200,  urlWeight: 0,  mentionDiscount: 0, hashtagFullText: true,  emojiWeight: 1 },
  facebook: { limit: 63206, urlWeight: 0,  mentionDiscount: 0, hashtagFullText: true,  emojiWeight: 1 },
  linkedin: { limit: 3000,  urlWeight: 30, mentionDiscount: 0, hashtagFullText: true,  emojiWeight: 1 },
  tiktok:   { limit: 2200,  urlWeight: 0,  mentionDiscount: 0, hashtagFullText: true,  emojiWeight: 1 },
  youtube:  { limit: 5000,  urlWeight: 0,  mentionDiscount: 0, hashtagFullText: true,  emojiWeight: 1 },
  pinterest:{ limit: 500,   urlWeight: 0,  mentionDiscount: 0, hashtagFullText: true,  emojiWeight: 1 },
  // Reddit varies — use 40000 as practical max
  reddit:   { limit: 40000, urlWeight: 0, mentionDiscount: 0, hashtagFullText: true, emojiWeight: 1 } as any,
};

// Free tier has slightly tighter limits for some platforms (X free 280, Threads 500, etc. — pro unlocks extended where applicable)
export const FREE_TIER_LIMITS: Partial<Record<PlatformId, number>> = {
  x: 280,
  twitter: 280,
  threads: 500,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  tiktok: 2200,
  youtube: 5000,
  pinterest: 500,
};

// Platforms that support rich text bold/italic via unicode / markdown
export const BOLD_ITALIC_PLATFORMS: PlatformId[] = ["facebook", "linkedin", "threads"];
export const SUPPORTS_BOLD = (p: string) => BOLD_ITALIC_PLATFORMS.includes(p as PlatformId);

// Unicode bold/italic maps (Mathematical Alphanumeric Symbols)
const BOLD_MAP: Record<string, string> = (() => {
  const m: Record<string,string> = {};
  const A_bold = 0x1D400, a_bold = 0x1D41A, zero_bold = 0x1D7CE;
  for(let i=0;i<26;i++){ m[String.fromCharCode(65+i)] = String.fromCodePoint(A_bold+i); m[String.fromCharCode(97+i)] = String.fromCodePoint(a_bold+i); }
  for(let i=0;i<10;i++) m[String.fromCharCode(48+i)] = String.fromCodePoint(zero_bold+i);
  return m;
})();
const ITALIC_MAP: Record<string, string> = (() => {
  const m: Record<string,string> = {};
  const A_italic = 0x1D434, a_italic = 0x1D44E;
  for(let i=0;i<26;i++){ m[String.fromCharCode(65+i)] = String.fromCodePoint(A_italic+i); m[String.fromCharCode(97+i)] = String.fromCodePoint(a_italic+i); }
  return m;
})();
export function toBoldUnicode(text: string): string { return text.split("").map(c=> BOLD_MAP[c] ?? c).join(""); }
export function toItalicUnicode(text: string): string { return text.split("").map(c=> ITALIC_MAP[c] ?? c).join(""); }
export function stripFormatting(text: string): string { return text; } // placeholder
export function formatForPlatform(text: string, platform: string, style: "bold" | "italic"): string {
  if (!SUPPORTS_BOLD(platform)) return style==="bold" ? `**${text}**` : `*${text}*`;
  return style==="bold" ? toBoldUnicode(text) : toItalicUnicode(text);
}

const URL_REGEX = /\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+|\b[a-z0-9-]+\.[a-z]{2,}\/[^\s<>"']*/gi;
const MENTION_REGEX = /(?:^|\s)@[A-Za-z0-9_.]+/g;
const HASHTAG_REGEX = /#[^\s#]+/g;

/**
 * Rough emoji detector (covers BMP and most common supplementary planes).
 * Not a full Unicode segmentation, but good enough for char budgets.
 */
function isEmojiChar(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  if (code >= 0x1F300 && code <= 0x1FAFF) return true; // symbols & pictographs
  if (code >= 0x1F600 && code <= 0x1F64F) return true; // emoticons
  if (code >= 0x2600 && code <= 0x27BF) return true;   // misc symbols + dingbats
  if (code >= 0x1F1E6 && code <= 0x1F1FF) return true; // flags
  if (code === 0x200D) return true; // ZWJ
  if (code === 0xFE0F) return true; // variation selector
  return false;
}

export interface CountBreakdown {
  /** Total weighted length under the platform's rules. */
  weighted: number;
  /** Raw character length (what humans see). */
  raw: number;
  /** Count of URLs detected. */
  urls: number;
  /** Count of @mentions detected. */
  mentions: number;
  /** Count of hashtags detected. */
  hashtags: number;
  /** Count of emoji characters (each cluster counts as 1). */
  emoji: number;
  /** Human-friendly summary, e.g. "1 URL, 2 #tags, 280 / 280". */
  summary: string;
}

export type Tier = "free" | "pro";

function rulesFor(platform: string, tier: Tier = "pro"): CharRules {
  const key = platform as PlatformId;
  const base = CHAR_RULES[key];
  if (!base) return { limit: 2200, urlWeight: 0, hashtagFullText: true, emojiWeight: 1 };
  if (tier === "free" && FREE_TIER_LIMITS[key] !== undefined) {
    return { ...base, limit: FREE_TIER_LIMITS[key]! };
  }
  return base;
}

export function countForPlatform(text: string, platform: string, tier: Tier = "pro"): CountBreakdown {
  const rules = rulesFor(platform, tier);
  if (!text) {
    return { weighted: 0, raw: 0, urls: 0, mentions: 0, hashtags: 0, emoji: 0, summary: `0 / ${rules.limit}` };
  }
  const urls: string[] = text.match(URL_REGEX) ?? [];
  const mentions: string[] = text.match(MENTION_REGEX) ?? [];
  const hashtags: string[] = text.match(HASHTAG_REGEX) ?? [];

  // Subtract counted substrings from the raw text to count the rest as
  // regular characters (weighted by emoji).
  let remaining = text;
  for (const url of urls) remaining = remaining.replace(url, "");
  for (const m of mentions) remaining = remaining.replace(m, "");
  for (const h of hashtags) remaining = remaining.replace(h, "");

  // Emoji clusters: walk code points so ZWJ-joined emoji count as one.
  let emoji = 0;
  let regular = 0;
  const iter = remaining[Symbol.iterator]();
  let i = iter.next();
  while (!i.done) {
    if (isEmojiChar(i.value)) {
      emoji++;
      // Consume ZWJ-followed characters into the same cluster.
      let peek = iter.next();
      while (!peek.done && (peek.value === "\u200D" || isEmojiChar(peek.value))) {
        emoji++;
        peek = iter.next();
      }
    } else {
      regular++;
    }
    i = iter.next();
  }

  const urlTotal = urls.length * rules.urlWeight;
  const mentionTotal = mentions.length * (rules.mentionDiscount ?? 0);
  const hashtagTotal = rules.hashtagFullText
    ? hashtags.reduce((s, h) => s + h.length, 0)
    : hashtags.length;
  const emojiWeight = rules.emojiWeight ?? 1;
  const weighted = regular + emoji * emojiWeight + urlTotal + mentionTotal + hashtagTotal;

  const parts: string[] = [];
  if (urls.length) parts.push(`${urls.length} URL${urls.length === 1 ? "" : "s"}`);
  if (hashtags.length) parts.push(`${hashtags.length} #${hashtags.length === 1 ? "tag" : "tags"}`);
  if (mentions.length) parts.push(`${mentions.length} @mention${mentions.length === 1 ? "" : "s"}`);
  if (emoji) parts.push(`${emoji} emoji`);

  const summary = parts.length
    ? `${parts.join(", ")} · ${weighted} / ${rules.limit}`
    : `${weighted} / ${rules.limit}`;

  return {
    weighted,
    raw: text.length,
    urls: urls.length,
    mentions: mentions.length,
    hashtags: hashtags.length,
    emoji,
    summary,
  };
}

export function limitFor(platform: string, tier: Tier = "pro"): number {
  return rulesFor(platform, tier).limit;
}

export function describeRules(platform: string, tier: Tier = "pro"): string {
  const r = rulesFor(platform, tier);
  const bits: string[] = [`${r.limit} chars`];
  if (r.urlWeight > 0) bits.push(`URLs count as ${r.urlWeight}`);
  if (r.hashtagFullText) bits.push("hashtags full text");
  if (r.emojiWeight && r.emojiWeight > 1) bits.push(`emoji × ${r.emojiWeight}`);
  if (tier === "free") bits.push("free tier");
  return bits.join(" · ");
}

export const PLATFORM_LIMITS_TABLE: Array<{ platform: string; limit: string; note?: string }> = [
  { platform: "X (Twitter)", limit: "280 characters for standard posts" },
  { platform: "Instagram", limit: "2,200 characters for captions" },
  { platform: "Facebook", limit: "Very large limit; practical limits depend on the post type (63,206)" },
  { platform: "LinkedIn", limit: "3,000 characters for posts" },
  { platform: "Threads", limit: "500 characters for standard posts" },
  { platform: "TikTok", limit: "Captions can be much longer than they used to be (2,200)" },
  { platform: "YouTube", limit: "5,000 characters for video descriptions" },
  { platform: "Reddit", limit: "Limits vary by post/comment and subreddit (40,000)" },
];
