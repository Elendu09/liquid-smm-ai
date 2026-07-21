
CREATE OR REPLACE FUNCTION public.refresh_platform_rollup(_user_id uuid, _days integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  inserted INTEGER := 0;
BEGIN
  -- Only allow a caller to refresh their own rollups. Service role bypasses auth.uid()
  -- and is allowed (used by the analytics-rollup edge function).
  IF auth.uid() IS NOT NULL AND _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

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
$function$;

-- Revoke execute from anon/authenticated; only service_role (edge functions) may call it.
REVOKE EXECUTE ON FUNCTION public.refresh_platform_rollup(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_platform_rollup(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_platform_rollup(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_platform_rollup(uuid, integer) TO service_role;
