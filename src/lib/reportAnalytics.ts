import type { ConnectedAccount } from "@/contexts/AccountContext";

export interface ReportMetric {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}

export interface ReportSectionData {
  section: string;
  summary: string;
  metrics: ReportMetric[];
  series?: { label: string; value: number }[];
}

export interface ReportData {
  generatedAt: string;
  period: string;
  totalFollowers: number;
  totalEngagement: number;
  totalReach: number;
  platformBreakdown: { platform: string; followers: number; share: number }[];
  sections: ReportSectionData[];
}

const rangeMultiplier = (range: string) => {
  switch (range) {
    case "last7":
      return { days: 7, growthPct: 3.2 };
    case "last30":
      return { days: 30, growthPct: 12.8 };
    case "last90":
      return { days: 90, growthPct: 34.5 };
    default:
      return { days: 30, growthPct: 12.8 };
  }
};

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

const pct = (n: number) => `${n.toFixed(1)}%`;

export function buildReportData(
  accounts: ConnectedAccount[],
  sections: string[],
  range: string,
): ReportData {
  const { days, growthPct } = rangeMultiplier(range);
  const active = accounts.filter((a) => a.isActive);
  const pool = active.length ? active : accounts;

  const totalFollowers = pool.reduce((s, a) => s + a.followers, 0) || 31200;
  const totalPosts = pool.reduce((s, a) => s + a.posts, 0) || 120;
  const avgEngagement =
    pool.length > 0
      ? pool.reduce((s, a) => s + a.engagement, 0) / pool.length
      : 5.4;
  const totalReach = Math.round(totalFollowers * (days / 7) * (avgEngagement / 100) * 18);
  const totalEngagement = Math.round(totalReach * (avgEngagement / 100));

  const platformBreakdown = pool.map((a) => ({
    platform: a.platformId,
    followers: a.followers,
    share: totalFollowers ? (a.followers / totalFollowers) * 100 : 0,
  }));

  const seriesFollowers = Array.from({ length: Math.min(days, 12) }, (_, i) => {
    const step = totalFollowers * (growthPct / 100) / Math.min(days, 12);
    return {
      label: `D${i + 1}`,
      value: Math.round(totalFollowers - step * (Math.min(days, 12) - i)),
    };
  });

  const sectionBuilders: Record<string, () => ReportSectionData> = {
    "Follower Growth": () => ({
      section: "Follower Growth",
      summary: `Net ${fmt(Math.round(totalFollowers * (growthPct / 100)))} new followers over ${days} days.`,
      metrics: [
        { label: "Total followers", value: fmt(totalFollowers), delta: `+${pct(growthPct)}`, positive: true },
        { label: "Daily average", value: fmt(Math.round((totalFollowers * (growthPct / 100)) / days)), delta: `+${pct(growthPct / days)}`, positive: true },
        { label: "Best platform", value: pool[0]?.platformId ?? "instagram" },
        { label: "Retention", value: pct(92 + Math.random() * 3), positive: true },
      ],
      series: seriesFollowers,
    }),
    "Engagement Rate": () => ({
      section: "Engagement Rate",
      summary: `Average engagement rate ${pct(avgEngagement)} across ${pool.length || 1} accounts.`,
      metrics: [
        { label: "Avg. engagement", value: pct(avgEngagement), delta: "+0.4pt", positive: true },
        { label: "Likes", value: fmt(Math.round(totalEngagement * 0.72)) },
        { label: "Comments", value: fmt(Math.round(totalEngagement * 0.18)) },
        { label: "Shares", value: fmt(Math.round(totalEngagement * 0.10)) },
      ],
    }),
    "Top Posts": () => ({
      section: "Top Posts",
      summary: `Top 5 posts drove ${pct(28.4)} of total engagement.`,
      metrics: [
        { label: "Top post reach", value: fmt(Math.round(totalReach * 0.14)) },
        { label: "Top post engagement", value: pct(avgEngagement * 2.1) },
        { label: "Saves", value: fmt(Math.round(totalEngagement * 0.06)) },
        { label: "Reposts", value: fmt(Math.round(totalEngagement * 0.04)) },
      ],
    }),
    "Reach & Impressions": () => ({
      section: "Reach & Impressions",
      summary: `Reached ${fmt(totalReach)} unique accounts with ${fmt(Math.round(totalReach * 2.3))} impressions.`,
      metrics: [
        { label: "Reach", value: fmt(totalReach), delta: "+18.2%", positive: true },
        { label: "Impressions", value: fmt(Math.round(totalReach * 2.3)) },
        { label: "Profile visits", value: fmt(Math.round(totalReach * 0.09)) },
        { label: "Non-followers", value: pct(41.5) },
      ],
    }),
    "Growth Metrics": () => ({
      section: "Growth Metrics",
      summary: `Followers up ${pct(growthPct)} · content up ${pct(growthPct * 0.6)}.`,
      metrics: [
        { label: "Follower growth", value: pct(growthPct), positive: true },
        { label: "Content output", value: `${totalPosts} posts` },
        { label: "New leads", value: fmt(Math.round(totalFollowers * 0.012)) },
        { label: "Est. ROI", value: `${(2.4 + Math.random()).toFixed(1)}x` },
      ],
    }),
    "Audience Demographics": () => ({
      section: "Audience Demographics",
      summary: `Core audience 25-34 · majority mobile.`,
      metrics: [
        { label: "18-24", value: pct(28) },
        { label: "25-34", value: pct(41) },
        { label: "35-44", value: pct: 19 as never as string, } as ReportMetric,
        { label: "Mobile", value: pct(87) },
      ].map((m) => ({ ...m, value: typeof m.value === "string" ? m.value : `${m.value}%` })),
    }),
    "Content Performance": () => ({
      section: "Content Performance",
      summary: `Reels drive ${pct(58)} of engagement.`,
      metrics: [
        { label: "Reels ER", value: pct(avgEngagement + 2.1) },
        { label: "Carousel ER", value: pct(avgEngagement + 0.8) },
        { label: "Static ER", value: pct(avgEngagement - 1.2) },
        { label: "Stories completion", value: pct(78) },
      ],
    }),
    "Competitor Comparison": () => ({
      section: "Competitor Comparison",
      summary: `You outpaced 3 of 4 tracked competitors.`,
      metrics: [
        { label: "You growth", value: pct(growthPct), positive: true },
        { label: "Industry avg", value: pct(growthPct - 4.2) },
        { label: "Rank", value: "#2" },
        { label: "Share of voice", value: pct(23.4) },
      ],
    }),
    "Comment Analysis": () => ({
      section: "Comment Analysis",
      summary: `Comments up · positive sentiment dominates.`,
      metrics: [
        { label: "Total comments", value: fmt(Math.round(totalEngagement * 0.18)) },
        { label: "Positive", value: pct(72) },
        { label: "Negative", value: pct(6) },
        { label: "Avg response time", value: "1h 24m" },
      ],
    }),
    "Like Patterns": () => ({
      section: "Like Patterns",
      summary: `Peak likes on weekends between 6-9pm.`,
      metrics: [
        { label: "Total likes", value: fmt(Math.round(totalEngagement * 0.72)) },
        { label: "Peak day", value: "Saturday" },
        { label: "Peak hour", value: "7:00 PM" },
        { label: "Like rate", value: pct(avgEngagement * 0.85) },
      ],
    }),
    "Share Metrics": () => ({
      section: "Share Metrics",
      summary: `Shares grew ${pct(growthPct * 0.9)}.`,
      metrics: [
        { label: "Total shares", value: fmt(Math.round(totalEngagement * 0.10)) },
        { label: "Share rate", value: pct(avgEngagement * 0.12) },
        { label: "External shares", value: pct(34) },
        { label: "Viral coefficient", value: (0.4 + Math.random() * 0.3).toFixed(2) },
      ],
    }),
    "Save Rate": () => ({
      section: "Save Rate",
      summary: `Saves indicate strong content value.`,
      metrics: [
        { label: "Total saves", value: fmt(Math.round(totalEngagement * 0.06)) },
        { label: "Save rate", value: pct(avgEngagement * 0.07) },
        { label: "Educational content", value: pct(64) },
        { label: "Growth vs prior", value: pct(growthPct * 1.1), positive: true },
      ],
    }),
    "Top Content": () => ({
      section: "Top Content",
      summary: `5 posts drove majority of results.`,
      metrics: [
        { label: "Top format", value: "Reel" },
        { label: "Top topic", value: "How-to" },
        { label: "Avg. length", value: "18s" },
        { label: "CTA click-through", value: pct(3.8) },
      ],
    }),
    "Content Types": () => ({
      section: "Content Types",
      summary: `Mix skewed to video.`,
      metrics: [
        { label: "Video", value: pct(58) },
        { label: "Carousel", value: pct(24) },
        { label: "Static", value: pct(12) },
        { label: "Story", value: pct(6) },
      ],
    }),
    "Posting Times": () => ({
      section: "Posting Times",
      summary: `Best window: 6-9pm local.`,
      metrics: [
        { label: "Best day", value: "Wednesday" },
        { label: "Best hour", value: "7:00 PM" },
        { label: "Posts / week", value: `${Math.round(totalPosts / (days / 7))}` },
        { label: "Consistency", value: pct(88) },
      ],
    }),
    "Hashtag Performance": () => ({
      section: "Hashtag Performance",
      summary: `Niche tags outperformed broad ones by 2.4x.`,
      metrics: [
        { label: "Top tag reach", value: fmt(Math.round(totalReach * 0.22)) },
        { label: "Tags / post", value: "9" },
        { label: "Niche ER", value: pct(avgEngagement + 1.9) },
        { label: "Broad ER", value: pct(avgEngagement - 0.6) },
      ],
    }),
  };

  const built = sections
    .map((s) => sectionBuilders[s]?.())
    .filter((x): x is ReportSectionData => Boolean(x));

  return {
    generatedAt: new Date().toISOString(),
    period: range,
    totalFollowers,
    totalEngagement,
    totalReach,
    platformBreakdown,
    sections: built,
  };
}
