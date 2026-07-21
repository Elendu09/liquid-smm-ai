
CREATE TABLE public.audience_segments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'testing',
  niche TEXT,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  follower_bucket TEXT NOT NULL DEFAULT 'any',
  engagement_bucket TEXT NOT NULL DEFAULT 'any',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audience_segments TO authenticated;
GRANT ALL ON public.audience_segments TO service_role;

ALTER TABLE public.audience_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own segments"
  ON public.audience_segments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER audience_segments_set_updated_at
  BEFORE UPDATE ON public.audience_segments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.audience_segments;
