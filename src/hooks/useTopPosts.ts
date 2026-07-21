import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGuest } from "@/hooks/useGuest";
import { useAccounts, type ConnectedAccount } from "@/contexts/AccountContext";

export type TopPostSort = "engagement" | "reach" | "likes" | "saves" | "shares";

export interface TopPost {
  id: string;
  postId: string;
  accountId: string;
  account?: ConnectedAccount;
  caption: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  engagement: number;
}

interface Opts {
  days: number;
  sort?: TopPostSort;
  platform?: string;
  limit?: number;
}

/**
 * Latest per-post metric snapshot for the caller, joined with scheduled_posts
 * for the caption and social_accounts for platform metadata. Guests receive
 * an empty list — the leaderboard's own guest branch synthesises a demo.
 */
export function useTopPosts({ days, sort = "engagement", platform, limit = 6 }: Opts) {
  const { isGuest } = useGuest();
  const { accounts } = useAccounts();
  const [rows, setRows] = useState<TopPost[] | null>(null);
  const [loading, setLoading] = useState(!isGuest);

  useEffect(() => {
    if (isGuest) { setRows(null); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - days * 86_400_000).toISOString();
      const { data, error } = await supabase
        .from("post_metrics")
        .select("id, post_id, account_id, captured_at, impressions, reach, likes, comments, shares, saves")
        .gte("captured_at", since)
        .order("captured_at", { ascending: false })
        .limit(2000);
      if (cancelled) return;
      if (error) { setRows([]); setLoading(false); return; }
      // Reduce to the latest snapshot per post_id.
      const latest = new Map<string, typeof data[number]>();
      for (const row of data ?? []) {
        if (!latest.has(row.post_id)) latest.set(row.post_id, row);
      }
      const postIds = Array.from(latest.keys());
      if (postIds.length === 0) { setRows([]); setLoading(false); return; }

      const { data: posts } = await supabase
        .from("scheduled_posts")
        .select("id, caption, sent_at, scheduled_at, platform_ids")
        .in("id", postIds);
      const postById = new Map((posts ?? []).map((p: any) => [p.id, p]));

      const out: TopPost[] = [];
      for (const m of latest.values()) {
        const post = postById.get(m.post_id);
        if (!post) continue;
        const account = accounts.find((a) => a.id === m.account_id);
        if (platform && account && account.platformId !== platform) continue;
        const likes = m.likes ?? 0;
        const comments = m.comments ?? 0;
        const shares = m.shares ?? 0;
        const saves = m.saves ?? 0;
        const reach = m.reach ?? 0;
        const engagement = reach > 0
          ? ((likes + comments * 2 + shares * 3 + saves * 2) / reach) * 100
          : 0;
        out.push({
          id: m.id,
          postId: m.post_id,
          accountId: m.account_id,
          account,
          caption: post.caption ?? "(untitled)",
          publishedAt: post.sent_at ?? post.scheduled_at,
          likes, comments, shares, saves,
          reach,
          impressions: m.impressions ?? 0,
          engagement: +engagement.toFixed(2),
        });
      }
      setRows(out);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [isGuest, days, platform, accounts.length]);

  const sorted = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => b[sort] - a[sort]).slice(0, limit);
  }, [rows, sort, limit]);

  return { posts: sorted, all: rows ?? [], loading };
}
