import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGuest } from "@/hooks/useGuest";

export interface PostMetricRow {
  id: string;
  post_id: string;
  account_id: string;
  captured_at: string;
  impressions: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  clicks: number | null;
  video_views: number | null;
}

/**
 * Latest per-post engagement snapshots for the current user. Guests get an
 * empty list — the Analytics page synthesises demo trends separately.
 */
export function usePostMetrics(postId?: string) {
  const { isGuest: guest } = useGuest();
  const [rows, setRows] = useState<PostMetricRow[]>([]);
  const [loading, setLoading] = useState(!guest);

  useEffect(() => {
    if (guest) { setRows([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      let q = supabase
        .from("post_metrics")
        .select("id, post_id, account_id, captured_at, impressions, reach, likes, comments, shares, saves, clicks, video_views")
        .order("captured_at", { ascending: false })
        .limit(500);
      if (postId) q = q.eq("post_id", postId);
      const { data } = await q;
      if (cancelled) return;
      setRows((data ?? []) as PostMetricRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [guest, postId]);

  return { rows, loading };
}
