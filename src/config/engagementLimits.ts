/**
 * Per-platform engagement safety limits used by the automation bot.
 * Values are conservative "safe zone" ceilings modelled on each network's
 * documented/observed automation thresholds — the bot never exceeds them
 * even if the user drags the daily slider higher.
 */

export interface PlatformEngagementLimits {
  /** Max comment/reply length the network accepts. */
  commentMax: number;
  /** Safe daily ceilings per action type. 0 = action unsupported. */
  daily: { like: number; comment: number; follow: number; dm: number };
  /** Minimum seconds between two automated actions on this network. */
  minDelaySec: number;
  /** Short human note shown in the UI. */
  note: string;
}

export const engagementLimits: Record<string, PlatformEngagementLimits> = {
  instagram: { commentMax: 2200, daily: { like: 300, comment: 60, follow: 100, dm: 40 }, minDelaySec: 36, note: "Aggressive rate limiting — keep comments personal." },
  facebook:  { commentMax: 8000, daily: { like: 300, comment: 80, follow: 60,  dm: 40 }, minDelaySec: 30, note: "Pages are throttled harder than profiles." },
  tiktok:    { commentMax: 150,  daily: { like: 400, comment: 80, follow: 150, dm: 30 }, minDelaySec: 24, note: "Very short comments perform best." },
  twitter:   { commentMax: 280,  daily: { like: 500, comment: 100, follow: 200, dm: 100 }, minDelaySec: 18, note: "Replies count toward the tweet cap." },
  threads:   { commentMax: 500,  daily: { like: 300, comment: 60, follow: 100, dm: 0 },   minDelaySec: 30, note: "No DM API — replies only." },
  linkedin:  { commentMax: 1250, daily: { like: 150, comment: 40, follow: 80,  dm: 25 },  minDelaySec: 60, note: "Lowest tolerance for automation — stay insightful." },
  youtube:   { commentMax: 10000, daily: { like: 200, comment: 50, follow: 50, dm: 0 },   minDelaySec: 45, note: "Comments are moderated by the channel owner." },
  pinterest: { commentMax: 500,  daily: { like: 200, comment: 40, follow: 100, dm: 20 },  minDelaySec: 40, note: "Saves matter more than comments." },
  reddit:    { commentMax: 10000, daily: { like: 200, comment: 30, follow: 0,  dm: 20 },  minDelaySec: 90, note: "Subreddit rules override everything — never sound promotional." },
  bluesky:   { commentMax: 300,  daily: { like: 400, comment: 80, follow: 150, dm: 30 },  minDelaySec: 20, note: "Community-first tone." },
  telegram:  { commentMax: 4096, daily: { like: 200, comment: 60, follow: 0,   dm: 80 },  minDelaySec: 20, note: "Channel comments depend on group settings." },
  discord:   { commentMax: 2000, daily: { like: 300, comment: 100, follow: 0,  dm: 50 },  minDelaySec: 15, note: "Respect per-server slow mode." },
  whatsapp:  { commentMax: 4096, daily: { like: 0,   comment: 0,  follow: 0,   dm: 60 },  minDelaySec: 30, note: "DM-only channel." },
  snapchat:  { commentMax: 250,  daily: { like: 0,   comment: 0,  follow: 60,  dm: 40 },  minDelaySec: 40, note: "Stories and DMs only." },
};

export const DEFAULT_LIMITS: PlatformEngagementLimits = {
  commentMax: 500,
  daily: { like: 200, comment: 40, follow: 60, dm: 20 },
  minDelaySec: 45,
  note: "Conservative defaults.",
};

export function limitsFor(platformId: string): PlatformEngagementLimits {
  return engagementLimits[platformId?.toLowerCase()] ?? DEFAULT_LIMITS;
}

export type EngageAction = "like" | "comment" | "follow" | "dm";

export const ACTION_LABEL: Record<EngageAction, string> = {
  like: "Like posts",
  comment: "Comment on posts",
  follow: "Follow accounts",
  dm: "Send DMs",
};

/** True when the network supports the action at all. */
export function supportsAction(platformId: string, action: EngageAction): boolean {
  return limitsFor(platformId).daily[action] > 0;
}

/** Clamp a requested daily budget to the platform's safe ceiling. */
export function clampDaily(platformId: string, action: EngageAction, requested: number): number {
  const cap = limitsFor(platformId).daily[action];
  return Math.max(0, Math.min(Math.round(requested), cap));
}
