
CREATE INDEX IF NOT EXISTS idx_amd_user_day ON public.account_metrics_daily (user_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_amd_account_day ON public.account_metrics_daily (account_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_post_metrics_user_captured ON public.post_metrics (user_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_metrics_post ON public.post_metrics (post_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_follower_snap_account_captured ON public.follower_snapshots (account_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_time ON public.scheduled_posts (user_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON public.scheduled_posts (status, scheduled_at);

CREATE TABLE IF NOT EXISTS public.platform_rollup_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  day DATE NOT NULL,
  followers BIGINT NOT NULL DEFAULT 0,
  engagement NUMERIC NOT NULL DEFAULT 0,
  reach BIGINT NOT NULL DEFAULT 0,
  impressions BIGINT NOT NULL DEFAULT 0,
  posts INTEGER NOT NULL DEFAULT 0,
  accounts INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, day)
);

GRANT SELECT ON public.platform_rollup_daily TO authenticated;
GRANT ALL ON public.platform_rollup_daily TO service_role;

ALTER TABLE public.platform_rollup_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own rollups" ON public.platform_rollup_daily;
CREATE POLICY "Users read own rollups" ON public.platform_rollup_daily
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_prd_user_day ON public.platform_rollup_daily (user_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_prd_user_platform_day ON public.platform_rollup_daily (user_id, platform, day DESC);

CREATE OR REPLACE FUNCTION public.refresh_platform_rollup(_user_id UUID, _days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted INTEGER := 0;
BEGIN
  DELETE FROM public.platform_rollup_daily
   WHERE user_id = _user_id
     AND day >= (CURRENT_DATE - (_days || ' days')::interval)::date;

  INSERT INTO public.platform_rollup_daily
    (user_id, platform, day, followers, engagement, reach, impressions, posts, accounts)
  SELECT
    amd.user_id,
    COALESCE(sa.platform, 'unknown') AS platform,
    amd.day,
    COALESCE(SUM(amd.followers), 0)::bigint,
    COALESCE(AVG(amd.engagement), 0)::numeric,
    COALESCE(SUM(amd.reach), 0)::bigint,
    COALESCE(SUM(amd.impressions), 0)::bigint,
    COALESCE(SUM(amd.posts), 0)::int,
    COUNT(DISTINCT amd.account_id)::int
  FROM public.account_metrics_daily amd
  LEFT JOIN public.social_accounts sa ON sa.id = amd.account_id
  WHERE amd.user_id = _user_id
    AND amd.day >= (CURRENT_DATE - (_days || ' days')::interval)::date
  GROUP BY amd.user_id, sa.platform, amd.day;

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_platform_rollup(UUID, INTEGER) TO authenticated, service_role;
