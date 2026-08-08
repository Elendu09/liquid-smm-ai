/**
 * Tool catalogue.
 *
 * Single source of truth for the /tools showcase and the
 * /tools/:slug detail pages. Adding a tool here automatically makes
 * it appear in both surfaces and gets a generated screenshot URL.
 */

import {
  Sparkles,
  Calendar,
  Bot,
  BarChart3,
  Hash,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

export type ToolSlug =
  | "caption-generator"
  | "scheduler"
  | "engagement-bot"
  | "analytics"
  | "hashtag-research"
  | "comment-manager";

export interface ToolStep {
  title: string;
  detail: string;
}

export interface ToolDef {
  slug: ToolSlug;
  title: string;
  tagline: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  /** Path inside /dashboard once the user signs in. */
  dashboardHref: string;
  /** Screenshot under /public/tools/. */
  screenshot: string;
  screenshotAlt: string;
  features: { title: string; detail: string; icon?: LucideIcon }[];
  /** Step-by-step "how to use" the tool inside the dashboard. */
  howTo: ToolStep[];
  /** What you get vs. other tools. */
  benefits: string[];
  /** Pre-baked FAQ entries shown at the bottom. */
  faq: { q: string; a: string }[];
  /** Used for the JSON-LD SoftwareApplication schema. */
  category: string;
}

export const tools: ToolDef[] = [
  {
    slug: "caption-generator",
    title: "AI Caption Generator",
    tagline: "Captions that sound like your brand in under 10 seconds.",
    description:
      "Generate on-brand captions for every platform with a single prompt. Bring your own voice, ban the words you never use, and re-roll until it's right.",
    badge: "AI Powered",
    icon: Sparkles,
    dashboardHref: "/dashboard/create/captions",
    screenshot: "/tools/caption-generator.png",
    screenshotAlt: "Mockup of the AI Caption Generator showing a caption draft, tone toggles and platform previews",
    features: [
      { title: "Brand voice presets", detail: "Three to five example captions teach the model your house style. Output that needs edits measured in seconds, not rewrites." },
      { title: "Tone controls", detail: "Friendly, professional, witty, supportive, concise — pick per post or set a default per channel." },
      { title: "Multi-platform variants", detail: "Generate one idea, get a Twitter thread, an Instagram caption, a LinkedIn post and a TikTok hook in one go." },
      { title: "Banned words", detail: "Stop the model using 'revolutionary' or your competitor's name. Less is more." },
    ],
    howTo: [
      { title: "Pick a channel", detail: "Choose the platform you want to draft for. The model adapts the length, hook and CTA to the network." },
      { title: "Set tone and voice", detail: "Pick a tone for this post, or load a brand voice preset you've saved for the team." },
      { title: "Describe the post", detail: "Type a sentence about what the post is. The AI drafts 2-3 variants." },
      { title: "Edit, remix, ship", detail: "Pick a variant, edit, or hit Remix. When you're done, Schedule or Copy." },
    ],
    benefits: [
      "Stops the 'blank doc' moment for the whole team",
      "Output you can ship after a 10-second edit, not a rewrite",
      "Stays in your voice once you save a brand voice preset",
    ],
    faq: [
      { q: "Will the captions sound like ChatGPT?", a: "No. Brand voice presets are the difference — five example captions teach the model your house style." },
      { q: "Does it support every platform?", a: "Yes, including X, Instagram, TikTok, LinkedIn, Facebook, YouTube, Threads, Bluesky and Pinterest." },
      { q: "Can I use my own tone presets?", a: "Yes. Save as many as you want per brand and per channel." },
    ],
    category: "Content creation",
  },
  {
    slug: "scheduler",
    title: "Smart Scheduler",
    tagline: "Plan a week of posts in one sitting. Auto-fill the gaps.",
    description:
      "A weekly calendar with smart slots, bulk CSV import, best-time suggestions, and an auto-fill rule that recycles your evergreen library when a slot is empty.",
    badge: "Time Saver",
    icon: Calendar,
    dashboardHref: "/dashboard/publish/queue",
    screenshot: "/tools/scheduler.png",
    screenshotAlt: "Mockup of the Smart Scheduler showing a weekly calendar with colour-coded platform posts",
    features: [
      { title: "Weekly calendar", detail: "Drag-and-drop, week and month views, colour-coded by channel and approval state." },
      { title: "Best-time suggestions", detail: "Audience-aware slots for every connected account. We learn from your own past engagement, not industry averages." },
      { title: "Bulk CSV import", detail: "Drop a CSV, map columns, and queue 50 posts in 30 seconds. No re-typing." },
      { title: "Auto-fill rule", detail: "If a slot is empty 48 h before publish, pull the next-best evergreen from your library." },
    ],
    howTo: [
      { title: "Connect your accounts", detail: "Link at least one social account. The scheduler needs a destination for every post." },
      { title: "Open the calendar", detail: "Pick a week. Empty slots show the best-time suggestion as a faint guide." },
      { title: "Drop in posts", detail: "Drag from the composer or paste a CSV. Approval state and channel are colour-coded." },
      { title: "Set the auto-fill rule", detail: "Optional but recommended. The rule keeps your calendar healthy when a teammate is off." },
    ],
    benefits: [
      "Stop the Friday-night scramble to ship something",
      "Bulk import 50 posts in 30 seconds from your spreadsheet",
      "Best-time suggestions learn from your own audience, not averages",
    ],
    faq: [
      { q: "How many accounts can I schedule for?", a: "Free plan: 3 channels. Paid plans lift the cap per workspace." },
      { q: "Does it work with TikTok and YouTube Shorts?", a: "Yes, including aspect-ratio validation and cover-frame picker." },
      { q: "What happens if my account disconnects?", a: "Posts in the queue for that account are paused and surfaced in your notifications — never lost." },
    ],
    category: "Publishing",
  },
  {
    slug: "engagement-bot",
    title: "Engagement Bot",
    tagline: "Reply to comments and DMs in seconds, not hours.",
    description:
      "A visual flow editor for inbox automation. Welcome new DMs, fire keyword replies on comments, route angry customers to the right teammate, and never let a spam comment reach your audience.",
    badge: "24/7 Active",
    icon: Bot,
    dashboardHref: "/dashboard/engage/bot",
    screenshot: "/tools/engagement-bot.png",
    screenshotAlt: "Mockup of the Engagement Bot flow editor with a trigger node connected to a reply action",
    features: [
      { title: "Visual flow editor", detail: "Drag-and-drop blocks for every trigger, condition and action. No code, no JSON." },
      { title: "DM welcome & away", detail: "Auto-reply to new DMs with a friendly welcome, an away message overnight, or a menu chatbot." },
      { title: "Comment keyword replies", detail: "When a comment contains 'price' or 'link', fire a saved snippet. Public replies, queued for approval." },
      { title: "Triage rules", detail: "Label, prioritise, assign, hide spam. An angry customer never sits in 'new' for 24 h." },
    ],
    howTo: [
      { title: "Pick a trigger", detail: "New DM, new comment, mention, hashtag, scheduled time, or an external webhook." },
      { title: "Add match conditions", detail: "Platform, sentiment, intent, keywords. Empty rows match everything." },
      { title: "Add actions", detail: "Welcome DM, saved reply, AI draft, label, priority, assign, hide, notify a channel." },
      { title: "Test before enabling", detail: "Dry-run a few real messages, see the path each one takes, then enable the rule." },
    ],
    benefits: [
      "Saves hours every week on the same five replies",
      "Routing rules mean angry customers reach a person, not a bot",
      "Rate limits and quiet hours keep you out of the spam filter",
    ],
    faq: [
      { q: "Will the bot sound like a robot?", a: "Only if you let it. Saved replies and brand voice presets make the AI sound like your team." },
      { q: "What if a rule makes a mistake?", a: "Every action is logged in Activity. One click to pause, edit, or roll back." },
      { q: "Does it work with Instagram comment replies?", a: "Yes — including ad comments and nested replies (comments on comments)." },
    ],
    category: "Engagement",
  },
  {
    slug: "analytics",
    title: "Growth Analytics",
    tagline: "Metrics that match the platforms, with a 'Why?' on every number.",
    description:
      "A dashboard built around the metrics that actually predict growth, with reconciliation badges that compare our number to the platform's and timezone-aware reports.",
    badge: "Real-time",
    icon: BarChart3,
    dashboardHref: "/dashboard/analytics/overview",
    screenshot: "/tools/analytics.png",
    screenshotAlt: "Mockup of the Growth Analytics dashboard showing KPI cards with sparkline charts and a main line chart",
    features: [
      { title: "Predictive metrics", detail: "Saves, view duration, replies, CTR — the metrics that move growth, not the vanity ones." },
      { title: "Reconciliation badges", detail: "Every metric shows a 'Matches platform (±0.3%)' or 'Drift 8%' chip with a Why? popover." },
      { title: "Per-account timezone", detail: "Each connected account has its own reporting timezone. Tokyo sees Tokyo hours, not yours." },
      { title: "Long-form CSV / printable PDF exports", detail: "Stables column shape for Sheets, BigQuery, Notion. PDF renders charts." },
    ],
    howTo: [
      { title: "Connect an account", detail: "We need at least one source. Older accounts get an optional 30-90 d backfill." },
      { title: "Pick the range", detail: "1D, 7D, 30D, 90D, 1Y. The dashboard recomputes on the fly." },
      { title: "Read the reconciliation chips", detail: "Green = matches the platform. Amber = small drift. Red = investigate." },
      { title: "Export the report", detail: "Long-form CSV for data, printable PDF for stakeholders." },
    ],
    benefits: [
      "Never wonder whether your dashboard is lying",
      "Timezone-correct reports for distributed teams",
      "Exports that open in Sheets and BigQuery without a 30-minute cleanup",
    ],
    faq: [
      { q: "How fresh is the data?", a: "Every page is cached for 30 s and refetched in the background. The sync timestamp is on every card." },
      { q: "Can I backfill historical data?", a: "Yes — when you connect an account we offer 30/60/90 d of history. One click." },
      { q: "Do I get raw platform numbers?", a: "We pull the platform's own API and store it. The reconciliation chip compares ours to it." },
    ],
    category: "Analytics",
  },
  {
    slug: "hashtag-research",
    title: "Hashtag Research",
    tagline: "Find the tags that move reach, not the ones that move ego.",
    description:
      "A live hashtag browser with reach data, competition scores and saved lists. Trending, niche, and brand hashtags in one place.",
    badge: "Research",
    icon: Hash,
    dashboardHref: "/dashboard/create/hashtags",
    screenshot: "/tools/hashtag-research.png",
    screenshotAlt: "Mockup of the Hashtag Research tool showing a grid of hashtag chips with reach and competition scores",
    features: [
      { title: "Live reach data", detail: "Estimated impressions per hashtag for your account size, refreshed daily." },
      { title: "Competition score", detail: "How saturated the tag is. Pick low-competition tags to actually get seen." },
      { title: "Saved lists", detail: "Group tags by campaign, brand, or channel. Re-use them across posts." },
      { title: "One-click copy", detail: "Click a chip to copy the tag (with or without the #). Done." },
    ],
    howTo: [
      { title: "Search a topic", detail: "Type a word or phrase. We surface hashtag variants ranked by reach × competition." },
      { title: "Save the winners", detail: "Star a hashtag to add it to a list — 'Brand always', 'Launch campaign', 'Q4 growth'." },
      { title: "Apply to a post", detail: "Click a saved list to drop every tag into the composer at once." },
    ],
    benefits: [
      "Reach × competition, not just 'trending'",
      "Saved lists mean you don't re-search the same tags every post",
      "One-click copy, no hover, no context menu",
    ],
    faq: [
      { q: "How is reach estimated?", a: "We sample the last 30 days of public posts for the tag and the median impressions of similar accounts." },
      { q: "Can I import a list from elsewhere?", a: "Yes — paste a comma-separated list and we'll score each one in seconds." },
      { q: "Does it work for non-English hashtags?", a: "Yes. We normalise Unicode, fold case, and dedupe across scripts." },
    ],
    category: "Research",
  },
  {
    slug: "comment-manager",
    title: "Comment Manager",
    tagline: "Every comment and DM in one board, with AI drafts and saved replies.",
    description:
      "A unified inbox for comments, DMs, mentions, and ad comments. AI drafts, saved replies, bulk actions, and thread grouping — built for community teams.",
    badge: "AI Powered",
    icon: MessageSquare,
    dashboardHref: "/dashboard/engage/inbox",
    screenshot: "/tools/comment-manager.png",
    screenshotAlt: "Mockup of the Comment Manager unified inbox showing comment cards with AI-suggested replies",
    features: [
      { title: "One unified inbox", detail: "Comments, DMs, mentions, ad comments — one board, one keyboard shortcut to reply." },
      { title: "AI draft + saved reply", detail: "Every card shows an AI-suggested reply and the saved replies you've used before. Approve, edit, or pick." },
      { title: "Threaded view", detail: "Comments on comments no longer get buried. Toggle flat ↔ threaded." },
      { title: "Bulk actions", detail: "Mark 50 messages handled, hide the spam, assign a teammate — one click." },
    ],
    howTo: [
      { title: "Connect your channels", detail: "Inbox pulls from every connected account. Ad comments show with a violet 'Ad' badge." },
      { title: "Pick a filter", detail: "Sentiment, intent, ad-only, threaded view. The toolbar mirrors the filters you set up." },
      { title: "Reply in one click", detail: "Approve an AI draft, pick a saved reply, or type your own. Approve → reply → move to 'replied'." },
    ],
    benefits: [
      "Stop losing the comment on the comment",
      "AI drafts cut reply time by ~60%",
      "Bulk actions make spam cleanup a 10-second job",
    ],
    faq: [
      { q: "Does it handle Instagram ad comments?", a: "Yes — they show with a violet 'Ad' badge and an 'Ad comments' filter chip." },
      { q: "Can I assign threads to teammates?", a: "Yes. Each card has an 'Assign' dropdown and a private-notes drawer for context." },
      { q: "Will my saved replies sound canned?", a: "Use {{author}} and {{platform}} placeholders. Rename 'support' to 'support team'. They read like you." },
    ],
    category: "Engagement",
  },
];

export const toolBySlug: Record<string, ToolDef> = (() => {
  const map: Record<string, ToolDef> = {};
  for (const t of tools) {
    if (map[t.slug]) throw new Error(`Duplicate tool slug: ${t.slug}`);
    map[t.slug] = t;
  }
  return map;
})();
