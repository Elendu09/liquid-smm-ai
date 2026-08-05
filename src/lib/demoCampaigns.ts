import type { Campaign } from "@/hooks/useCampaigns";

/** Slugify a campaign name for public share links (/c/:slug). */
export function campaignSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const day = 86400000;
const iso = (offset: number) => new Date(Date.now() + offset * day).toISOString().slice(0, 10);
const now = new Date().toISOString();

/**
 * Read-only sample campaigns shown to guests (demo mode) and served by the
 * public share route. Never contains real user data.
 */
export const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: "demo-1",
    name: "Spring product launch",
    objective: "awareness",
    brief: "3-week teaser → launch → social proof push across IG, TikTok and LinkedIn.",
    audience: "Creators & small brands",
    tone: "confident, playful",
    color: "#6366f1",
    status: "active",
    platformIds: ["instagram", "tiktok", "linkedin"],
    startDate: iso(-6),
    endDate: iso(12),
    goalPosts: 18,
    goalReach: 120000,
    goalEngagement: 4200,
    archived: false,
    meta: {},
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "demo-2",
    name: "Always-on education series",
    objective: "engagement",
    brief: "Weekly how-to carousels and short-form tips to keep the feed warm.",
    audience: "SMM managers",
    tone: "helpful, direct",
    color: "#22d3ee",
    status: "draft",
    platformIds: ["instagram", "twitter"],
    startDate: iso(0),
    endDate: null,
    goalPosts: 12,
    goalReach: 45000,
    goalEngagement: 1800,
    archived: false,
    meta: {},
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "demo-3",
    name: "Black Friday countdown",
    objective: "conversions",
    brief: "5-day countdown with daily offers, stories and retargeting hooks.",
    audience: "Existing followers",
    tone: "urgent, upbeat",
    color: "#f472b6",
    status: "completed",
    platformIds: ["facebook", "instagram"],
    startDate: iso(-40),
    endDate: iso(-33),
    goalPosts: 10,
    goalReach: 210000,
    goalEngagement: 9100,
    archived: false,
    meta: {},
    createdAt: now,
    updatedAt: now,
  },
];

export function findDemoCampaign(slug: string) {
  return DEMO_CAMPAIGNS.find((c) => campaignSlug(c.name) === slug || c.id === slug);
}
