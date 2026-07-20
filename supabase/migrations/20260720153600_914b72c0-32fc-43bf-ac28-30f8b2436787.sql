ALTER TABLE public.notification_webhooks
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS last_status_label text;