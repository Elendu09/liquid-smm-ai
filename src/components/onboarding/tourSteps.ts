import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  LayoutDashboard,
  Wand2,
  CalendarClock,
  Bot,
  BarChart3,
  Bell,
  Smartphone,
  LifeBuoy,
} from "lucide-react";

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
  /** Force center-of-screen placement (ignores target rect for tooltip position) */
  centered?: boolean;
  /** Preferred placement of the tooltip relative to the target */
  preferPlacement?: "top" | "bottom" | "left" | "right";
  /** Illustration icon in tooltip header */
  icon?: LucideIcon;
  /** Optional short tip / keyboard hint */
  hint?: string;
}

export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to SMMSAAS",
    body: "A quick tour of where everything lives — you can skip anytime with Esc.",
    target: '[data-tour="brand"]',
    icon: Sparkles,
    hint: "Use ← → arrows to navigate",
  },
  {
    id: "dashboard",
    title: "Your Dashboard",
    body: "Live KPIs, revenue, and account health at a glance.",
    target: '[data-tour="nav-dashboard"]',
    mobileTarget: '[data-tour="mobile-nav-home"]',
    route: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "create",
    title: "Create with AI",
    body: "Generate captions, hashtags, and full posts using SkyRank AI.",
    target: '[data-tour="nav-create"]',
    mobileTarget: '[data-tour="mobile-nav-create"]',
    route: "/dashboard/create",
    icon: Wand2,
  },
  {
    id: "publish",
    title: "Publish & Schedule",
    body: "Queue posts across every connected platform from one place.",
    target: '[data-tour="nav-publish"]',
    mobileTarget: '[data-tour="mobile-nav-publish"]',
    route: "/dashboard/publish",
    icon: CalendarClock,
  },
  {
    id: "engage",
    title: "Engage",
    body: "Reply to comments and DMs, or let the automation bot handle them.",
    target: '[data-tour="nav-engage"]',
    mobileTarget: '[data-tour="mobile-nav-engage"]',
    route: "/dashboard/engage",
    icon: Bot,
  },
  {
    id: "analytics",
    title: "Analytics",
    body: "Track growth, engagement, and campaign ROI in real time.",
    target: '[data-tour="nav-analytics"]',
    mobileTarget: '[data-tour="mobile-nav-analytics"]',
    route: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    id: "notifications",
    title: "Stay in the loop",
    body: "Real-time alerts for milestones, account health, and AI activity.",
    target: '[data-tour="notifications"]',
    icon: Bell,
  },
  {
    id: "mobile-nav",
    title: "Bottom navigation",
    body: "Jump between hubs from this bar. The center button opens Publish.",
    target: '[data-tour="mobile-nav"]',
    mobileOnly: true,
    icon: Smartphone,
    hint: "Swipe left/right on this card to move steps",
  },
  {
    id: "help",
    title: "Help is one tap away",
    body: "Open the Help widget anytime for tour, shortcuts, or to contact us.",
    target: '[data-tour="help-widget"]',
    icon: LifeBuoy,
  },
];
