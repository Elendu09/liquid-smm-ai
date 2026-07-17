
SELECT cron.unschedule('notif-digest-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='notif-digest-daily');
SELECT cron.unschedule('notif-digest-weekly') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='notif-digest-weekly');

SELECT cron.schedule(
  'notif-digest-daily',
  '0 8 * * *',
  $$ SELECT net.http_post(
    url := 'https://ntbtbzssdwkbrfcmqyfc.supabase.co/functions/v1/notif-digest?mode=daily',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  ) $$
);

SELECT cron.schedule(
  'notif-digest-weekly',
  '0 8 * * 1',
  $$ SELECT net.http_post(
    url := 'https://ntbtbzssdwkbrfcmqyfc.supabase.co/functions/v1/notif-digest?mode=weekly',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  ) $$
);
