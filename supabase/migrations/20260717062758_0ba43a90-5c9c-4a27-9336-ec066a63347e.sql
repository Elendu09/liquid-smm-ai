
CREATE TABLE IF NOT EXISTS public.notification_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label TEXT,
  url TEXT NOT NULL,
  secret TEXT,
  event_types TEXT[] NOT NULL DEFAULT ARRAY['*'],
  active BOOLEAN NOT NULL DEFAULT true,
  last_fired_at TIMESTAMPTZ,
  last_status INT,
  failure_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_webhooks TO authenticated;
GRANT ALL ON public.notification_webhooks TO service_role;
ALTER TABLE public.notification_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own webhooks" ON public.notification_webhooks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_notification_webhooks_updated
  BEFORE UPDATE ON public.notification_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_id UUID,
  event TEXT NOT NULL,
  notif_type TEXT,
  notif_severity TEXT,
  rule_key TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.notification_events TO authenticated;
GRANT ALL ON public.notification_events TO service_role;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events read" ON public.notification_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own events insert" ON public.notification_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notif_events_user_created
  ON public.notification_events(user_id, created_at DESC);

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS auto_tune_enabled BOOLEAN NOT NULL DEFAULT true;
