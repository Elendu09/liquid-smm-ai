-- Schedule notification detectors on cron. Each call authenticates via
-- x-cron-secret so the edge function's requireCronOrService gate passes.
DO $$
DECLARE
  jobs text[] := ARRAY[
    'notif-detect-engagement',
    'notif-detect-health',
    'notif-detect-milestones',
    'notif-detect-extra'
  ];
  j text;
BEGIN
  FOREACH j IN ARRAY jobs LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = j) THEN
      PERFORM cron.unschedule(j);
    END IF;
  END LOOP;
END $$;

SELECT cron.schedule(
  'notif-detect-engagement',
  '*/15 * * * *',
  $$ SELECT net.http_post(
    url := 'https://ntbtbzssdwkbrfcmqyfc.supabase.co/functions/v1/notif-detect-engagement',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', current_setting('app.cron_secret', true)),
    body := '{}'::jsonb
  ) $$
);

SELECT cron.schedule(
  'notif-detect-health',
  '*/15 * * * *',
  $$ SELECT net.http_post(
    url := 'https://ntbtbzssdwkbrfcmqyfc.supabase.co/functions/v1/notif-detect-health',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', current_setting('app.cron_secret', true)),
    body := '{}'::jsonb
  ) $$
);

SELECT cron.schedule(
  'notif-detect-milestones',
  '*/30 * * * *',
  $$ SELECT net.http_post(
    url := 'https://ntbtbzssdwkbrfcmqyfc.supabase.co/functions/v1/notif-detect-milestones',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', current_setting('app.cron_secret', true)),
    body := '{}'::jsonb
  ) $$
);

SELECT cron.schedule(
  'notif-detect-extra',
  '*/20 * * * *',
  $$ SELECT net.http_post(
    url := 'https://ntbtbzssdwkbrfcmqyfc.supabase.co/functions/v1/notif-detect-extra',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', current_setting('app.cron_secret', true)),
    body := '{}'::jsonb
  ) $$
);