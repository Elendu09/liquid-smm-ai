-- ============================================================
-- Phase 1: Notifications data foundation
-- ============================================================

-- Shared updated_at trigger (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('engagement','milestone','alert','reminder','system')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','success','warning','critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metric JSONB,
  platform_id TEXT,
  post_id TEXT,
  account_id TEXT,
  action_url TEXT,
  group_key TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read_at);
CREATE UNIQUE INDEX idx_notifications_user_group ON public.notifications(user_id, group_key) WHERE group_key IS NOT NULL;

CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ------------------------------------------------------------
-- notification_preferences (one row per user)
-- ------------------------------------------------------------
CREATE TABLE public.notification_preferences (
  user_id UUID NOT NULL PRIMARY KEY,
  channels JSONB NOT NULL DEFAULT '{
    "engagement":{"inapp":true,"toast":true,"email":false,"push":false},
    "milestone": {"inapp":true,"toast":true,"email":false,"push":false},
    "alert":     {"inapp":true,"toast":true,"email":true, "push":true},
    "reminder":  {"inapp":true,"toast":false,"email":false,"push":false},
    "system":    {"inapp":true,"toast":false,"email":false,"push":false}
  }'::jsonb,
  quiet_hours JSONB NOT NULL DEFAULT '{"enabled":false,"start":"22:00","end":"08:00","tz":"UTC"}'::jsonb,
  digest_mode TEXT NOT NULL DEFAULT 'off' CHECK (digest_mode IN ('off','daily','weekly')),
  muted_platforms TEXT[] NOT NULL DEFAULT '{}',
  muted_accounts TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON public.notification_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- notification_rules (per-user tunable thresholds)
-- ------------------------------------------------------------
CREATE TABLE public.notification_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('engagement','milestone','alert','reminder','system')),
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, rule_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_rules TO authenticated;
GRANT ALL ON public.notification_rules TO service_role;

ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rules"
  ON public.notification_rules FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_notification_rules_user ON public.notification_rules(user_id);

CREATE TRIGGER trg_notification_rules_updated_at
  BEFORE UPDATE ON public.notification_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- post_metrics_baseline (backend-only)
-- ------------------------------------------------------------
CREATE TABLE public.post_metrics_baseline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id TEXT NOT NULL,
  metric TEXT NOT NULL,
  window_hours INTEGER NOT NULL DEFAULT 168,
  value NUMERIC NOT NULL DEFAULT 0,
  sample_size INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, account_id, metric, window_hours)
);

GRANT ALL ON public.post_metrics_baseline TO service_role;
GRANT SELECT ON public.post_metrics_baseline TO authenticated;

ALTER TABLE public.post_metrics_baseline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own baselines"
  ON public.post_metrics_baseline FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_baseline_user_account ON public.post_metrics_baseline(user_id, account_id);

CREATE TRIGGER trg_post_metrics_baseline_updated_at
  BEFORE UPDATE ON public.post_metrics_baseline
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- milestone_state (backend-only)
-- ------------------------------------------------------------
CREATE TABLE public.milestone_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id TEXT NOT NULL,
  metric TEXT NOT NULL,
  last_threshold NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, account_id, metric)
);

GRANT ALL ON public.milestone_state TO service_role;
GRANT SELECT ON public.milestone_state TO authenticated;

ALTER TABLE public.milestone_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own milestone state"
  ON public.milestone_state FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_milestone_user_account ON public.milestone_state(user_id, account_id);

CREATE TRIGGER trg_milestone_state_updated_at
  BEFORE UPDATE ON public.milestone_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();