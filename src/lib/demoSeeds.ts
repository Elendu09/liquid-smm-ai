import type { ScheduledPost } from "@/hooks/useScheduledPosts";
import type { RunRecord } from "@/hooks/useRunHistory";
import type { ReportRun } from "@/hooks/useReportRuns";
import type { ReportSchedule } from "@/hooks/useReportSchedules";

const now = Date.now();
const iso = (offsetDays: number, hour = 10) => {
  const d = new Date(now + offsetDays * 86400000);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const DEMO_SCHEDULED_POSTS: ScheduledPost[] = [
  { id: "demo-post-1", caption: "Spring launch teaser — something big drops Friday 🚀 Save for later!", mediaUrl: "https://images.unsplash.com/photo-1611162616805-e7e1dd64fe4e?w=800", scheduledAt: iso(1, 9), createdAt: iso(-6), platformIds: ["instagram", "tiktok"], hashtags: ["#launch", "#sneakpeek"], status: "queued" },
  { id: "demo-post-2", caption: "Behind the scenes: how we design our carousel templates 🎨 Thread below 👇", scheduledAt: iso(0, 14), createdAt: iso(-5), platformIds: ["linkedin", "twitter"], hashtags: ["#design", "#buildinpublic"], status: "sending", sendProgress: 42 },
  { id: "demo-post-3", caption: "Weekly tip: 3 hooks that doubled our save rate (tested on 50 posts)", scheduledAt: iso(-1, 11), createdAt: iso(-7), platformIds: ["instagram"], hashtags: ["#growth", "#contenttips"], status: "completed", sentAt: iso(-1) },
  { id: "demo-post-4", caption: "Customer spotlight — @marta.design hit 10k in 30 days using our scheduler ✨", mediaUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800", scheduledAt: iso(-2, 16), createdAt: iso(-8), platformIds: ["facebook", "instagram"], hashtags: ["#socialproof"], status: "completed", sentAt: iso(-2) },
  { id: "demo-post-5", caption: "This post failed to publish — IG token expired (demo of error handling)", scheduledAt: iso(-0.2, 8), createdAt: iso(-1), platformIds: ["instagram"], hashtags: [], status: "failed", error: "IG API 190: Token expired. Re-auth required." },
  { id: "demo-post-6", caption: "Pausing this queue for review — approval chain demo", scheduledAt: iso(2, 10), createdAt: iso(-4), platformIds: ["tiktok", "youtube"], hashtags: ["#paused"], status: "paused" },
  { id: "demo-post-7", caption: "Black Friday countdown Day 3 — 40% off our Pro plan. Link in bio.", scheduledAt: iso(3, 12), createdAt: iso(-3), platformIds: ["instagram", "facebook", "tiktok"], hashtags: ["#blackfriday"], status: "queued" },
  { id: "demo-post-8", caption: "Recycled evergreen: How to write captions that trigger saves (reposted)", scheduledAt: iso(4, 15), createdAt: iso(-10), platformIds: ["linkedin"], hashtags: ["#evergreen", "#recycle"], status: "queued", recycleRuleId: "demo-recycle-1" },
];

export const DEMO_RUN_HISTORY: RunRecord[] = [
  { id: "run-1", toolKey: "caption-generator", action: "Generated 3 caption variants", platform: "instagram", accountHandle: "smmpilot", status: "success", durationMs: 1240, createdAt: iso(0, 9) },
  { id: "run-2", toolKey: "scheduler", action: "Queued 5 posts to Instagram + TikTok", platform: "tiktok", accountHandle: "smmpilot_official", status: "success", durationMs: 890, createdAt: iso(-1, 10) },
  { id: "run-3", toolKey: "hashtag-research", action: "Researched 12 hashtags for #launch", platform: "instagram", status: "success", durationMs: 2100, createdAt: iso(-1, 11) },
  { id: "run-4", toolKey: "publish", action: "Failed to publish — token expired", platform: "instagram", status: "failed", error: "IG 190: Token expired", durationMs: 340, createdAt: iso(-0.2, 8) },
  { id: "run-5", toolKey: "automation", action: "Welcome DM sent to @marta.design", platform: "instagram", status: "success", durationMs: 560, createdAt: iso(-2, 14) },
  { id: "run-6", toolKey: "analytics", action: "Weekly summary generated", status: "success", durationMs: 780, createdAt: iso(-3, 9) },
  { id: "run-7", toolKey: "competitor-tracker", action: "Compared @rivalstudio vs @smmpilot", status: "success", durationMs: 1100, createdAt: iso(-4, 15) },
  { id: "run-8", toolKey: "scheduler", action: "Paused 8 posts for campaign review", status: "success", durationMs: 430, createdAt: iso(-2, 16) },
  { id: "run-9", toolKey: "report", action: "Exported PDF — Weekly Growth", status: "success", durationMs: 2100, createdAt: iso(-5, 10) },
  { id: "run-10", toolKey: "inbox", action: "Assigned @jordan.creates comment to @sam", platform: "tiktok", status: "success", durationMs: 320, createdAt: iso(-6, 12) },
];

export const DEMO_REPORT_RUNS: Omit<ReportRun, "data">[] = [
  { id: "rep-1", name: "Weekly Summary — Feb 3", template: "Weekly Summary", period: "Jan 27 - Feb 2", format: "pdf", size: "1.2 MB", sizeBytes: 1200000, sections: ["overview", "top-posts"], status: "ready", whitelabel: false, createdAt: iso(-7) },
  { id: "rep-2", name: "Monthly Growth — Jan", template: "Monthly Growth", period: "Jan 1 - Jan 31", format: "pdf", size: "2.4 MB", sizeBytes: 2400000, sections: ["overview", "audience"], status: "ready", whitelabel: true, createdAt: iso(-14) },
  { id: "rep-3", name: "Engagement Analysis", template: "Engagement Analysis", period: "Last 30 days", format: "csv", size: "340 KB", sizeBytes: 340000, sections: ["engagement"], status: "ready", whitelabel: false, createdAt: iso(-3) },
  { id: "rep-4", name: "Content Performance — BF", template: "Content Performance", period: "Nov 20-30", format: "pdf", size: "980 KB", sizeBytes: 980000, sections: ["top-posts", "benchmarks"], status: "ready", whitelabel: true, createdAt: iso(-30) },
  { id: "rep-5", name: "Competitor Benchmark", template: "Custom", period: "Last 90 days", format: "pdf", size: "1.8 MB", sizeBytes: 1800000, sections: ["benchmarks"], status: "ready", whitelabel: false, createdAt: iso(-1) },
] as unknown as ReportRun[];

export const DEMO_REPORT_SCHEDULES: Partial<ReportSchedule>[] = [
  { id: "sched-1", name: "Weekly client report", templateId: "weekly", cadence: "weekly-mon", format: "pdf", recipients: ["client@brand.com"], createdAt: iso(-10) },
  { id: "sched-2", name: "Monthly internal", templateId: "monthly", cadence: "monthly", format: "pdf", recipients: ["team@smmsaas.com"], createdAt: iso(-20) },
  { id: "sched-3", name: "Daily digest", templateId: "engagement", cadence: "daily", format: "csv", recipients: [], createdAt: iso(-5) },
] as ReportSchedule[];

export const DEMO_WEBHOOKS = [
  { id: "wh-1", url: "https://hooks.example.com/publish", event: "post.published", secret: "••••", isActive: true, createdAt: iso(-12) },
  { id: "wh-2", url: "https://make.n8n.example.com/webhook", event: "inbox.new", secret: "••••", isActive: true, createdAt: iso(-8) },
];

export const DEMO_SAVED_VIEWS = [
  { id: "view-1", scope: "queue", name: "Only Instagram", filters: { platform: "instagram" }, createdAt: iso(-2) },
  { id: "view-2", scope: "inbox", name: "Ad comments", filters: { isAd: true }, createdAt: iso(-4) },
];

export const DEMO_STORIES = [
  { id: "story-1", platform: "instagram", caption: "Launch story — 9:16 teaser", mediaUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=600", status: "queued", scheduledAt: iso(1, 18) },
  { id: "story-2", platform: "tiktok", caption: "Behind the scenes clip", mediaUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600", status: "sending", scheduledAt: iso(0, 19) },
  { id: "story-3", platform: "youtube", caption: "Shorts — 3 hooks", status: "completed", scheduledAt: iso(-2, 20) },
  { id: "story-4", platform: "instagram", caption: "Poll story — which cover?", status: "failed", error: "Cover frame 0:12 exceeds 60s", scheduledAt: iso(-1, 21) },
];
