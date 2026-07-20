
CREATE TABLE public.scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caption TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  timezone TEXT,
  platform_ids TEXT[] NOT NULL DEFAULT '{}',
  platform_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  hashtags TEXT[],
  first_comment TEXT,
  series_id UUID,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','paused','sending','completed','failed')),
  send_progress INTEGER,
  error TEXT,
  sent_at TIMESTAMPTZ,
  approval_status TEXT
    CHECK (approval_status IN ('draft','pending','approved','rejected')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  recycle_rule_id TEXT,
  category_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_posts TO authenticated;
GRANT ALL ON public.scheduled_posts TO service_role;

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scheduled posts"
  ON public.scheduled_posts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_scheduled_posts_user_time
  ON public.scheduled_posts(user_id, scheduled_at);
CREATE INDEX idx_scheduled_posts_series
  ON public.scheduled_posts(series_id) WHERE series_id IS NOT NULL;

CREATE TRIGGER trg_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
