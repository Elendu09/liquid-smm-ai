/**
 * Blog post library.
 *
 * Each post is fully self-contained: hero image (an Unsplash URL or
 * local asset under /public/blog/), an excerpt, an author byline, a
 * category, tags, the full body (typed sections for fast rendering),
 * a reading time in minutes, and a publish date.
 *
 * The body is stored as a list of typed sections so the renderer can
 * pick the right typography, generate a table of contents, and inject
 * anchor links. Storing content in code (rather than markdown) keeps
 * the bundle small and lets us guarantee a11y/semantic correctness.
 */

export type BlogSection =
  | { type: "p"; text: string }
  | { type: "h2"; text: string; id?: string }
  | { type: "h3"; text: string; id?: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "code"; language?: string; code: string }
  | { type: "callout"; tone: "info" | "warn" | "success"; title: string; text: string };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: "Playbooks" | "AI" | "Analytics" | "Teams" | "Engagement" | "Growth" | "Product";
  tags: string[];
  date: string; // ISO date
  readMinutes: number;
  author: { name: string; role: string; initials: string; avatar?: string };
  hero: { src: string; alt: string; credit?: string };
  body: BlogSection[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "publishing-rhythm-your-team-can-keep",
    title: "How to build a publishing rhythm your team can actually keep",
    excerpt:
      "A practical framework for turning scattered ideas into a weekly calendar that survives busy weeks — and the automations that keep it running.",
    category: "Playbooks",
    tags: ["scheduling", "workflow", "team"],
    date: "2026-07-08",
    readMinutes: 7,
    author: { name: "Maya Lin", role: "Head of Product", initials: "ML" },
    hero: {
      src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1600&q=80",
      alt: "Open laptop on a wooden desk with a printed weekly calendar and coffee cup",
      credit: "Photo by Cathryn Lavery on Unsplash",
    },
    body: [
      { type: "p", text: "Most teams don't have a publishing problem; they have a rhythm problem. Ideas arrive, drafts half-finish, a Friday scramble ships something nobody reviewed, and the next week starts from zero again. The fix is a rhythm small enough to be realistic and durable enough to be useful." },
      { type: "h2", text: "Start with the cadence, not the calendar", id: "cadence" },
      { type: "p", text: "Pick a weekly cadence that fits your team's headroom, not your ambition. Two posts on Tuesday and Thursday beats five posts nobody wants to write. The number is less important than the predictability — once your audience expects posts at certain days, the team has a target to plan around." },
      { type: "h2", text: "The four slots in every week", id: "slots" },
      { type: "ul", items: [
        "Idea — what we noticed in the data or in our audience's questions this week",
        "Draft — who owns the first sentence, who signs off, and what 'done' looks like",
        "Schedule — when it goes out, which channels, and the first comment",
        "Measure — the one metric we watch for 48 hours after publish",
      ] },
      { type: "h2", text: "Automations that survive busy weeks", id: "automations" },
      { type: "p", text: "A rhythm breaks the first time someone goes on holiday. The fix isn't heroics — it's defaults. Set a default caption template per platform, a default first comment, and a default approval policy so the queue keeps moving even when the writer is offline." },
      { type: "callout", tone: "info", title: "Try this today", text: "Open your calendar and mark the next 12 weeks with one slot per post. If a slot doesn't have a draft 48 hours before publish, it auto-fills with a recycled evergreen from your library." },
      { type: "h2", text: "What to do when the rhythm slips", id: "slip" },
      { type: "p", text: "Slippage is normal. The recovery is small: pick the next slot, move the missed post into it, and keep going. Skipping a week to 'reset' usually loses the team a quarter of their cadence." },
    ],
  },
  {
    slug: "ai-captions-that-sound-like-you",
    title: "AI captions that sound like you, not like a robot",
    excerpt:
      "Brand voice presets, tone controls and remix settings: how to get drafts that need edits measured in seconds, not rewrites.",
    category: "AI",
    tags: ["ai", "captions", "brand-voice"],
    date: "2026-06-22",
    readMinutes: 5,
    author: { name: "Jules Park", role: "AI Engineering Lead", initials: "JP" },
    hero: {
      src: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80",
      alt: "Neon sign reading 'AI' in a dark studio with laptop on the table",
      credit: "Photo by Levart Photographer on Unsplash",
    },
    body: [
      { type: "p", text: "Captions are the highest-leverage word choice in your marketing. The hook decides whether anyone scrolls, the voice decides whether they keep reading. AI is great at the hook, terrible at the voice unless you teach it." },
      { type: "h2", text: "Why defaults fail", id: "why-defaults" },
      { type: "p", text: "Default captions read like a template. The model doesn't know that your brand uses 'ship' instead of 'launch', or that you say 'founder' not 'entrepreneur'. The output is technically fine, emotionally flat." },
      { type: "h2", text: "Three controls that matter", id: "controls" },
      { type: "ol", items: [
        "Brand voice — three to five example captions, even a single paragraph of how your team writes. The model generalises the patterns.",
        "Tone per post — 'supportive' for customer stories, 'witty' for product launches, 'concise' for news. The right tone cuts your edit time in half.",
        "Banned words — words the team will never use, names of competitors, industry jargon. Less is more.",
      ] },
      { type: "h2", text: "The 10-second edit rule", id: "edit-rule" },
      { type: "p", text: "A good draft is one you can ship after a 10-second edit. If the AI gives you a paragraph you have to rewrite, your voice preset is wrong, not the model. Update the preset and re-roll." },
      { type: "quote", text: "The model isn't trying to be you. It's trying to be a useful first draft. Treat it like an intern — give it a brief, give it examples, give it feedback." },
      { type: "h2", text: "Reading the output critically", id: "read" },
      { type: "p", text: "Check the first sentence. If it doesn't earn the second, the AI wrote a thesis statement instead of a hook. Ask for a punchy opener, or write your own first sentence and have the AI continue from it." },
    ],
  },
  {
    slug: "reading-analytics-without-drowning",
    title: "Reading your analytics without drowning in dashboards",
    excerpt:
      "Which metrics actually predict growth per platform, and how to build a weekly report your stakeholders will read.",
    category: "Analytics",
    tags: ["analytics", "reporting", "growth"],
    date: "2026-06-12",
    readMinutes: 6,
    author: { name: "Renata Cole", role: "Data Lead", initials: "RC" },
    hero: {
      src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
      alt: "A laptop screen showing colourful analytics charts on a desk with a notebook",
      credit: "Photo by Lukas Blazek on Unsplash",
    },
    body: [
      { type: "p", text: "The first thing every team installs is a dashboard. The first thing every team abandons is a dashboard. The fix is to pick the one metric that changes a decision and stop collecting the rest." },
      { type: "h2", text: "The single number test", id: "single" },
      { type: "p", text: "For every metric you track, ask: 'If this number moves by 10% next week, what changes?' If you can't answer, the metric is decoration. If you can, the metric is a signal." },
      { type: "h2", text: "What actually predicts growth", id: "predicts" },
      { type: "ul", items: [
        "Instagram: saves per post and DMs received in 24 h",
        "TikTok: average view duration, not views",
        "LinkedIn: comments on the first hour, not total likes",
        "X: replies and bookmarks, not retweets",
        "YouTube: click-through rate on the thumbnail",
      ] },
      { type: "callout", tone: "warn", title: "Vanity warning", text: "Followers gained and total reach are lagging indicators. They tell you what worked a month ago. To act this week, watch the early engagement signals above." },
      { type: "h2", text: "A weekly report people will read", id: "weekly" },
      { type: "p", text: "Keep it to one page. Lead with the decision you need to make, then the data that informs it. Charts at the bottom for reference, never as the headline." },
    ],
  },
  {
    slug: "approvals-without-the-bottleneck",
    title: "Approvals without the bottleneck",
    excerpt:
      "Roles, review states and comment threads — setting up a workflow where nothing ships unreviewed and nothing sits waiting.",
    category: "Teams",
    tags: ["approvals", "workflow", "team"],
    date: "2026-05-30",
    readMinutes: 4,
    author: { name: "Ben Okafor", role: "Head of Customer Success", initials: "BO" },
    hero: {
      src: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80",
      alt: "Team of three people reviewing printed slides on a glass conference table",
      credit: "Photo by Jason Goodman on Unsplash",
    },
    body: [
      { type: "p", text: "The default 'needs approval' toggle creates two failure modes: nothing gets reviewed, or everything waits on one person. The fix is a chain of small checks instead of a single big one." },
      { type: "h2", text: "Three stages beats one gate", id: "stages" },
      { type: "p", text: "Instead of a single 'manager approves' step, build a chain: draft → reviewer notes → final sign-off. Each stage has a clear owner, a clear timeout, and a clear next step. Bottlenecks show up as timeouts, not as quiet delays." },
      { type: "h2", text: "Time-box every stage", id: "timebox" },
      { type: "p", text: "An approval without a deadline isn't a workflow, it's a queue. Set a 24-hour timeout for the first review and a 48-hour timeout for the final sign-off. When the timer hits, the post bounces back with a notification, not a silent wait." },
      { type: "h2", text: "External approvers without accounts", id: "external" },
      { type: "p", text: "Clients shouldn't need a login to approve a draft. A magic link — open, see the post, approve or request changes — turns a half-day of back-and-forth into a five-second click. The audit trail still lives in your dashboard." },
      { type: "callout", tone: "success", title: "Heads up", text: "External magic-link approvals work best with a 48-72 hour expiry. After that, the link shows 'this expired' and the team re-sends on demand." },
    ],
  },
  {
    slug: "unified-inbox-into-conversations",
    title: "The unified inbox: turning comments and DMs into conversations",
    excerpt:
      "Triage rules, saved replies and automation limits that keep engagement fast without sounding automated.",
    category: "Engagement",
    tags: ["inbox", "automation", "engagement"],
    date: "2026-05-15",
    readMinutes: 5,
    author: { name: "Priya Anand", role: "Community Lead", initials: "PA" },
    hero: {
      src: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1600&q=80",
      alt: "Modern open office with two teammates collaborating over a shared laptop screen",
      credit: "Photo by Jason Goodman on Unsplash",
    },
    body: [
      { type: "p", text: "The fastest way to lose an audience is to answer a DM three days late. The fastest way to lose trust is to answer it instantly with something that reads like a template." },
      { type: "h2", text: "Default to the safe path", id: "default" },
      { type: "p", text: "Auto-reply only to the messages that don't need a human. Welcome messages, away messages, menu chatbots — these save time without sounding canned. Real questions, complaints and anything ambiguous: route to a person." },
      { type: "h2", text: "Triage in three states", id: "triage" },
      { type: "ul", items: [
        "New — needs a person",
        "Replied — handled, leave it for context",
        "Snoozed — needs a person later (24 h, 72 h, next week)",
      ] },
      { type: "h2", text: "Saved replies that don't sound canned", id: "replies" },
      { type: "p", text: "Keep a library of eight to twelve snippets, not fifty. Use variables ({{author}}, {{handle}}, {{platform}}) so each reply names the person. Rename 'support' to 'support team' and 'DM us' to 'drop us a DM' — small choices, big personality." },
      { type: "h2", text: "Rate limits are a feature", id: "limits" },
      { type: "p", text: "A 12-second minimum delay and a 40-replies-per-hour cap keeps you under the platforms' safety budgets and out of the spam filter. The user never sees the cap; they just don't get auto-replied to at 3am." },
    ],
  },
  {
    slug: "link-in-bio-as-landing-page",
    title: "Link in bio as a real landing page",
    excerpt:
      "Themes, blocks and tracking — how to make the single most-clicked link in your profile do more work.",
    category: "Growth",
    tags: ["link-in-bio", "landing", "growth"],
    date: "2026-04-28",
    readMinutes: 4,
    author: { name: "Tomás Vega", role: "Growth Lead", initials: "TV" },
    hero: {
      src: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1600&q=80",
      alt: "Smartphone resting on a notebook with a hand drawing a wireframe next to it",
      credit: "Photo by Daria Volkova on Unsplash",
    },
    body: [
      { type: "p", text: "The link in your bio is the most-clicked URL on your entire profile. Treat it like a landing page, not a parking lot." },
      { type: "h2", text: "The five-block rule", id: "blocks" },
      { type: "p", text: "Most profiles only need five blocks: a current offer, a best-of post, a lead magnet, a contact link, and a 'latest from the blog'. Everything else is noise that pushes the action button below the fold." },
      { type: "h2", text: "Track every block", id: "track" },
      { type: "p", text: "Each block has a UTM. Every week, look at which block gets the most clicks. Drop the bottom three, double down on the top one, and re-order the page so the highest-converting block is first." },
      { type: "h2", text: "Theme > template", id: "theme" },
      { type: "p", text: "Pick a theme that matches your brand and stop changing it. The link in bio is not a place to A/B test the colour of your CTA. Consistency is the feature." },
    ],
  },
  {
    slug: "publishing-correctness-2026",
    title: "What we fixed this quarter: 9 publishing & analytics headaches",
    excerpt:
      "We went through 30+ user pain points from Hootsuite, Sprout and Buffer, and shipped fixes for nine of the most-asked-for ones. Here's what changed.",
    category: "Product",
    tags: ["changelog", "publishing", "analytics"],
    date: "2026-08-02",
    readMinutes: 6,
    author: { name: "Maya Lin", role: "Head of Product", initials: "ML" },
    hero: {
      src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80",
      alt: "A whiteboard covered in sticky notes during a product planning session",
      credit: "Photo by Kaleidico on Unsplash",
    },
    body: [
      { type: "p", text: "We spent the quarter studying the pain points people have with Hootsuite, Sprout and Buffer, then shipping the fixes that would do the most to keep our users from hitting the same walls. Here is the long-form version of what changed." },
      { type: "h2", text: "Auto-adapt media per platform", id: "auto-adapt" },
      { type: "p", text: "Reels want 9:16, Feed wants 1:1 or 4:5, YouTube Shorts want 9:16 — and the tool that ships to all of them usually picks one and ignores the rest. The composer now pre-validates every upload against every selected destination and shows a banner with the fix. Turn on Auto-adapt and we crop & re-encode on publish." },
      { type: "h2", text: "Platform-aware char counter", id: "char" },
      { type: "p", text: "X counts every URL as 23 characters. LinkedIn counts them as 30. Most tools use raw length and then truncate your tweet for you. Ours uses the right math for every platform, with a chip that says '1 URL · 2 #tags · 5 emoji' so you know what counts." },
      { type: "h2", text: "Reconciliation badge on every metric", id: "reconciliation" },
      { type: "p", text: "When our number and the platform's number disagree, the metric used to silently pick one. Now it shows a chip — 'Matches platform (±0.3%)' or 'Drift 8%' — with a Why? popover explaining the cause. No more wondering if your dashboard is lying." },
      { type: "h2", text: "Long-form CSV exports", id: "csv" },
      { type: "p", text: "Our CSV now uses one column per dimension (date, platform, metric, value) and the same column ordering as the dashboard. Drop it into Sheets, BigQuery, or Notion without cleaning. PDFs open the print dialog so charts and tables render the way you'd hand them to a client." },
      { type: "h2", text: "Per-account timezone", id: "tz" },
      { type: "p", text: "The default was 'the server's clock'. Now each account has its own reporting timezone, and every chart and report labels its axis with it. The audience in Tokyo sees their data in their hours, not yours." },
      { type: "callout", tone: "info", title: "What we'd love to hear", text: "Found a pain point we haven't covered? Reply to the changelog email or open the support widget. The next batch of fixes comes from the same list." },
    ],
  },
  {
    slug: "why-we-built-a-real-flow-editor",
    title: "Why we built a real visual flow editor instead of a textarea",
    excerpt:
      "The trade-off behind dragging nodes on a canvas, the rules we kept losing to plain English, and why power users kept asking for it anyway.",
    category: "Product",
    tags: ["automation", "ux", "editor"],
    date: "2026-08-12",
    readMinutes: 5,
    author: { name: "Diego Salas", role: "Design Lead", initials: "DS" },
    hero: {
      src: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80",
      alt: "Hands drawing on a whiteboard with arrows and shapes representing a workflow",
      credit: "Photo by Kelly Sikkema on Unsplash",
    },
    body: [
      { type: "p", text: "Every automation tool eventually has the same conversation: should the rule be a form, a sentence, or a canvas? Forms are the safe default. Sentences feel friendly. The canvas is the thing that nobody uses until they do." },
      { type: "h2", text: "Why forms lose", id: "forms" },
      { type: "p", text: "A form is a series of decisions. 'When X happens, do Y. Optionally do Z.' The 'optionally' is where it dies — the user can't see the path they aren't taking, so they forget to set up the second step and the rule fires half-complete." },
      { type: "h2", text: "Why sentences win for trivial rules", id: "sentences" },
      { type: "p", text: "For one-step automations, a sentence is faster than dragging a node. 'When someone comments price, send the saved pricing reply' is one line, no library to navigate. We keep the sentence view for the easy cases." },
      { type: "h2", text: "Why the canvas wins for chains", id: "canvas" },
      { type: "p", text: "Once the rule has two or more steps, a branch, or a guardrail, the canvas makes the path visible. You can see what's missing. You can see what runs in parallel. You can move a step without losing the connection. That's why we shipped it for bot rules and inbox rules — both have at least three steps in the realistic case." },
      { type: "callout", tone: "info", title: "Design principle", text: "Every automation has a one-line summary at the bottom of the canvas: 'When this happens, do this.' If you can't read your rule in one sentence, the canvas still needs work." },
      { type: "h2", text: "What we kept from the form", id: "kept" },
      { type: "p", text: "The classic form is still there, one tab away. Power users get the canvas. New users get the form. The form is the on-ramp; the canvas is the destination." },
    ],
  },
];

/** Slug → post lookup. Throws if a slug collides; keeps routing honest. */
export const blogBySlug: Record<string, BlogPost> = (() => {
  const map: Record<string, BlogPost> = {};
  for (const post of blogPosts) {
    if (map[post.slug]) throw new Error(`Duplicate blog slug: ${post.slug}`);
    map[post.slug] = post;
  }
  return map;
})();

/** All unique tags across the library. */
export const blogTags: string[] = Array.from(new Set(blogPosts.flatMap((p) => p.tags))).sort();

/** Posts related to a given post (shares at least one tag). */
export function relatedPosts(slug: string, limit = 3): BlogPost[] {
  const me = blogBySlug[slug];
  if (!me) return [];
  return blogPosts
    .filter((p) => p.slug !== slug)
    .map((p) => ({ p, score: p.tags.filter((t) => me.tags.includes(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.date < b.p.date ? -1 : 1)
    .slice(0, limit)
    .map((x) => x.p);
}

/** A11y helper: produce a heading-id from a section title. */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
