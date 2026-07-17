export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** CSS selector for desktop target */
  target: string;
  /** Optional selector for mobile/tablet */
  mobileTarget?: string;
  /** Navigate to route before highlighting */
  route?: string;
  desktopOnly?: boolean;
  mobileOnly?: boolean;
}

export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to SMMSAAS",
    body: "This quick tour shows you where everything lives. You can skip anytime.",
    target: '[data-tour="brand"]',
  },
  {
    id: "dashboard",
    title: "Your Dashboard",
    body: "Live KPIs, revenue, and account health at a glance.",
    target: '[data-tour="nav-dashboard"]',
    mobileTarget: '[data-tour="mobile-nav-home"]',
    route: "/dashboard",
  },
  {
    id: "create",
    title: "Create with AI",
    body: "Generate captions, hashtags, and full posts using SkyRank AI.",
    target: '[data-tour="nav-create"]',
    mobileTarget: '[data-tour="mobile-nav-create"]',
    route: "/dashboard/create",
  },
  {
    id: "publish",
    title: "Publish & Schedule",
    body: "Queue posts across all your connected platforms from one place.",
    target: '[data-tour="nav-publish"]',
    mobileTarget: '[data-tour="mobile-nav-publish"]',
    route: "/dashboard/publish",
  },
  {
    id: "engage",
    title: "Engage",
    body: "Reply to comments and DMs, or let the automation bot handle them.",
    target: '[data-tour="nav-engage"]',
    mobileTarget: '[data-tour="mobile-nav-engage"]',
    route: "/dashboard/engage",
  },
  {
    id: "analytics",
    title: "Analytics",
    body: "Track growth, engagement, and campaign ROI in real time.",
    target: '[data-tour="nav-analytics"]',
    mobileTarget: '[data-tour="mobile-nav-analytics"]',
    route: "/dashboard/analytics",
  },
  {
    id: "notifications",
    title: "Stay in the loop",
    body: "Real-time alerts for milestones, account health, and AI activity.",
    target: '[data-tour="notifications"]',
  },
  {
    id: "mobile-nav",
    title: "Bottom navigation",
    body: "On mobile, jump between hubs from this bar. The center button opens Publish.",
    target: '[data-tour="mobile-nav"]',
    mobileOnly: true,
  },
  {
    id: "support",
    title: "Need help?",
    body: "Open Support anytime for FAQs, contact, or to re-run this tour.",
    target: '[data-tour="support"]',
  },
];
