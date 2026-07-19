/**
 * Lightweight, deterministic sentiment + intent tagging for inbox items.
 * Runs locally so the unified inbox never blocks on a network call. Falls
 * back to `neutral`/`other` when a message is ambiguous.
 */

export type Sentiment = "positive" | "neutral" | "negative";
export type Intent =
  | "question"
  | "compliment"
  | "complaint"
  | "lead"
  | "collab"
  | "support"
  | "spam"
  | "other";

const POSITIVE = /\b(love|great|amazing|awesome|fire|🔥|🙌|❤️|thanks|thank you|helpful|beautiful|nice|dope|legend|best)\b/i;
const NEGATIVE = /\b(hate|terrible|awful|bad|worst|broken|refund|scam|angry|disappointed|😡|👎|useless|slow)\b/i;
const QUESTION = /\?|\b(how|what|where|when|why|can i|could you|do you|is it|are you)\b/i;
const COLLAB = /\b(collab|collaboration|sponsor|partnership|ugc|brand deal|paid promo)\b/i;
const LEAD = /\b(price|pricing|cost|plan|buy|purchase|quote|demo|invoice|book)\b/i;
const SUPPORT = /\b(help|issue|problem|bug|error|not working|fix|support|stuck)\b/i;
const SPAM = /\b(follow back|f4f|check my|dm me now|earn \$|crypto|onlyfans|click link|bit\.ly)\b/i;

export function analyzeMessage(text: string): { sentiment: Sentiment; intent: Intent } {
  const t = text || "";
  let sentiment: Sentiment = "neutral";
  if (POSITIVE.test(t) && !NEGATIVE.test(t)) sentiment = "positive";
  else if (NEGATIVE.test(t)) sentiment = "negative";

  let intent: Intent = "other";
  if (SPAM.test(t)) intent = "spam";
  else if (COLLAB.test(t)) intent = "collab";
  else if (LEAD.test(t)) intent = "lead";
  else if (SUPPORT.test(t)) intent = "support";
  else if (sentiment === "negative") intent = "complaint";
  else if (sentiment === "positive" && !QUESTION.test(t)) intent = "compliment";
  else if (QUESTION.test(t)) intent = "question";

  return { sentiment, intent };
}

const VARIANTS: Record<Intent, (n: string) => string[]> = {
  question: (n) => [
    `Hey ${n}, great question — happy to walk you through it. DM us and we'll get you sorted!`,
    `${n}, love this one. Short answer: yes — long answer in your DMs 👀`,
    `Great ask, ${n}. We just replied with the full breakdown in DM.`,
  ],
  compliment: (n) => [
    `Thank you so much, ${n} 🙌 means the world!`,
    `${n} you're the best 💜 thanks for the love!`,
    `Appreciate you, ${n} — comments like this keep us going 🔥`,
  ],
  complaint: (n) => [
    `So sorry about this, ${n}. Can you DM us the details so we can make it right?`,
    `${n}, that's not the experience we want you to have. DM incoming.`,
    `Totally hear you, ${n} — let's fix this. Sending a DM now.`,
  ],
  lead: (n) => [
    `Hi ${n}, thanks for your interest! Full pricing is on our site — want us to send a quick overview?`,
    `${n}, happy to help — DM us your use case and we'll tailor a plan.`,
    `Great timing, ${n} — booking a quick 15-min call this week?`,
  ],
  collab: (n) => [
    `Hey ${n}, love the idea of teaming up. DM us your deck and we'll take a look!`,
    `${n}, we're open to it — send over the brief and timing.`,
    `Interesting, ${n} 👀 slide into the DMs with details.`,
  ],
  support: (n) => [
    `We're on it, ${n}. Send a screenshot in DM and we'll troubleshoot right away.`,
    `${n}, sorry for the hassle — DM us the error and we'll dig in.`,
    `On it, ${n}. Can you share your account email in DM?`,
  ],
  spam: () => [""],
  other: (n) => [
    `Thanks for reaching out, ${n} — we'll get back to you shortly.`,
    `Appreciate the note, ${n} 🙏`,
    `Hey ${n}, thanks — we'll follow up soon!`,
  ],
};

export function snippetFor(intent: Intent, author: string, variant = 0): string {
  const first = author.split(" ")[0] || "there";
  const opts = VARIANTS[intent](first);
  return opts[variant % opts.length];
}

export const SENTIMENT_STYLE: Record<Sentiment, string> = {
  positive: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  neutral: "bg-muted/60 text-muted-foreground border-border/60",
  negative: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export const INTENT_LABEL: Record<Intent, string> = {
  question: "Question",
  compliment: "Compliment",
  complaint: "Complaint",
  lead: "Lead",
  collab: "Collab",
  support: "Support",
  spam: "Spam",
  other: "General",
};
