/**
 * Per-platform inbox capabilities.
 *
 * The inbox only offers actions a network actually supports, so the UI never
 * renders a "Send DM" button on YouTube or a review reply on TikTok.
 */

export type InboxKind = "comment" | "dm";

export interface ChannelCapability {
  /** Public reply to a comment / post. */
  reply: boolean;
  /** Private message thread. */
  dm: boolean;
  /** Hide or delete an inbound comment. */
  moderate: boolean;
  /** Like / heart the inbound message. */
  like: boolean;
  /** Business review responses (Google Business, Facebook recommendations). */
  reviews: boolean;
  /** Max characters allowed in a single reply. */
  replyLimit: number;
}

const DEFAULT: ChannelCapability = {
  reply: true,
  dm: false,
  moderate: false,
  like: false,
  reviews: false,
  replyLimit: 1000,
};

const MAP: Record<string, Partial<ChannelCapability>> = {
  instagram: { dm: true, moderate: true, like: true, replyLimit: 2200 },
  facebook: { dm: true, moderate: true, like: true, reviews: true, replyLimit: 8000 },
  threads: { dm: false, like: true, replyLimit: 500 },
  twitter: { dm: true, like: true, replyLimit: 280 },
  x: { dm: true, like: true, replyLimit: 280 },
  linkedin: { dm: true, like: true, replyLimit: 1250 },
  tiktok: { dm: true, moderate: true, like: true, replyLimit: 150 },
  youtube: { dm: false, moderate: true, like: true, replyLimit: 10000 },
  pinterest: { dm: false, like: true, replyLimit: 500 },
  reddit: { dm: true, replyLimit: 10000 },
  telegram: { dm: true, replyLimit: 4096 },
  whatsapp: { reply: false, dm: true, replyLimit: 4096 },
  snapchat: { dm: true, replyLimit: 1000 },
  "google-business": { reply: true, reviews: true, replyLimit: 4096 },
  googlebusiness: { reply: true, reviews: true, replyLimit: 4096 },
  mastodon: { dm: true, like: true, replyLimit: 500 },
  bluesky: { dm: true, like: true, replyLimit: 300 },
};

export function capabilitiesFor(platform: string): ChannelCapability {
  return { ...DEFAULT, ...(MAP[(platform || "").toLowerCase()] ?? {}) };
}

/** Human label for the channel rail. */
export const KIND_LABEL: Record<InboxKind, string> = {
  comment: "Comments",
  dm: "Direct messages",
};

/** SLA tiers, in minutes, used to colour the age badge. */
export const SLA = { warn: 60, breach: 240 } as const;

export function slaTier(createdAt: string): "ok" | "warn" | "breach" {
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (mins >= SLA.breach) return "breach";
  if (mins >= SLA.warn) return "warn";
  return "ok";
}

export function ageLabel(createdAt: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}
