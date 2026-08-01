CREATE OR REPLACE FUNCTION public.public_fulfillment_pulse()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'queued', (SELECT count(*) FROM public.scheduled_posts WHERE status = 'queued'),
    'sending', (SELECT count(*) FROM public.scheduled_posts WHERE status = 'sending'),
    'completed_24h', (SELECT count(*) FROM public.scheduled_posts WHERE status = 'completed' AND sent_at > now() - interval '24 hours'),
    'failed_24h', (SELECT count(*) FROM public.scheduled_posts WHERE status = 'failed' AND updated_at > now() - interval '24 hours'),
    'completed_total', (SELECT count(*) FROM public.scheduled_posts WHERE status = 'completed'),
    'accounts', (SELECT count(*) FROM public.social_accounts),
    'hourly', (
      SELECT coalesce(jsonb_agg(c ORDER BY h), '[]'::jsonb)
      FROM (
        SELECT gs AS h,
          (SELECT count(*) FROM public.scheduled_posts sp
            WHERE sp.status = 'completed'
              AND sp.sent_at >= now() - ((24 - gs) * interval '1 hour')
              AND sp.sent_at <  now() - ((23 - gs) * interval '1 hour')) AS c
        FROM generate_series(0, 23) AS gs
      ) t
    ),
    'generated_at', now()
  );
$$;

REVOKE ALL ON FUNCTION public.public_fulfillment_pulse() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_fulfillment_pulse() TO anon, authenticated, service_role;