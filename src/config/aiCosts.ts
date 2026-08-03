/**
 * Client mirror of the server-side RATE_CARD in
 * `supabase/functions/_shared/credits.ts`.
 *
 * Used only for UI transparency (showing what an action will cost before the
 * user runs it). The server is the source of truth — it debits via the
 * `spend_credits` RPC and returns the real `spent` / `remaining` values.
 */
export const AI_COSTS = {
  "command.text": 1,
  "command.vision": 2,
  "command.voice": 1,
  "create.captions": 2,
  "create.hashtags": 1,
  "create.translate": 1,
  "create.brief": 3,
  "create.reply": 1,
  "engage.reply": 1,
  "home.summary": 1,
  "notif.summary": 1,
  "voice.speak": 1,
  "voice.transcribe": 1,
  "campaign.plan": 5,
  "memory.summarize": 0,
} as const;

export type AiFeatureKey = keyof typeof AI_COSTS;

export const AI_FEATURE_LABELS: Record<AiFeatureKey, string> = {
  "command.text": "AI command",
  "command.vision": "AI command with images",
  "command.voice": "Voice command",
  "create.captions": "Caption generation",
  "create.hashtags": "Hashtag research",
  "create.translate": "Caption translation",
  "create.brief": "Full post brief",
  "create.reply": "Reply suggestions",
  "engage.reply": "Inbox reply",
  "home.summary": "Home summary",
  "notif.summary": "Notification digest",
  "voice.speak": "Text to speech",
  "voice.transcribe": "Speech to text",
  "campaign.plan": "Campaign plan",
  "memory.summarize": "Memory upkeep",
};

export const aiCost = (feature: AiFeatureKey) => AI_COSTS[feature] ?? 1;

/** "2 credits" / "1 credit" / "Free" */
export function formatCost(feature: AiFeatureKey) {
  const n = aiCost(feature);
  if (n === 0) return "Free";
  return `${n} credit${n === 1 ? "" : "s"}`;
}
