/**
 * Plan entitlements — the single source of truth for what each pricing tier
 * unlocks. Mirrors the tiers rendered on /pricing (Free, Starter, Professional,
 * Custom). Values of `null` mean "unlimited / custom".
 */

export type PlanId = "free" | "starter" | "professional" | "custom";

export type FeatureKey =
  | "inbox"
  | "approvals"
  | "automation"
  | "whiteLabel"
  | "api"
  | "competitors"
  | "reportExports"
  | "smartlinks"
  | "customDomain"
  | "sso";

export interface PlanEntitlements {
  id: PlanId;
  name: string;
  /** Marketing one-liner reused by upgrade nudges. */
  blurb: string;
  brands: number | null;
  channels: number | null;
  /** Scheduled posts per month. */
  monthlyPosts: number | null;
  /** Analytics retention window in days. `null` = unlimited history. */
  analyticsRetentionDays: number | null;
  competitorCap: number | null;
  seats: number | null;
  aiCredits: number | null;
  linkBioPages: number | null;
  features: Record<FeatureKey, boolean>;
}

const f = (on: FeatureKey[]): Record<FeatureKey, boolean> => {
  const all: FeatureKey[] = [
    "inbox",
    "approvals",
    "automation",
    "whiteLabel",
    "api",
    "competitors",
    "reportExports",
    "smartlinks",
    "customDomain",
    "sso",
  ];
  return Object.fromEntries(all.map((k) => [k, on.includes(k)])) as Record<FeatureKey, boolean>;
};

export const PLANS: Record<PlanId, PlanEntitlements> = {
  free: {
    id: "free",
    name: "Free",
    blurb: "Everything you need to run one brand, forever free.",
    brands: 1,
    channels: 3,
    monthlyPosts: 20,
    analyticsRetentionDays: 30,
    competitorCap: 5,
    seats: 1,
    aiCredits: 50,
    linkBioPages: 1,
    features: f(["competitors", "api"]),
  },
  starter: {
    id: "starter",
    name: "Starter",
    blurb: "For solo creators running a couple of channels.",
    brands: 2,
    channels: 10,
    monthlyPosts: 500,
    analyticsRetentionDays: null,
    competitorCap: 10,
    seats: 1,
    aiCredits: 200,
    linkBioPages: 3,
    features: f(["competitors", "api", "reportExports", "smartlinks"]),
  },
  professional: {
    id: "professional",
    name: "Professional",
    blurb: "For brands publishing everywhere, every day.",
    brands: 5,
    channels: 15,
    monthlyPosts: null,
    analyticsRetentionDays: null,
    competitorCap: 25,
    seats: 3,
    aiCredits: 2000,
    linkBioPages: 10,
    features: f([
      "competitors",
      "api",
      "reportExports",
      "smartlinks",
      "inbox",
      "approvals",
      "automation",
    ]),
  },
  custom: {
    id: "custom",
    name: "Custom",
    blurb: "For agencies and enterprises managing many clients.",
    brands: null,
    channels: null,
    monthlyPosts: null,
    analyticsRetentionDays: null,
    competitorCap: null,
    seats: null,
    aiCredits: null,
    linkBioPages: null,
    features: f([
      "competitors",
      "api",
      "reportExports",
      "smartlinks",
      "inbox",
      "approvals",
      "automation",
      "whiteLabel",
      "customDomain",
      "sso",
    ]),
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "professional", "custom"];

/** Human label for a limit, e.g. 15 → "15", null → "Unlimited". */
export function limitLabel(v: number | null) {
  return v === null ? "Unlimited" : v.toLocaleString();
}

/** Smallest plan that unlocks a given feature. */
export function firstPlanWith(feature: FeatureKey): PlanEntitlements {
  return PLANS[PLAN_ORDER.find((p) => PLANS[p].features[feature]) ?? "professional"];
}
