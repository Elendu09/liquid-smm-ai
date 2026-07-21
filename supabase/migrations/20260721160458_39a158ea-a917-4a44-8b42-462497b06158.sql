
CREATE OR REPLACE FUNCTION public.analytics_overview_totals(_user_id uuid, _since timestamptz)
RETURNS TABLE(impressions bigint, reach bigint, engaged bigint, clicks bigint, post_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(impressions), 0)::bigint,
    COALESCE(SUM(reach), 0)::bigint,
    COALESCE(SUM(COALESCE(likes,0)+COALESCE(comments,0)+COALESCE(shares,0)+COALESCE(saves,0)), 0)::bigint,
    COALESCE(SUM(clicks), 0)::bigint,
    COUNT(*)::bigint
  FROM public.post_metrics
  WHERE user_id = _user_id
    AND captured_at >= _since
    AND (auth.uid() = _user_id OR auth.uid() IS NULL);
$$;

REVOKE ALL ON FUNCTION public.analytics_overview_totals(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_overview_totals(uuid, timestamptz) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.analytics_overview_top_posts(_user_id uuid, _since timestamptz, _limit int DEFAULT 10)
RETURNS TABLE(post_id uuid, likes int, comments int, shares int, saves int, reach int, impressions int)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT post_id, likes, comments, shares, saves, reach, impressions
  FROM public.post_metrics
  WHERE user_id = _user_id
    AND captured_at >= _since
    AND (auth.uid() = _user_id OR auth.uid() IS NULL)
  ORDER BY reach DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(_limit, 50));
$$;

REVOKE ALL ON FUNCTION public.analytics_overview_top_posts(uuid, timestamptz, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_overview_top_posts(uuid, timestamptz, int) TO authenticated, service_role;
