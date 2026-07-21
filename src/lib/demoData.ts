import { supabase } from "@/integrations/supabase/client";

const DEMO_FLAG_KEY = "smmpilot:demo-data-loaded";

interface HubSeed {
  key: string;
  title: string;
  status: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
}

const HUB_ITEMS: HubSeed[] = [
  { key: "audience-followers", title: "@jordan.creates", status: "engaged", subtitle: "34k · Instagram · engages weekly" },
  { key: "audience-followers", title: "@marta.design", status: "watching", subtitle: "8k · Instagram · new this week" },
  { key: "audience-followers", title: "@kenf", status: "churned", subtitle: "22k · Twitter · quiet 30d" },
  { key: "audience-competitors", title: "@rivalstudio", status: "priority", subtitle: "120k · posts 4x/wk" },
  { key: "audience-competitors", title: "@nichequeen", status: "tracking", subtitle: "45k · posts 2x/wk" },
  { key: "create-briefs", title: "Product-hunt launch teaser", status: "draft", subtitle: "3-post series announcing launch day" },
  { key: "create-briefs", title: "Weekly customer spotlight", status: "ready", subtitle: "Interview snippet + carousel testimonial" },
];

const SEGMENTS = [
  {
    title: "Micro fitness creators",
    description: "US-based creators, 1–10k, high engagement, wellness niche",
    status: "active",
    niche: "Fitness & wellness",
    platforms: ["instagram", "tiktok"],
    follower_bucket: "10k",
    engagement_bucket: "high",
    keywords: ["fitness", "wellness", "workout"],
  },
  {
    title: "SaaS founders",
    description: "LinkedIn + X, mid-tier, product & startup keywords",
    status: "testing",
    niche: "SaaS & tech",
    platforms: ["linkedin", "twitter"],
    follower_bucket: "100k",
    engagement_bucket: "mid",
    keywords: ["saas", "founder", "startup"],
  },
];

export async function loadDemoData(userId: string): Promise<{ inserted: number }> {
  const rows = HUB_ITEMS.map((h) => ({
    user_id: userId,
    hub_key: h.key,
    title: h.title,
    status: h.status,
    subtitle: h.subtitle,
    metadata: (h.metadata ?? {}) as never,
  }));
  const { error: hubErr } = await supabase.from("hub_items").insert(rows);
  if (hubErr) throw hubErr;

  const segRows = SEGMENTS.map((s) => ({ user_id: userId, ...s }));
  const { error: segErr } = await supabase.from("audience_segments").insert(segRows);
  if (segErr) throw segErr;

  try { localStorage.setItem(DEMO_FLAG_KEY, "1"); } catch { /* ignore */ }
  return { inserted: rows.length + segRows.length };
}

export function hasLoadedDemo(): boolean {
  try { return localStorage.getItem(DEMO_FLAG_KEY) === "1"; } catch { return false; }
}
