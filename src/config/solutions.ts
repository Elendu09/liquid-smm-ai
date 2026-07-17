import type { LucideIcon } from "lucide-react";
import {
  Share2,
  Lightbulb,
  MessageSquareReply,
  Activity,
  ImagePlus,
  Video,
  TrendingUp,
  ShoppingBag,
  CalendarDays,
  Users,
  Radio,
} from "lucide-react";

export interface Solution {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  applications: number;
  templates: number;
  blogPosts: number;
  ctaHref: string;
  ctaLabel: string;
  presetId?: string;
}

export const solutions: Solution[] = [
  {
    id: "autopilot-sharing",
    title: "Autopilot web-to-social sharing",
    description:
      "Share web content to social media on autopilot with an AI curator that respects your brand voice.",
    icon: Share2,
    applications: 6,
    templates: 3,
    blogPosts: 1,
    ctaHref: "/dashboard/publish/queue?preset=autopilot-sharing",
    ctaLabel: "Set up autopilot",
  },
  {
    id: "ai-idea-research",
    title: "AI content idea research",
    description:
      "Research high-quality social media content ideas with AI trained on trending topics and audience signals.",
    icon: Lightbulb,
    applications: 4,
    templates: 4,
    blogPosts: 5,
    ctaHref: "/dashboard/create/ai?preset=idea-research",
    ctaLabel: "Generate ideas",
  },
  {
    id: "automated-comment-responses",
    title: "Automated comment responses",
    description:
      "Improve customer satisfaction with automated, on-brand replies to comments across every channel.",
    icon: MessageSquareReply,
    applications: 9,
    templates: 4,
    blogPosts: 3,
    ctaHref: "/dashboard/engage/comments?preset=auto-reply",
    ctaLabel: "Automate replies",
  },
  {
    id: "brand-sentiment",
    title: "Brand sentiment monitoring",
    description:
      "Increase brand loyalty by monitoring sentiment across every mention and reacting before it snowballs.",
    icon: Activity,
    applications: 5,
    templates: 1,
    blogPosts: 2,
    ctaHref: "/dashboard/audience/competitors?preset=sentiment",
    ctaLabel: "Monitor sentiment",
  },
  {
    id: "custom-social-images",
    title: "Custom social image generation",
    description:
      "Increase brand awareness with on-brand, AI-generated social images produced in seconds.",
    icon: ImagePlus,
    applications: 6,
    templates: 4,
    blogPosts: 1,
    ctaHref: "/dashboard/create/ai?preset=social-images",
    ctaLabel: "Generate images",
  },
  {
    id: "seo-video-descriptions",
    title: "SEO video descriptions",
    description:
      "Drive more traffic to your videos with SEO-friendly, platform-tuned descriptions and hashtags.",
    icon: Video,
    applications: 6,
    templates: 3,
    blogPosts: 1,
    ctaHref: "/dashboard/create/captions?preset=video-seo",
    ctaLabel: "Write descriptions",
  },
  {
    id: "engagement-optimized-posts",
    title: "Engagement-optimized posts",
    description:
      "Improve engagement with content optimized for each platform's ranking signals and audience behavior.",
    icon: TrendingUp,
    applications: 6,
    templates: 6,
    blogPosts: 8,
    ctaHref: "/dashboard/engage/bot?preset=engagement",
    ctaLabel: "Optimize engagement",
  },
  {
    id: "product-releases",
    title: "Product release campaigns",
    description:
      "Drive sales with structured social media product releases — teasers, drops, and follow-ups baked in.",
    icon: ShoppingBag,
    applications: 6,
    templates: 5,
    blogPosts: 5,
    ctaHref: "/dashboard/publish/calendar?preset=product-release",
    ctaLabel: "Launch a release",
  },
  {
    id: "content-calendar",
    title: "Content calendar for growth",
    description:
      "Grow your audience with a content calendar that plans, batches, and balances every social channel.",
    icon: CalendarDays,
    applications: 5,
    templates: 5,
    blogPosts: 2,
    ctaHref: "/dashboard/publish/calendar",
    ctaLabel: "Open the calendar",
  },
  {
    id: "community-engagement",
    title: "Community engagement sharing",
    description:
      "Promote community engagement through shared, remixable social media content and DM flows.",
    icon: Users,
    applications: 8,
    templates: 7,
    blogPosts: 2,
    ctaHref: "/dashboard/engage/dms?preset=community",
    ctaLabel: "Grow community",
  },
  {
    id: "multi-channel-distribution",
    title: "Multi-channel content distribution",
    description:
      "Expand reach by distributing every piece of content across the platforms that matter — in one click.",
    icon: Radio,
    applications: 7,
    templates: 7,
    blogPosts: 6,
    ctaHref: "/dashboard/publish/queue?preset=multi-channel",
    ctaLabel: "Distribute content",
  },
];
